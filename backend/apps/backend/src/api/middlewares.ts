import { configureStoreSearch, defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

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
  subscription: z.object({ enabled: z.boolean(), pct: z.number().min(1).max(90), months: z.number().int().min(1).max(12) }),
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

const url = z.string().trim().max(2000).refine((v) => v === "" || /^(https?:\/\/|\/)/.test(v), "Must be a web address starting with https:// or /")
export const GkPostSchema = z.object({
  title: z.string().trim().min(1, "Give the post a title").max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Web address: lowercase letters, numbers and dashes only"),
  excerpt: z.string().max(400).nullish(),
  cover_url: url.nullish(),
  body: z.string().max(100000),
  author: z.string().max(120).nullish(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).nullish(),
  status: z.enum(["draft", "published"]),
  published_at: z.string().datetime({ offset: true }).nullish(),
  seo_title: z.string().max(120).nullish(),
  seo_description: z.string().max(320).nullish(),
})
export type GkPostBody = z.infer<typeof GkPostSchema>

export const StatusSchema = z.object({ status: z.string().min(1).max(20) })
export type StatusBody = z.infer<typeof StatusSchema>

/** Bag contents are priced by /store/gk/carts/:id/sync only, so discounts can't be gamed. */
function blockDirectLineItemEdits(_req: MedusaRequest, res: MedusaResponse, _next: MedusaNextFunction) {
  res.status(403).json({ type: "not_allowed", message: "Update the bag through /store/gk/carts/:id/sync" })
}

/**
 * "Pay later" test orders (Medusa's system payment provider) only when ALLOW_TEST_ORDERS=true —
 * on the live shop every order must go through a real payment provider.
 */
function blockTestPayments(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const provider = (req.body as { provider_id?: string } | undefined)?.provider_id
  if (provider === "pp_system_default" && process.env.ALLOW_TEST_ORDERS !== "true") {
    res.status(403).json({ type: "not_allowed", message: "Online checkout isn't open yet — card payments are being switched on." })
    return
  }
  next()
}

/**
 * Pre-launch: the shop is public but not selling yet. Payments are refused unless the cart carries the
 * preview key (testers open gkparfum.co.uk/preview?key=… once). SHOP_MODE=live switches this off.
 */
async function prelaunchGate(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  if ((process.env.SHOP_MODE || "live") !== "prelaunch") {
    return next()
  }
  const key = process.env.PREVIEW_KEY || ""
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  let meta: Record<string, unknown> | null | undefined
  if (req.params.id?.startsWith("pay_col_")) {
    const { data } = await query.graph({ entity: "payment_collection", fields: ["id", "cart.metadata"], filters: { id: req.params.id } })
    meta = (data[0] as { cart?: { metadata?: Record<string, unknown> | null } } | undefined)?.cart?.metadata
  } else {
    const { data } = await query.graph({ entity: "cart", fields: ["id", "metadata"], filters: { id: req.params.id } })
    meta = (data[0] as { metadata?: Record<string, unknown> | null } | undefined)?.metadata
  }
  if (key && meta?.gk_preview === key) {
    return next()
  }
  res.status(403).json({ type: "not_allowed", message: "We're launching very soon — online checkout isn't open yet." })
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
    { method: ["POST"], matcher: "/admin/gk/posts", middlewares: [validateAndTransformBody(GkPostSchema)] },
    { method: ["POST"], matcher: "/admin/gk/posts/:id", middlewares: [validateAndTransformBody(GkPostSchema)] },
    { method: ["POST", "DELETE"], matcher: "/store/carts/:id/line-items*", middlewares: [blockDirectLineItemEdits] },
    { method: ["POST"], matcher: "/store/payment-collections/:id/payment-sessions", middlewares: [blockTestPayments, prelaunchGate] },
    { method: ["POST"], matcher: "/store/carts/:id/complete", middlewares: [prelaunchGate] },
  ],
})
