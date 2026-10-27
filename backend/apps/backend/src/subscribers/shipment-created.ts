import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { GIFT_BOX_SKU } from "../lib/offers"
import { sendEmail } from "../lib/send-email"

/** "On its way" email when the owner marks a fulfilment as shipped in the admin (with tracking, if entered). */
export default async function shipmentCreated({ event: { data }, container }: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  if (data.no_notification) {
    return
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: rows } = await query.graph({
    entity: "fulfillment",
    fields: [
      "id",
      "labels.tracking_number",
      "labels.tracking_url",
      "items.title",
      "items.sku",
      "items.quantity",
      "order.display_id",
      "order.email",
      "order.shipping_address.first_name",
    ],
    filters: { id: data.id },
  })
  const f = rows[0] as unknown as Record<string, any>
  if (!f?.order) {
    return
  }
  const label = (f.labels ?? [])[0] ?? {}
  await sendEmail(container, f.order.email, "order-shipped", {
    display_id: f.order.display_id,
    first_name: f.order.shipping_address?.first_name ?? null,
    tracking_number: label.tracking_number || null,
    tracking_url: label.tracking_url && /^https?:\/\//.test(label.tracking_url) ? label.tracking_url : null,
    carrier: "Royal Mail",
    items: (f.items ?? [])
      .filter((i: any) => i.sku !== GIFT_BOX_SKU)
      .map((i: any) => ({ title: i.title, quantity: Number(i.quantity) || 1, total: 0 })),
  })
}

export const config: SubscriberConfig = { event: "shipment.created" }
