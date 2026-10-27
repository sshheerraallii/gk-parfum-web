import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Runs on every backend start (docker-start.sh). When Stripe keys are set, makes sure every region
 * offers Stripe at checkout — the database may have been created before the keys were added.
 */
export default async function ensurePaymentProviders({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  if (!process.env.STRIPE_API_KEY) {
    return
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "name", "payment_providers.id"] })
  for (const r of regions) {
    const ids = (r.payment_providers ?? []).filter(Boolean).map((p) => p!.id)
    if (ids.includes("pp_stripe_stripe")) {
      continue
    }
    await updateRegionsWorkflow(container).run({
      input: { selector: { id: r.id }, update: { payment_providers: ["pp_stripe_stripe", ...ids] } },
    })
    logger.info(`GK: Stripe switched on for ${r.name}`)
  }
}
