import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { submitReviewWorkflow } from "../../../../workflows/gk-engage"
import { GK_ENGAGE_MODULE } from "../../../../modules/gk-engage"
import type GkEngageService from "../../../../modules/gk-engage/service"
import type { ReviewBody } from "../../../middlewares"

const shortName = (n: string) => {
  const parts = n.trim().split(/\s+/)
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0]
}

/** Approved reviews only. ?product=<handle> narrows to one scent. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve<GkEngageService>(GK_ENGAGE_MODULE)
  const product = typeof req.query.product === "string" ? req.query.product : undefined
  const rows = await svc.listGkReviews(
    { status: "approved", ...(product ? { product_handle: product } : {}) },
    { order: { created_at: "DESC" }, take: 200 }
  )
  const reviews = rows.map((r) => ({
    id: r.id,
    product_handle: r.product_handle,
    name: shortName(r.name),
    rating: r.rating,
    title: r.title,
    body: r.body,
    verified: r.verified,
    created_at: r.created_at,
  }))
  const count = reviews.length
  const average = count ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / count) * 10) / 10 : null
  res.json({ reviews, count, average })
}

export async function POST(req: MedusaRequest<ReviewBody>, res: MedusaResponse) {
  const { product_handle, name, email, rating, title, body } = req.validatedBody
  // "Verified buyer" only when this email has an order containing the scent
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "items.product_handle"],
    filters: { email: email.toLowerCase() },
  })
  const verified = orders.length
    ? product_handle
      ? orders.some((o) => (o.items ?? []).some((i) => i?.product_handle === product_handle))
      : true
    : false
  await submitReviewWorkflow(req.scope).run({
    input: { product_handle: product_handle || null, name, email: email.toLowerCase(), rating, title: title || null, body, verified },
  })
  res.status(201).json({ ok: true })
}
