import { createWorkflow, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { PromotionActions } from "@medusajs/framework/utils"
import { addToCartWorkflow, deleteLineItemsWorkflow, updateCartPromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { BUNDLE_DELIVERY_CODE } from "../lib/offers"
import { planGkCartStep, type PlanGkCartInput } from "./steps/plan-gk-cart"

/**
 * Replaces the cart's contents with server-priced line items and switches the
 * bundle free-delivery code on or off. The storefront calls this whenever the bag changes.
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
      items: plan.items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity, metadata: i.metadata, unit_price: i.unit_price })),
    }))
    addToCartWorkflow.runAsStep({ input: add })
  })

  when("gk-add-delivery-code", { plan }, ({ plan }) => plan.addDeliveryCode).then(() => {
    const inp = transform({ input }, ({ input }) => ({
      cart_id: input.cart_id,
      promo_codes: [BUNDLE_DELIVERY_CODE],
      action: PromotionActions.ADD,
    }))
    updateCartPromotionsWorkflow.runAsStep({ input: inp }).config({ name: "gk-add-bundle-delivery" })
  })

  when("gk-remove-delivery-code", { plan }, ({ plan }) => plan.removeDeliveryCode).then(() => {
    const inp = transform({ input }, ({ input }) => ({
      cart_id: input.cart_id,
      promo_codes: [BUNDLE_DELIVERY_CODE],
      action: PromotionActions.REMOVE,
    }))
    updateCartPromotionsWorkflow.runAsStep({ input: inp }).config({ name: "gk-remove-bundle-delivery" })
  })

  return new WorkflowResponse(plan)
})
