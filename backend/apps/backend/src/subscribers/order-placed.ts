import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { GIFT_BOX_SKU } from "../lib/offers"
import type { EmailItem } from "../lib/emails"
import { ownerEmail, sendEmail } from "../lib/send-email"

const num = (v: unknown) => Number(v ?? 0) || 0

/** Order confirmation to the customer + a new-order alert to the owner. */
export default async function orderPlaced({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: rows } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "total",
      "item_total",
      "item_subtotal",
      "discount_total",
      "shipping_total",
      "items.title",
      "items.product_title",
      "items.variant_title",
      "items.variant_sku",
      "items.quantity",
      "items.total",
      "items.metadata",
      "items.adjustments.code",
      "shipping_address.*",
      "shipping_methods.name",
      "shipping_methods.adjustments.code",
    ],
    filters: { id: data.id },
  })
  const o = rows[0] as unknown as Record<string, any>
  if (!o) {
    return
  }
  const items = (o.items ?? []) as Record<string, any>[]
  const giftBox = items.some((i) => i.variant_sku === GIFT_BOX_SKU)
  const sub = items.map((i) => (i.metadata ?? {}).gk_subscription).find(Boolean) as string | undefined
  const codes = new Set<string>()
  for (const i of items) for (const a of i.adjustments ?? []) if (a?.code) codes.add(a.code)
  for (const m of o.shipping_methods ?? []) for (const a of m?.adjustments ?? []) if (a?.code) codes.add(a.code)
  codes.delete("GK-BUNDLE-DELIVERY")

  const lines: EmailItem[] = items.map((i) => ({
    title: i.variant_sku === GIFT_BOX_SKU ? "Signature gift box" : i.product_title || i.title,
    variant: i.variant_sku === GIFT_BOX_SKU ? null : i.variant_title && i.variant_title !== "Default" ? i.variant_title : "100 ml extrait de parfum",
    quantity: num(i.quantity),
    total: num(i.total),
    note: (i.metadata ?? {}).gk_subscription ? `Repeat: ${(i.metadata ?? {}).gk_subscription}` : null,
  }))
  const shippingTotal = num(o.shipping_total)
  const payload = {
    display_id: o.display_id,
    email: o.email,
    first_name: o.shipping_address?.first_name ?? null,
    items: lines,
    // item subtotal before discounts; discounts shown as one "Savings" line
    subtotal: num(o.item_subtotal) || lines.reduce((a, l) => a + l.total, 0),
    discount_total: num(o.discount_total),
    shipping_total: shippingTotal,
    total: num(o.total),
    shipping_method: o.shipping_methods?.[0]?.name ?? null,
    shipping_address: o.shipping_address ?? null,
    gift_box: giftBox,
    subscription: sub ?? null,
    promo_codes: [...codes],
  }
  await sendEmail(container, o.email, "order-placed", payload)
  await sendEmail(container, ownerEmail(), "order-placed-owner", payload)
}

export const config: SubscriberConfig = { event: "order.placed" }
