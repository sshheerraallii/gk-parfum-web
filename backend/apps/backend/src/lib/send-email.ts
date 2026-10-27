import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

/**
 * Sends one email through the notification module (Resend). Never throws: an email problem must not
 * break checkout or a password reset — it's logged instead. Without RESEND_API_KEY it only logs.
 */
export async function sendEmail(container: MedusaContainer, to: string | null | undefined, template: string, data: Record<string, unknown>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  if (!to) {
    return
  }
  if (!process.env.RESEND_API_KEY) {
    logger.info(`Email "${template}" to ${to} not sent — RESEND_API_KEY isn't set`)
    return
  }
  try {
    const notifications = container.resolve(Modules.NOTIFICATION)
    await notifications.createNotifications({ to, channel: "email", template, data })
  } catch (e) {
    logger.error(`Email "${template}" to ${to} failed: ${(e as Error).message}`)
  }
}

/** Where owner alerts go. */
export const ownerEmail = () => process.env.OWNER_EMAIL || process.env.ADMIN_EMAIL || ""
