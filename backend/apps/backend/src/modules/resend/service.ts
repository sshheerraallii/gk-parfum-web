import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import type { Logger, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/framework/types"
import { renderEmail } from "../../lib/emails"

type Options = { apiKey: string; from: string; replyTo?: string; apiUrl?: string }

/**
 * Sends the shop's emails through Resend (resend.com). Templates live in src/lib/emails.ts;
 * subscribers pass a template name + data, this turns it into subject + HTML and posts it.
 */
export default class ResendNotificationService extends AbstractNotificationProviderService {
  static identifier = "resend"
  protected options_: Options
  protected logger_: Logger

  constructor({ logger }: { logger: Logger }, options: Options) {
    super()
    this.options_ = options
    this.logger_ = logger
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.apiKey) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Resend: apiKey is required")
    }
    if (!options.from) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Resend: from is required")
    }
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const { subject, html, text } = renderEmail(notification.template, (notification.data ?? {}) as Record<string, unknown>)
    const r = await fetch(`${this.options_.apiUrl || "https://api.resend.com"}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.options_.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: this.options_.from,
        to: [notification.to],
        reply_to: this.options_.replyTo || undefined,
        subject,
        html,
        text,
      }),
    })
    const body = (await r.json().catch(() => ({}))) as { id?: string; message?: string }
    if (!r.ok) {
      this.logger_.error(`Resend: couldn't send "${notification.template}" to ${notification.to}: ${body.message ?? r.status}`)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Email not sent: ${body.message ?? r.status}`)
    }
    return { id: body.id }
  }
}
