import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"
import type { GkOffers } from "../lib/offers"
import { GK_SETTINGS_MODULE } from "../modules/gk-settings"
import type GkSettingsService from "../modules/gk-settings/service"

const saveOffersStep = createStep(
  "save-gk-offers",
  async (next: GkOffers, { container }) => {
    const settings = container.resolve<GkSettingsService>(GK_SETTINGS_MODULE)
    const prev = await settings.getOffers()
    await settings.saveOffers(next)
    return new StepResponse(next, prev)
  },
  async (prev, { container }) => {
    if (prev) {
      await container.resolve<GkSettingsService>(GK_SETTINGS_MODULE).saveOffers(prev)
    }
  }
)

/** Keeps the Tracked 48 option's "free over £X" price in step with the free-delivery switch. */
const syncFreeDeliveryStep = createStep("sync-gk-free-delivery", async (next: GkOffers, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "type.code", "prices.amount", "prices.currency_code", "prices.price_rules.attribute"],
  })
  const t48 = options.find((o) => o.type?.code === "tracked-48")
  if (!t48) {
    return new StepResponse(null)
  }
  const base = t48.prices?.find((p) => p?.currency_code === "gbp" && !(p?.price_rules ?? []).length)?.amount ?? 3.99
  const prices: { currency_code: string; amount: number; rules?: { attribute: string; operator: "gte"; value: number }[] }[] = [
    { currency_code: "gbp", amount: Number(base) },
  ]
  if (next.freeDelivery.enabled) {
    prices.push({
      currency_code: "gbp",
      amount: 0,
      rules: [{ attribute: "item_total", operator: "gte", value: next.freeDelivery.threshold }],
    })
  }
  await updateShippingOptionsWorkflow(container).run({ input: [{ id: t48.id, prices }] })
  return new StepResponse(null)
})

export const saveGkOffersWorkflow = createWorkflow("save-gk-offers", (input: GkOffers) => {
  const saved = saveOffersStep(input)
  syncFreeDeliveryStep(input)
  return new WorkflowResponse(saved)
})
