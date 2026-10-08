import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { logSearchWorkflow } from "../../../../workflows/gk-engage"
import { keywordsOf } from "../../../../lib/keywords"
import type { SearchLogBody } from "../../../middlewares"

export async function POST(req: MedusaRequest<SearchLogBody>, res: MedusaResponse) {
  const { query, results, source } = req.validatedBody
  await logSearchWorkflow(req.scope).run({ input: { query, results, source, keywords: keywordsOf(query) } })
  res.status(201).json({ ok: true })
}
