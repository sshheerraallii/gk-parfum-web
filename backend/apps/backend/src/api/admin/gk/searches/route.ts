import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GK_ENGAGE_MODULE } from "../../../../modules/gk-engage"
import type GkEngageService from "../../../../modules/gk-engage/service"

/** Top keywords, searches that found nothing, and recent searches (last 90 days). */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve<GkEngageService>(GK_ENGAGE_MODULE)
  const since = new Date(Date.now() - 90 * 864e5)
  const rows = await svc.listGkSearches({ created_at: { $gte: since } }, { order: { created_at: "DESC" }, take: 5000 })
  const counts = new Map<string, number>()
  for (const r of rows) {
    for (const k of (r.keywords as unknown as string[]) ?? []) {
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
  }
  const zero = new Map<string, number>()
  for (const r of rows) {
    if (r.results === 0) {
      const q = r.query.toLowerCase()
      zero.set(q, (zero.get(q) ?? 0) + 1)
    }
  }
  res.json({
    total: rows.length,
    top: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([keyword, count]) => ({ keyword, count })),
    no_results: [...zero.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([query, count]) => ({ query, count })),
    recent: rows.slice(0, 100).map((r) => ({ id: r.id, query: r.query, results: r.results, source: r.source, created_at: r.created_at })),
  })
}
