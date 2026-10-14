import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GK_BLOG_MODULE } from "../../../../modules/gk-blog"
import type GkBlogService from "../../../../modules/gk-blog/service"
import { saveGkPostWorkflow } from "../../../../workflows/gk-blog"
import type { GkPostBody } from "../../../middlewares"

/** Every post, drafts included, newest first (without the body, to keep the list light). */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve<GkBlogService>(GK_BLOG_MODULE)
  const posts = await svc.listGkPosts(
    {},
    {
      select: ["id", "title", "slug", "excerpt", "cover_url", "status", "published_at", "author", "tags", "updated_at", "created_at"],
      order: { created_at: "DESC" },
      take: 500,
    }
  )
  // the shop's web address, for "View on site" links
  const site =
    process.env.STOREFRONT_URL ||
    (process.env.STORE_CORS ?? "").split(",").map((o) => o.trim()).find((o) => o.startsWith("https://")) ||
    (process.env.STORE_CORS ?? "").split(",")[0]?.trim() ||
    ""
  res.json({ posts, site: site.replace(/\/$/, "") })
}

export async function POST(req: MedusaRequest<GkPostBody>, res: MedusaResponse) {
  const { result } = await saveGkPostWorkflow(req.scope).run({ input: req.validatedBody })
  res.json({ post: result })
}
