import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { subscribeWorkflow } from "../../../../workflows/gk-engage"
import type { SubscribeBody } from "../../../middlewares"

export async function POST(req: MedusaRequest<SubscribeBody>, res: MedusaResponse) {
  const { email, phone, source } = req.validatedBody
  await subscribeWorkflow(req.scope).run({ input: { email, phone: phone || null, source } })
  res.status(201).json({ ok: true })
}
