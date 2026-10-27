import { AbstractPaymentProvider, BigNumber, MedusaError } from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  PaymentSessionStatus,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"

type Options = { clientId: string; clientSecret: string; sandbox?: boolean; apiUrl?: string }
type PayPalOrder = {
  id: string
  status: "CREATED" | "SAVED" | "APPROVED" | "VOIDED" | "COMPLETED" | "PAYER_ACTION_REQUIRED"
  purchase_units?: { payments?: { captures?: { id: string; status: string }[] } }[]
}

const money = (amount: unknown) => new BigNumber(amount as number).numeric.toFixed(2)

/**
 * PayPal (Orders v2) for checkout. The shop's PayPal button creates nothing itself — it asks for this
 * session's PayPal order, the shopper approves it in PayPal's window, and completing the cart captures it.
 * If the order can't be saved after capture, Medusa cancels the payment and we refund it straight away.
 */
export default class PayPalProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "paypal"
  protected options_: Options
  protected logger_: Logger
  private token_: { value: string; expires: number } | null = null

  static validateOptions(options: Record<string, unknown>) {
    if (!options.clientId || !options.clientSecret) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "PayPal: clientId and clientSecret are required")
    }
  }

  constructor({ logger }: { logger: Logger }, options: Options) {
    super({ logger } as never, options)
    this.options_ = options
    this.logger_ = logger
  }

  private base() {
    return this.options_.apiUrl || (this.options_.sandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com")
  }

  private async token() {
    if (this.token_ && this.token_.expires > Date.now() + 60_000) {
      return this.token_.value
    }
    const r = await fetch(`${this.base()}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.options_.clientId}:${this.options_.clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    })
    const j = (await r.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string }
    if (!r.ok || !j.access_token) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `PayPal sign-in failed: ${j.error_description ?? r.status}`)
    }
    this.token_ = { value: j.access_token, expires: Date.now() + (j.expires_in ?? 300) * 1000 }
    return j.access_token
  }

  private async api<T>(method: string, path: string, body?: unknown, requestId?: string): Promise<T> {
    const r = await fetch(`${this.base()}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${await this.token()}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (r.status === 204) {
      return {} as T
    }
    const j = (await r.json().catch(() => ({}))) as T & { message?: string; details?: { issue?: string; description?: string }[] }
    if (!r.ok) {
      const why = j.details?.[0]?.description || j.details?.[0]?.issue || j.message || String(r.status)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `PayPal: ${why}`)
    }
    return j
  }

  private orderId(data?: Record<string, unknown>) {
    const id = data?.paypal_order_id
    if (typeof id !== "string" || !id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "PayPal: no order on this payment")
    }
    return id
  }

  private captureOf(o: PayPalOrder) {
    return o.purchase_units?.[0]?.payments?.captures?.[0]
  }

  private statusOf(o: PayPalOrder): PaymentSessionStatus {
    switch (o.status) {
      case "COMPLETED":
        return "captured"
      case "APPROVED":
        return "authorized"
      case "VOIDED":
        return "canceled"
      default:
        return "pending"
    }
  }

  async initiatePayment({ amount, currency_code, context }: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const order = await this.api<PayPalOrder>(
      "POST",
      "/v2/checkout/orders",
      {
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: currency_code.toUpperCase(), value: money(amount) }, description: "GK Parfum order" }],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "GK Parfum",
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
              locale: "en-GB",
            },
          },
        },
      },
      context?.idempotency_key
    )
    return { id: order.id, data: { paypal_order_id: order.id, amount: money(amount), currency_code }, status: "pending" }
  }

  async updatePayment({ data, amount, currency_code }: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const id = this.orderId(data)
    const value = money(amount)
    if (data?.amount === value) {
      return { data }
    }
    try {
      await this.api("PATCH", `/v2/checkout/orders/${id}`, [
        { op: "replace", path: "/purchase_units/@reference_id=='default'/amount", value: { currency_code: currency_code.toUpperCase(), value } },
      ])
      return { data: { ...data, amount: value, currency_code } }
    } catch {
      // an order that can't be changed any more: start a fresh one for the new total
      const fresh = await this.initiatePayment({ amount, currency_code })
      return { data: fresh.data, status: "pending" }
    }
  }

  async authorizePayment({ data }: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const id = this.orderId(data)
    let order = await this.api<PayPalOrder>("GET", `/v2/checkout/orders/${id}`)
    if (order.status === "APPROVED") {
      order = await this.api<PayPalOrder>("POST", `/v2/checkout/orders/${id}/capture`, {}, `capture-${id}`)
    }
    const cap = this.captureOf(order)
    if (order.status === "COMPLETED" && cap && cap.status !== "DECLINED") {
      return { status: "captured", data: { ...data, capture_id: cap.id, paypal_status: order.status } }
    }
    return { status: order.status === "COMPLETED" ? "error" : "pending", data: { ...data, paypal_status: order.status } }
  }

  async capturePayment({ data }: CapturePaymentInput): Promise<CapturePaymentOutput> {
    if (data?.capture_id) {
      return { data }
    }
    const id = this.orderId(data)
    const order = await this.api<PayPalOrder>("POST", `/v2/checkout/orders/${id}/capture`, {}, `capture-${id}`)
    return { data: { ...data, capture_id: this.captureOf(order)?.id, paypal_status: order.status } }
  }

  async refundPayment({ data, amount }: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const cap = data?.capture_id as string | undefined
    if (!cap) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "PayPal: nothing captured to refund")
    }
    const refund = await this.api<{ id: string }>("POST", `/v2/payments/captures/${cap}/refund`, {
      amount: { value: money(amount), currency_code: String(data?.currency_code ?? "gbp").toUpperCase() },
    })
    return { data: { ...data, refunds: [...((data?.refunds as string[]) ?? []), refund.id] } }
  }

  async cancelPayment({ data }: CancelPaymentInput): Promise<CancelPaymentOutput> {
    // money already taken but the order wasn't saved → give it straight back
    if (data?.capture_id && !(data?.refunds as string[] | undefined)?.length) {
      try {
        await this.api("POST", `/v2/payments/captures/${data.capture_id}/refund`, {})
        this.logger_.warn(`PayPal: refunded capture ${data.capture_id} because the order couldn't be completed`)
      } catch (e) {
        this.logger_.error(`PayPal: couldn't refund capture ${data.capture_id}: ${(e as Error).message}`)
      }
    }
    return { data }
  }

  async deletePayment({ data }: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data }
  }

  async getPaymentStatus({ data }: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const order = await this.api<PayPalOrder>("GET", `/v2/checkout/orders/${this.orderId(data)}`)
    return { status: this.statusOf(order), data }
  }

  async retrievePayment({ data }: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const order = await this.api<PayPalOrder>("GET", `/v2/checkout/orders/${this.orderId(data)}`)
    return { data: { ...data, paypal_status: order.status } }
  }

  async getWebhookActionAndData(_payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    // payments are captured during checkout itself, so PayPal webhooks aren't needed
    return { action: "not_supported" }
  }
}
