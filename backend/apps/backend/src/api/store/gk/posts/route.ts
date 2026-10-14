import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GK_BLOG_MODULE } from "../../../../modules/gk-blog"
import type GkBlogService from "../../../../modules/gk-blog/service"

export const LIST_FIELDS = ["id", "title", "slug", "excerpt", "cover_url", "author", "tags", "published_at", "updated_at", "seo_title", "seo_description"] as const

/** Published posts whose publish date has passed, newest first. Bodies included only with ?full=1 (for the sitemap/feeds keep it light). */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve<GkBlogService>(GK_BLOG_MODULE)
  const full = req.query.full === "1"
  const posts = await svc.listGkPosts(
    { status: "published", published_at: { $lte: new Date() } },
    { select: full ? [...LIST_FIELDS, "body"] : [...LIST_FIELDS], order: { published_at: "DESC" }, take: 200 }
  )
  res.json({ posts })
}
