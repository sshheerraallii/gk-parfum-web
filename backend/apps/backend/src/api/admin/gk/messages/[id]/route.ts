import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { messageStatusWorkflow } from "../../../../../workflows/gk-engage"
import type { StatusBody } from "../../../../middlewares"

const ALLOWED = ["new", "replied", "archived"] as const

export async function POST(req: MedusaRequest<StatusBody>, res: MedusaResponse) {
  const status = req.validatedBody.status as (typeof ALLOWED)[number]
  if (!ALLOWED.includes(status)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Status must be new, replied or archived")
  }
  const { result } = await messageStatusWorkflow(req.scope).run({ input: { id: req.params.id, status } })
  res.json({ message: result })
}
