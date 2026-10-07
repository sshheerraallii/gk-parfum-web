import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, MedusaError, QueryContext } from "@medusajs/framework/utils"
import { allocate } from "../../lib/offers"
import { GK_SETTINGS_MODULE } from "../../modules/gk-settings"
import type GkSettingsService from "../../modules/gk-settings/service"

/**
 * Last line of defence: before an order is created, re-run the pricing rules and
 * refuse any cart whose bottles cost less than the rules allow.
 */
completeCartWorkflow.hooks.validate(async ({ cart }, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const settings = container.resolve<GkSettingsService>(GK_SETTINGS_MODULE)
  const offers = await settings.getOffers()

  const items = (cart.items ?? []).filter((i) => i?.variant_id && i.is_custom_price)
  if (!items.length) {
    return
  }
  const ids = [...new Set(items.map((i) => i!.variant_id as string))]
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "calculated_price.calculated_amount"],
    filters: { id: ids },
    context: { calculated_price: QueryContext({ region_id: cart.region_id, currency_code: cart.currency_code }) },
  })
  const base = new Map(variants.map((v) => [v.id, Number(v.calculated_price?.calculated_amount)]))

  const allItems = (cart.items ?? []).filter((i) => i?.variant_id && base.has(i.variant_id as string))
  const units = allItems.flatMap((i) =>
    Array.from({ length: Number(i!.quantity) }, () => ({ variant_id: i!.variant_id as string, base: base.get(i!.variant_id as string)! }))
  )
  const expected = allocate(units, offers).reduce((a, u) => a + u.charged, 0)
  const actual = allItems.reduce((a, i) => a + Number(i!.unit_price) * Number(i!.quantity), 0)
  if (actual + 0.01 < expected) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Your bag changed. Please review it and try again.")
  }
})
