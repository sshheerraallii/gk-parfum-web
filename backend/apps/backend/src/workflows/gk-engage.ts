import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { GK_ENGAGE_MODULE } from "../modules/gk-engage"
import type GkEngageService from "../modules/gk-engage/service"

const svc = (c: { resolve: <T>(k: string) => T }) => c.resolve<GkEngageService>(GK_ENGAGE_MODULE)

/* ── search log ─────────────────────────────────────────────── */
type SearchInput = { query: string; keywords: string[]; results: number; source: string }

const logSearchStep = createStep("log-search", async (input: SearchInput, { container }) => {
  const row = await svc(container).createGkSearches({
    query: input.query,
    keywords: input.keywords as unknown as Record<string, unknown>,
    results: input.results,
    source: input.source,
  })
  return new StepResponse(row, row.id)
}, async (id, { container }) => {
  if (id) {
    await svc(container).deleteGkSearches(id)
  }
})

export const logSearchWorkflow = createWorkflow("log-search", (input: SearchInput) => {
  return new WorkflowResponse(logSearchStep(input))
})

/* ── newsletter ─────────────────────────────────────────────── */
type SubscribeInput = { email: string; phone?: string | null; source: string }

const subscribeStep = createStep("subscribe", async (input: SubscribeInput, { container }) => {
  const s = svc(container)
  const email = input.email.trim().toLowerCase()
  const [existing] = await s.listGkSubscribers({ email })
  if (existing) {
    if (input.phone && !existing.phone) {
      await s.updateGkSubscribers({ id: existing.id, phone: input.phone })
    }
    return new StepResponse({ id: existing.id, created: false }, null)
  }
  const row = await s.createGkSubscribers({ email, phone: input.phone ?? null, source: input.source })
  return new StepResponse({ id: row.id, created: true }, row.id)
}, async (id, { container }) => {
  if (id) {
    await svc(container).deleteGkSubscribers(id)
  }
})

export const subscribeWorkflow = createWorkflow("subscribe", (input: SubscribeInput) => {
  return new WorkflowResponse(subscribeStep(input))
})

/* ── contact messages ───────────────────────────────────────── */
type ContactInput = { name: string; email: string; order_ref?: string | null; message: string }

const contactStep = createStep("contact", async (input: ContactInput, { container }) => {
  const row = await svc(container).createGkMessages({ ...input, order_ref: input.order_ref ?? null })
  return new StepResponse(row, row.id)
}, async (id, { container }) => {
  if (id) {
    await svc(container).deleteGkMessages(id)
  }
})

export const contactWorkflow = createWorkflow("contact", (input: ContactInput) => {
  return new WorkflowResponse(contactStep(input))
})

type MessageStatusInput = { id: string; status: "new" | "replied" | "archived" }

const messageStatusStep = createStep("message-status", async (input: MessageStatusInput, { container }) => {
  const s = svc(container)
  const prev = await s.retrieveGkMessage(input.id)
  const row = await s.updateGkMessages({ id: input.id, status: input.status })
  return new StepResponse(row, { id: input.id, status: prev.status })
}, async (prev, { container }) => {
  if (prev) {
    await svc(container).updateGkMessages(prev)
  }
})

export const messageStatusWorkflow = createWorkflow("message-status", (input: MessageStatusInput) => {
  return new WorkflowResponse(messageStatusStep(input))
})

/* ── reviews ────────────────────────────────────────────────── */
type ReviewInput = {
  product_handle?: string | null
  name: string
  email: string
  rating: number
  title?: string | null
  body: string
  verified: boolean
}

const reviewStep = createStep("review", async (input: ReviewInput, { container }) => {
  const row = await svc(container).createGkReviews({
    ...input,
    product_handle: input.product_handle ?? null,
    title: input.title ?? null,
    status: "pending",
  })
  return new StepResponse(row, row.id)
}, async (id, { container }) => {
  if (id) {
    await svc(container).deleteGkReviews(id)
  }
})

export const submitReviewWorkflow = createWorkflow("submit-review", (input: ReviewInput) => {
  return new WorkflowResponse(reviewStep(input))
})

type ReviewStatusInput = { id: string; status: "pending" | "approved" | "rejected" }

const reviewStatusStep = createStep("review-status", async (input: ReviewStatusInput, { container }) => {
  const s = svc(container)
  const prev = await s.retrieveGkReview(input.id)
  const row = await s.updateGkReviews({ id: input.id, status: input.status })
  return new StepResponse(row, { id: input.id, status: prev.status })
}, async (prev, { container }) => {
  if (prev) {
    await svc(container).updateGkReviews(prev)
  }
})

export const reviewStatusWorkflow = createWorkflow("review-status", (input: ReviewStatusInput) => {
  return new WorkflowResponse(reviewStatusStep(input))
})
