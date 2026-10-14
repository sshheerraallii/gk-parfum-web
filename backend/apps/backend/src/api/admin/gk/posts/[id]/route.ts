import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GK_BLOG_MODULE } from "../../../../../modules/gk-blog"
import type GkBlogService from "../../../../../modules/gk-blog/service"
import { deleteGkPostWorkflow, saveGkPostWorkflow } from "../../../../../workflows/gk-blog"
import type { GkPostBody } from "../../../../middlewares"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve<GkBlogService>(GK_BLOG_MODULE)
  res.json({ post: await svc.retrieveGkPost(req.params.id) })
}

export async function POST(req: MedusaRequest<GkPostBody>, res: MedusaResponse) {
  const { result } = await saveGkPostWorkflow(req.scope).run({ input: { ...req.validatedBody, id: req.params.id } })
  res.json({ post: result })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await deleteGkPostWorkflow(req.scope).run({ input: { id: req.params.id } })
  res.json({ id: req.params.id, deleted: true })
}
