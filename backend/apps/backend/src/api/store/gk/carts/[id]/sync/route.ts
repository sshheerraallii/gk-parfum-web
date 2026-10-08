import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { syncGkCartWorkflow } from "../../../../../../workflows/sync-gk-cart"
import type { SyncGkCartBody } from "../../../../../middlewares"

export async function POST(req: MedusaRequest<SyncGkCartBody>, res: MedusaResponse) {
  const { lines } = req.validatedBody
  await syncGkCartWorkflow(req.scope).run({ input: { cart_id: req.params.id, lines } })
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [cart],
  } = await query.graph({
    entity: "cart",
    fields: [
      "id", "email", "currency_code", "region_id",
      "items.*", "items.variant.sku", "items.variant.product.handle",
      "shipping_methods.*", "promotions.code",
      "subtotal", "item_subtotal", "item_total", "discount_total", "shipping_total", "tax_total", "total",
    ],
    filters: { id: req.params.id },
  })
  res.json({ cart })
}
