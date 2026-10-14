import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { GK_BLOG_MODULE } from "../modules/gk-blog"
import type GkBlogService from "../modules/gk-blog/service"

const svc = (c: { resolve: <T>(k: string) => T }) => c.resolve<GkBlogService>(GK_BLOG_MODULE)

export type PostInput = {
  id?: string
  title: string
  slug: string
  excerpt?: string | null
  cover_url?: string | null
  body: string
  author?: string | null
  tags?: string[] | null
  status: "draft" | "published"
  published_at?: string | null
  seo_title?: string | null
  seo_description?: string | null
}

type Saved = { id: string; slug: string; status: string } & Record<string, unknown>
type Comp = { before: Record<string, unknown> | null; created: string | null }

/** Creates or updates a post. Publishing without a date stamps it "now". */
const savePostStep = createStep(
  "save-post",
  async (input: PostInput, { container }) => {
    const s = svc(container)
    const [clash] = await s.listGkPosts({ slug: input.slug })
    if (clash && clash.id !== input.id) {
      throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, `Another post already uses the web address "${input.slug}". Pick a different one.`)
    }
    const data = {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt ?? null,
      cover_url: input.cover_url ?? null,
      body: input.body,
      author: input.author ?? null,
      tags: (input.tags ?? null) as unknown as Record<string, unknown> | null,
      status: input.status,
      published_at: input.published_at ? new Date(input.published_at) : input.status === "published" ? new Date() : null,
      seo_title: input.seo_title ?? null,
      seo_description: input.seo_description ?? null,
    }
    if (input.id) {
      const before = await s.retrieveGkPost(input.id)
      const row = await s.updateGkPosts({ id: input.id, ...data })
      return new StepResponse<Saved, Comp>(row as unknown as Saved, { before: before as unknown as Record<string, unknown>, created: null })
    }
    const row = await s.createGkPosts(data)
    return new StepResponse<Saved, Comp>(row as unknown as Saved, { before: null, created: row.id })
  },
  async (comp: Comp | undefined, { container }) => {
    if (!comp) return
    const s = svc(container)
    if (comp.created) {
      await s.deleteGkPosts(comp.created)
    } else if (comp.before) {
      const { created_at: _c, updated_at: _u, deleted_at: _d, ...rest } = comp.before as Record<string, unknown>
      await s.updateGkPosts(rest as never)
    }
  }
)

export const saveGkPostWorkflow = createWorkflow("save-gk-post", (input: PostInput) => {
  return new WorkflowResponse(savePostStep(input))
})

const deletePostStep = createStep(
  "delete-post",
  async ({ id }: { id: string }, { container }) => {
    await svc(container).softDeleteGkPosts(id)
    return new StepResponse(id, id)
  },
  async (id, { container }) => {
    if (id) await svc(container).restoreGkPosts(id)
  }
)

export const deleteGkPostWorkflow = createWorkflow("delete-gk-post", (input: { id: string }) => {
  return new WorkflowResponse(deletePostStep(input))
})
