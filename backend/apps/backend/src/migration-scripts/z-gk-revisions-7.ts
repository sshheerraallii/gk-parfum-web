import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import posts from "../data/blog-seed.json"
import { GK_BLOG_MODULE } from "../modules/gk-blog"
import type GkBlogService from "../modules/gk-blog/service"
import { saveGkPostWorkflow } from "../workflows/gk-blog"

/**
 * The blog (October 2026). Copies the website's fragrance guides in as the first published posts,
 * so the owner can edit them in Admin → Blog. Only when the blog is empty; runs once.
 */
export default async function gk_revisions_7({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const blog = container.resolve<GkBlogService>(GK_BLOG_MODULE)
  const [, count] = await blog.listAndCountGkPosts({}, { take: 1, withDeleted: true })
  if (count) {
    return
  }
  for (const p of posts) {
    await saveGkPostWorkflow(container).run({
      input: {
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        cover_url: p.cover_url,
        body: p.body,
        author: p.author,
        tags: p.tags,
        status: "published",
        published_at: p.published_at,
      },
    })
  }
  logger.info(`GK revisions: blog started with ${posts.length} posts (the fragrance guides)`)
}
