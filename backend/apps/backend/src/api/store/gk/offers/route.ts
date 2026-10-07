import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { GIFT_BOX_SKU } from "../../../../lib/offers"
import { GK_SETTINGS_MODULE } from "../../../../modules/gk-settings"
import type GkSettingsService from "../../../../modules/gk-settings/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const settings = req.scope.resolve<GkSettingsService>(GK_SETTINGS_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const offers = await settings.getOffers()

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "type.code", "type.description", "prices.amount", "prices.currency_code", "prices.price_rules.attribute"],
  })
  const { data: box } = await query.graph({
    entity: "product_variant",
    fields: ["id", "prices.amount", "prices.currency_code", "product.title"],
    filters: { sku: GIFT_BOX_SKU },
  })

  const pence = (n: unknown) => Math.round(Number(n ?? 0) * 100)
  res.json({
    offers: {
      bundle: { ...offers.bundle, price: pence(offers.bundle.price) },
      freeDelivery: { enabled: offers.freeDelivery.enabled, threshold: pence(offers.freeDelivery.threshold) },
      giftBox: {
        enabled: offers.giftBox.enabled && !!box[0],
        price: pence(box[0]?.prices?.find((p) => p?.currency_code === "gbp")?.amount),
        name: box[0]?.product?.title ?? "Signature gift box",
        variant_id: box[0]?.id ?? null,
      },
      shipping: options
        .filter((o) => o.type?.code)
        .map((o) => ({
          id: o.type!.code,
          option_id: o.id,
          name: o.name,
          eta: o.type?.description ?? "",
          price: pence(o.prices?.find((p) => p?.currency_code === "gbp" && !(p?.price_rules ?? []).length)?.amount),
        })),
    },
  })
}
