import { model } from "@medusajs/framework/utils"

/**
 * A blog post. The body is written in the admin in a simple text format (headings, bold, links, lists),
 * with images, videos (YouTube, Vimeo or an uploaded clip) and scent cards each on their own line.
 * Only "published" posts with a publish date that has passed appear on the website.
 */
const GkPost = model
  .define("gk_post", {
    id: model.id({ prefix: "post" }).primaryKey(),
    title: model.text(),
    slug: model.text().unique(),
    excerpt: model.text().nullable(),
    cover_url: model.text().nullable(),
    body: model.text().default(""),
    author: model.text().nullable(),
    tags: model.json().nullable(),
    status: model.enum(["draft", "published"]).default("draft"),
    published_at: model.dateTime().nullable(),
    seo_title: model.text().nullable(),
    seo_description: model.text().nullable(),
  })
  .indexes([{ on: ["status", "published_at"] }])

export default GkPost
