import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError, QueryContext } from "@medusajs/framework/utils"
import { allocate, GIFT_BOX_SKU } from "../../lib/offers"
import { GK_SETTINGS_MODULE } from "../../modules/gk-settings"
import type GkSettingsService from "../../modules/gk-settings/service"
import type { PricedVariant } from "../../lib/query-types"

export type PlanGkCartInput = {
  cart_id: string
  lines: { variant_id: string; quantity: number }[]
  gift_boxes: number
}

export type PlannedItem = {
  variant_id: string
  quantity: number
  unit_price: number
  metadata: Record<string, unknown>
}

/**
 * Works out what the cart should contain: real catalogue prices for each bottle,
 * the bundle price applied to complete groups, plus any gift boxes.
 * Only variant IDs and quantities come from the shopper — never prices.
 */
export const planGkCartStep = createStep("plan-gk-cart", async (input: PlanGkCartInput, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const settings = container.resolve<GkSettingsService>(GK_SETTINGS_MODULE)
  const offers = await settings.getOffers()

  const {
    data: [cart],
  } = await query.graph({
    entity: "cart",
    fields: ["id", "region_id", "currency_code", "completed_at", "items.id"],
    filters: { id: input.cart_id },
  })
  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
  }
  if (cart.completed_at) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This order has already been placed")
  }

  const qty = new Map<string, number>()
  for (const l of input.lines) {
    if (l.quantity > 0) {
      qty.set(l.variant_id, Math.min(20, (qty.get(l.variant_id) ?? 0) + Math.floor(l.quantity)))
    }
  }

  const { data: boxVariants } = await query.graph({
    entity: "product_variant",
    fields: ["id"],
    filters: { sku: GIFT_BOX_SKU },
  })
  const boxId = boxVariants[0]?.id
  if (boxId) {
    qty.delete(boxId)
  }

  const variantIds = [...qty.keys()]
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

  const units = variantIds.flatMap((id) => {
    const base = prices.get(id)
    if (base === undefined) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Product ${id} is not available`)
    }
    return Array.from({ length: qty.get(id)! }, () => ({ variant_id: id, base }))
  })

  // group identical (variant, charged price, bundled) units into line items
  const grouped = new Map<string, PlannedItem>()
  for (const u of allocate(units, offers)) {
    const key = `${u.variant_id}|${u.charged}|${u.bundled}`
    const ex = grouped.get(key)
    if (ex) {
      ex.quantity += 1
    } else {
      grouped.set(key, {
        variant_id: u.variant_id,
        quantity: 1,
        unit_price: u.charged,
        metadata: u.bundled ? { gk_bundle: offers.bundle.label } : {},
      })
    }
  }
  const items = [...grouped.values()]

  if (boxId && offers.giftBox.enabled && input.gift_boxes > 0) {
    items.push({ variant_id: boxId, quantity: Math.min(10, Math.floor(input.gift_boxes)), unit_price: undefined as unknown as number, metadata: { gk_gift_box: true } })
  }

  return new StepResponse({
    remove: (cart.items ?? []).map((i) => i!.id),
    items,
  })
})
