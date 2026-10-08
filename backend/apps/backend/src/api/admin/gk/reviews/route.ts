import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GK_ENGAGE_MODULE } from "../../../../modules/gk-engage"
import type GkEngageService from "../../../../modules/gk-engage/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve<GkEngageService>(GK_ENGAGE_MODULE)
  const rows = await svc.listGkReviews({}, { order: { created_at: "DESC" }, take: 1000 })
  res.json({ reviews: rows })
}
