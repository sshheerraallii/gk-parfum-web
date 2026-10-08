import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GK_ENGAGE_MODULE } from "../../../../modules/gk-engage"
import type GkEngageService from "../../../../modules/gk-engage/service"

/** Newsletter list. ?format=csv downloads it for Mailchimp, Klaviyo etc. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve<GkEngageService>(GK_ENGAGE_MODULE)
  const rows = await svc.listGkSubscribers({}, { order: { created_at: "DESC" }, take: 10000 })
  if (req.query.format === "csv") {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
    const csv = ["email,phone,source,in_prize_draw,signed_up"]
      .concat(rows.map((r) => [r.email, r.phone, r.source, r.in_prize_draw, new Date(r.created_at).toISOString()].map(esc).join(",")))
      .join("\n")
    res.setHeader("Content-Type", "text/csv; charset=utf-8")
    res.setHeader("Content-Disposition", 'attachment; filename="gk-subscribers.csv"')
    res.send(csv)
    return
  }
  res.json({ subscribers: rows, count: rows.length })
}
