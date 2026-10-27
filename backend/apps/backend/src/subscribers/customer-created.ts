import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendEmail } from "../lib/send-email"

/** Welcome email when someone creates an account (not for guest checkouts). */
export default async function customerCreated({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: rows } = await query.graph({ entity: "customer", fields: ["email", "first_name", "has_account"], filters: { id: data.id } })
  const c = rows[0] as { email?: string; first_name?: string | null; has_account?: boolean } | undefined
  if (!c?.has_account) {
    return
  }
  await sendEmail(container, c.email, "welcome", { first_name: c.first_name ?? null })
}

export const config: SubscriberConfig = { event: "customer.created" }
