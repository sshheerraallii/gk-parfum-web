import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { GK_BLOG_MODULE } from "../../../../../modules/gk-blog"
import type GkBlogService from "../../../../../modules/gk-blog/service"
import { LIST_FIELDS } from "../route"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve<GkBlogService>(GK_BLOG_MODULE)
  const [post] = await svc.listGkPosts(
    { slug: req.params.slug, status: "published", published_at: { $lte: new Date() } },
    { select: [...LIST_FIELDS, "body"], take: 1 }
  )
  if (!post) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Post not found")
  }
  res.json({ post })
}
