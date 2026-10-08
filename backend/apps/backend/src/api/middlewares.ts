import { configureStoreSearch, defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

export const SyncGkCartSchema = z.object({
  lines: z
    .array(z.object({ variant_id: z.string().min(1), quantity: z.number().int().min(0).max(20), subscribe: z.boolean().optional() }))
    .max(40),
})
export type SyncGkCartBody = z.infer<typeof SyncGkCartSchema>

export const GkOffersSchema = z.object({
  tiers: z.object({
    enabled: z.boolean(),
    discountQty: z.number().int().min(2).max(10),
    discountPct: z.number().min(1).max(90),
    freeShipQty: z.number().int().min(2).max(20),
  }),
  freeDelivery: z.object({ enabled: z.boolean(), threshold: z.number().min(0).max(1000) }),
  giftBox: z.object({ enabled: z.boolean() }),
  subscription: z.object({ enabled: z.boolean(), pct: z.number().min(1).max(90), weeks: z.number().int().min(1).max(26) }),
  bestSellers: z.array(z.string().min(1)).max(12),
})
export type GkOffersBody = z.infer<typeof GkOffersSchema>

// "website" is a honeypot: real people never see or fill it.
const honeypot = { website: z.string().max(0).optional() }

export const SearchLogSchema = z.object({
  query: z.string().trim().min(1).max(200),
  results: z.number().int().min(0).max(1000),
  source: z.enum(["matcher", "search"]).default("matcher"),
})
export type SearchLogBody = z.infer<typeof SearchLogSchema>

export const SubscribeSchema = z.object({
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional().nullable(),
  source: z.enum(["popup", "footer", "checkout"]).default("popup"),
  ...honeypot,
})
export type SubscribeBody = z.infer<typeof SubscribeSchema>

export const ContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  order_ref: z.string().trim().max(40).optional().nullable(),
  message: z.string().trim().min(5).max(4000),
  ...honeypot,
})
export type ContactBody = z.infer<typeof ContactSchema>

export const ReviewSchema = z.object({
  product_handle: z.string().trim().max(120).optional().nullable(),
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().nullable(),
  body: z.string().trim().min(10).max(3000),
  ...honeypot,
})
export type ReviewBody = z.infer<typeof ReviewSchema>

export const StatusSchema = z.object({ status: z.string().min(1).max(20) })
export type StatusBody = z.infer<typeof StatusSchema>

/** Bag contents are priced by /store/gk/carts/:id/sync only, so discounts can't be gamed. */
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
    { method: ["POST"], matcher: "/store/gk/search-log", middlewares: [validateAndTransformBody(SearchLogSchema)] },
    { method: ["POST"], matcher: "/store/gk/subscribe", middlewares: [validateAndTransformBody(SubscribeSchema)] },
    { method: ["POST"], matcher: "/store/gk/contact", middlewares: [validateAndTransformBody(ContactSchema)] },
    { method: ["POST"], matcher: "/store/gk/reviews", middlewares: [validateAndTransformBody(ReviewSchema)] },
    { method: ["POST"], matcher: "/admin/gk/offers", middlewares: [validateAndTransformBody(GkOffersSchema)] },
    { method: ["POST"], matcher: "/admin/gk/messages/:id", middlewares: [validateAndTransformBody(StatusSchema)] },
    { method: ["POST"], matcher: "/admin/gk/reviews/:id", middlewares: [validateAndTransformBody(StatusSchema)] },
    { method: ["POST", "DELETE"], matcher: "/store/carts/:id/line-items*", middlewares: [blockDirectLineItemEdits] },
  ],
})
