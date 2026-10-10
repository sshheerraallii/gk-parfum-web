import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Keep-alive for free hosting: an uptime pinger hits this every 10 minutes so the server
 * doesn't fall asleep, and the tiny database read keeps a free Supabase project from pausing.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "region", fields: ["id"], pagination: { take: 1 } })
  res.json({ ok: true, db: data.length > 0 })
}
