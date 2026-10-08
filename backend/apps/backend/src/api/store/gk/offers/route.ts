import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { GIFT_BOX_SKU } from "../../../../lib/offers"
import { GK_SETTINGS_MODULE } from "../../../../modules/gk-settings"
import type GkSettingsService from "../../../../modules/gk-settings/service"
import type { PricedShippingOption } from "../../../../lib/query-types"

type StockedProduct = {
  handle: string
  status?: string
  variants?: {
    sku?: string | null
    inventory_items?: { inventory?: { location_levels?: { stocked_quantity?: number | null }[] | null } | null }[] | null
  }[] | null
}

const stockOf = (p: StockedProduct) =>
  (p.variants ?? []).reduce(
    (a, v) =>
      a +
      (v.inventory_items ?? []).reduce(
        (b, ii) => b + (ii.inventory?.location_levels ?? []).reduce((c, l) => c + Number(l.stocked_quantity ?? 0), 0),
        0
      ),
    0
  )

/** Offer switches + best sellers for the storefront. Money in pence. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const settings = req.scope.resolve<GkSettingsService>(GK_SETTINGS_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const offers = await settings.getOffers()

  const { data: rawOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "type.code", "type.description", "prices.amount", "prices.currency_code", "prices.price_rules.attribute"],
  })
  const options = rawOptions as unknown as PricedShippingOption[]

  const { data: rawProducts } = await query.graph({
    entity: "product",
    fields: ["handle", "status", "variants.sku", "variants.inventory_items.inventory.location_levels.stocked_quantity"],
  })
  const products = (rawProducts as unknown as StockedProduct[]).filter(
    (p) => p.status === "published" && !(p.variants ?? []).some((v) => v.sku === GIFT_BOX_SKU)
  )
  const live = new Set(products.map((p) => p.handle))
  let bestSellers = offers.bestSellers.filter((h) => live.has(h))
  if (!bestSellers.length) {
    // nothing chosen in the admin: show whatever has the most stock
    bestSellers = [...products].sort((a, b) => stockOf(b) - stockOf(a)).slice(0, 6).map((p) => p.handle)
  }

  const pence = (n: unknown) => Math.round(Number(n ?? 0) * 100)
  res.json({
    offers: {
      tiers: offers.tiers,
      freeDelivery: { enabled: offers.freeDelivery.enabled, threshold: pence(offers.freeDelivery.threshold) },
      giftBox: { enabled: offers.giftBox.enabled, name: "Signature gift box" },
      subscription: offers.subscription,
      bestSellers,
      shipping: options
        .filter((o) => o.type?.code)
        .map((o) => ({
          id: o.type!.code as string,
          option_id: o.id,
          name: o.name,
          eta: o.type?.description ?? "",
          price: pence(o.prices?.find((p) => p?.currency_code === "gbp" && !(p?.price_rules ?? []).length)?.amount),
        })),
    },
  })
}
