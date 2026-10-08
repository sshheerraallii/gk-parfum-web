import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError, QueryContext } from "@medusajs/framework/utils"
import { allocate, BUNDLE_DELIVERY_CODE, GIFT_BOX_SKU, type Unit } from "../../lib/offers"
import { GK_SETTINGS_MODULE } from "../../modules/gk-settings"
import type GkSettingsService from "../../modules/gk-settings/service"
import type { PricedVariant } from "../../lib/query-types"

export type PlanGkCartInput = {
  cart_id: string
  lines: { variant_id: string; quantity: number; subscribe?: boolean }[]
}

export type PlannedItem = {
  variant_id: string
  quantity: number
  unit_price: number
  metadata: Record<string, unknown>
}

/**
 * Works out what the cart should contain: real catalogue prices for each bottle with the
 * bundle tier or subscribe-and-save discount applied, plus the free gift box.
 * Only variant IDs, quantities and the subscribe choice come from the shopper — never prices.
 */
export const planGkCartStep = createStep("plan-gk-cart", async (input: PlanGkCartInput, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const settings = container.resolve<GkSettingsService>(GK_SETTINGS_MODULE)
  const offers = await settings.getOffers()

  const {
    data: [cart],
  } = await query.graph({
    entity: "cart",
    fields: ["id", "region_id", "currency_code", "completed_at", "items.id", "promotions.code", "shipping_methods.id"],
    filters: { id: input.cart_id },
  })
  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
  }
  if (cart.completed_at) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This order has already been placed")
  }

  const { data: boxVariants } = await query.graph({
    entity: "product_variant",
    fields: ["id"],
    filters: { sku: GIFT_BOX_SKU },
  })
  const boxId = boxVariants[0]?.id

  // quantities per (variant, subscribe)
  const qty = new Map<string, { variant_id: string; sub: boolean; n: number }>()
  for (const l of input.lines) {
    if (l.quantity <= 0 || l.variant_id === boxId) {
      continue
    }
    const sub = !!l.subscribe && offers.subscription.enabled
    const k = `${l.variant_id}|${sub}`
    const ex = qty.get(k)
    qty.set(k, { variant_id: l.variant_id, sub, n: Math.min(20, (ex?.n ?? 0) + Math.floor(l.quantity)) })
  }

  const variantIds = [...new Set([...qty.values()].map((q) => q.variant_id))]
  const prices = new Map<string, number>()
  if (variantIds.length) {
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "calculated_price.calculated_amount"],
      filters: { id: variantIds },
      context: {
        calculated_price: QueryContext({ region_id: cart.region_id, currency_code: cart.currency_code }),
      },
    })
    for (const v of variants as unknown as PricedVariant[]) {
      const amount = Number(v.calculated_price?.calculated_amount)
      if (Number.isFinite(amount)) {
        prices.set(v.id, amount)
      }
    }
  }

  const units: Unit[] = [...qty.values()].flatMap((q) => {
    const base = prices.get(q.variant_id)
    if (base === undefined) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Product ${q.variant_id} is not available`)
    }
    return Array.from({ length: q.n }, () => ({ variant_id: q.variant_id, base, sub: q.sub }))
  })

  const plan = allocate(units, offers)
  const grouped = new Map<string, PlannedItem>()
  for (const u of plan.units) {
    const key = `${u.variant_id}|${u.charged}|${u.sub}`
    const ex = grouped.get(key)
    if (ex) {
      ex.quantity += 1
      continue
    }
    const metadata: Record<string, unknown> = {}
    if (u.reason === "tier") {
      metadata.gk_discount = `Bundle ${offers.tiers.discountPct}% off`
    }
    if (u.reason === "subscription") {
      metadata.gk_discount = `Subscribe & save ${offers.subscription.pct}% off`
    }
    if (u.sub) {
      metadata.gk_subscription = `Every ${offers.subscription.weeks} weeks`
    }
    grouped.set(key, { variant_id: u.variant_id, quantity: 1, unit_price: u.charged, metadata })
  }
  const items = [...grouped.values()]

  if (boxId && offers.giftBox.enabled && units.length > 0) {
    items.push({ variant_id: boxId, quantity: 1, unit_price: 0, metadata: { gk_gift_box: "Free with every order" } })
  }

  const hasCode = (cart.promotions ?? []).some((p) => p?.code === BUNDLE_DELIVERY_CODE)
  // A delivery promotion only sticks once the cart has a delivery method, so the storefront
  // syncs again straight after delivery is chosen.
  const hasShipping = (cart.shipping_methods ?? []).length > 0
  return new StepResponse({
    remove: (cart.items ?? []).map((i) => i!.id),
    items,
    addDeliveryCode: plan.freeShip && !hasCode && hasShipping,
    removeDeliveryCode: !plan.freeShip && hasCode,
  })
})
