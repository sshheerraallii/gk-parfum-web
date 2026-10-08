import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { contactWorkflow } from "../../../../workflows/gk-engage"
import type { ContactBody } from "../../../middlewares"

export async function POST(req: MedusaRequest<ContactBody>, res: MedusaResponse) {
  const { name, email, order_ref, message } = req.validatedBody
  await contactWorkflow(req.scope).run({ input: { name, email, order_ref: order_ref || null, message } })
  res.status(201).json({ ok: true })
}
