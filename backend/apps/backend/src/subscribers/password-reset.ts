import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendEmail } from "../lib/send-email"

/** "Forgot password" link — to the shop for customers, to the admin panel for admin users. */
export default async function passwordReset({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; actor_type: string; token: string }>) {
  const email = data.entity_id
  const q = `token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(email)}`
  const shop = (process.env.STOREFRONT_URL || "").replace(/\/$/, "")
  const admin = (process.env.MEDUSA_BACKEND_URL || "").replace(/\/$/, "")
  const forAdmin = data.actor_type === "user"
  const url = forAdmin ? `${admin}/app/reset-password?${q}` : `${shop}/account/reset?${q}`
  await sendEmail(container, email, "password-reset", { url, for_admin: forAdmin })
}

export const config: SubscriberConfig = { event: "auth.password_reset" }
