import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, MedusaError, QueryContext } from "@medusajs/framework/utils"
import { allocate, BUNDLE_DELIVERY_CODE, GIFT_BOX_SKU } from "../../lib/offers"
import { GK_SETTINGS_MODULE } from "../../modules/gk-settings"
import type GkSettingsService from "../../modules/gk-settings/service"
import type { PricedVariant } from "../../lib/query-types"

/**
 * Last line of defence: before an order is created, re-run the pricing rules and refuse a
 * cart whose bottles cost less than the rules allow, or that carries the bundle
 * free-delivery code without enough bottles.
 */
completeCartWorkflow.hooks.validate(async ({ cart }, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const settings = container.resolve<GkSettingsService>(GK_SETTINGS_MODULE)
  const offers = await settings.getOffers()

  const withVariant = (cart.items ?? []).filter((i) => i?.variant_id)
  const ids = Array.from(new Set<string>(withVariant.map((i) => String(i?.variant_id))))
  const base = new Map<string, number>()
  const isBox = new Set<string>()
  if (ids.length) {
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "sku", "calculated_price.calculated_amount"],
      filters: { id: ids },
      context: { calculated_price: QueryContext({ region_id: cart.region_id, currency_code: cart.currency_code }) },
    })
    for (const v of variants as unknown as (PricedVariant & { sku?: string | null })[]) {
      if (v.sku === GIFT_BOX_SKU) {
        isBox.add(v.id)
      } else {
        base.set(v.id, Number(v.calculated_price?.calculated_amount))
      }
    }
  }

  const bottles = withVariant.filter((i) => base.has(String(i?.variant_id)))
  const units = bottles.flatMap((i) =>
    Array.from({ length: Number(i!.quantity) }, () => ({
      variant_id: String(i!.variant_id),
      base: base.get(String(i!.variant_id))!,
      sub: !!(i!.metadata as Record<string, unknown> | null)?.gk_subscription,
    }))
  )
  const plan = allocate(units, offers)
  const expected = plan.units.reduce((a, u) => a + u.charged, 0)
  const actual = bottles.reduce((a, i) => a + Number(i!.unit_price) * Number(i!.quantity), 0)
  if (actual + 0.01 * Math.max(1, units.length) < expected) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Your bag changed. Please review it and try again.")
  }

  const {
    data: [withPromos],
  } = await query.graph({ entity: "cart", fields: ["promotions.code"], filters: { id: cart.id } })
  const hasCode = (withPromos?.promotions ?? []).some((p) => p?.code === BUNDLE_DELIVERY_CODE)
  if (hasCode && !plan.freeShip) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Free bundle delivery needs more bottles in your bag.")
  }
})
