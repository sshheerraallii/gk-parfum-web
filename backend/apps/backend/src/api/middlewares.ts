import { configureStoreSearch, defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

export const SyncGkCartSchema = z.object({
  lines: z.array(z.object({ variant_id: z.string().min(1), quantity: z.number().int().min(0).max(20) })).max(40),
  gift_boxes: z.number().int().min(0).max(10).optional(),
})
export type SyncGkCartBody = z.infer<typeof SyncGkCartSchema>

export const GkOffersSchema = z.object({
  bundle: z.object({
    enabled: z.boolean(),
    qty: z.number().int().min(2).max(10),
    price: z.number().positive().max(1000),
    label: z.string().min(1).max(60),
  }),
  freeDelivery: z.object({ enabled: z.boolean(), threshold: z.number().min(0).max(1000) }),
  giftBox: z.object({ enabled: z.boolean() }),
})
export type GkOffersBody = z.infer<typeof GkOffersSchema>

/** Bag contents are priced by /store/gk/carts/:id/sync only, so the bundle price can't be gamed. */
function blockDirectLineItemEdits(_req: MedusaRequest, res: MedusaResponse, _next: MedusaNextFunction) {
  res.status(403).json({ type: "not_allowed", message: "Update the bag through /store/gk/carts/:id/sync" })
}

export default defineMiddlewares({
  routes: [
    {
      method: ["POST"],
      matcher: "/store/search",
      middlewares: [configureStoreSearch({ allowed_indexes: { product: true } })],
    },
    { method: ["POST"], matcher: "/store/gk/carts/:id/sync", middlewares: [validateAndTransformBody(SyncGkCartSchema)] },
    { method: ["POST"], matcher: "/admin/gk/offers", middlewares: [validateAndTransformBody(GkOffersSchema)] },
    { method: ["POST", "DELETE"], matcher: "/store/carts/:id/line-items*", middlewares: [blockDirectLineItemEdits] },
  ],
})
