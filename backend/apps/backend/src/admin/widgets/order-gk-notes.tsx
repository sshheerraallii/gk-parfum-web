import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"

/** Shows the GK-specific parts of an order the default screen hides: subscriptions, discounts, the free box. */
const OrderGkNotes = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const items = (data.items ?? []).filter((i) => {
    const m = (i.metadata ?? {}) as Record<string, unknown>
    return m.gk_subscription || m.gk_discount || m.gk_gift_box
  })
  if (!items.length) {
    return null
  }
  return (
    <Container className="p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Packing notes</Heading>
      </div>
      <ul className="divide-y">
        {items.map((i) => {
          const m = (i.metadata ?? {}) as Record<string, string>
          return (
            <li key={i.id} className="flex flex-wrap items-center gap-2 px-6 py-3">
              <Text size="small" weight="plus">{i.quantity} × {i.product_title}</Text>
              {m.gk_subscription && <Badge size="2xsmall" color="blue">Repeat: {m.gk_subscription}</Badge>}
              {m.gk_discount && <Badge size="2xsmall">{m.gk_discount}</Badge>}
              {m.gk_gift_box && <Badge size="2xsmall" color="green">Free gift box</Badge>}
            </li>
          )
        })}
      </ul>
    </Container>
  )
}

export const config = defineWidgetConfig({ zone: "order.details.side.after" })

export default OrderGkNotes
