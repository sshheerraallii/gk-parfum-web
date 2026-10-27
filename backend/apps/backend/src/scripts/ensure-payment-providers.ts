import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Runs on every backend start (docker-start.sh). Makes every region offer exactly the payment providers whose
 * keys are set (Stripe, PayPal) — the database may have been created before the keys were added.
 */
export default async function ensurePaymentProviders({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const wanted = [
    process.env.STRIPE_API_KEY ? "pp_stripe_stripe" : null,
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET ? "pp_paypal_paypal" : null,
  ].filter((p): p is string => !!p)
  if (!wanted.length) {
    return
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "name", "payment_providers.id"] })
  for (const r of regions) {
    const ids = (r.payment_providers ?? []).filter(Boolean).map((p) => p!.id)
    const missing = wanted.filter((w) => !ids.includes(w))
    if (!missing.length) {
      continue
    }
    await updateRegionsWorkflow(container).run({
      input: { selector: { id: r.id }, update: { payment_providers: [...missing, ...ids] } },
    })
    logger.info(`GK: ${missing.map((m) => (m.includes("stripe") ? "Stripe" : "PayPal")).join(" + ")} switched on for ${r.name}`)
  }
}
