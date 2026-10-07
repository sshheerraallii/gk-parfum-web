import { createWorkflow, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { addToCartWorkflow, deleteLineItemsWorkflow } from "@medusajs/medusa/core-flows"
import { planGkCartStep, type PlanGkCartInput } from "./steps/plan-gk-cart"

/**
 * Replaces the cart's contents with server-priced line items.
 * The storefront calls this whenever the bag changes.
 */
export const syncGkCartWorkflow = createWorkflow("sync-gk-cart", (input: PlanGkCartInput) => {
  const plan = planGkCartStep(input)

  when("gk-has-items-to-remove", { plan }, ({ plan }) => plan.remove.length > 0).then(() => {
    const del = transform({ plan, input }, ({ plan, input }) => ({ cart_id: input.cart_id, ids: plan.remove }))
    deleteLineItemsWorkflow.runAsStep({ input: del })
  })

  when("gk-has-items-to-add", { plan }, ({ plan }) => plan.items.length > 0).then(() => {
    const add = transform({ plan, input }, ({ plan, input }) => ({
      cart_id: input.cart_id,
      items: plan.items.map((i) => {
        const base = { variant_id: i.variant_id, quantity: i.quantity, metadata: i.metadata }
        return i.unit_price === undefined || i.unit_price === null ? base : { ...base, unit_price: i.unit_price }
      }),
    }))
    addToCartWorkflow.runAsStep({ input: add })
  })

  return new WorkflowResponse(plan)
})
