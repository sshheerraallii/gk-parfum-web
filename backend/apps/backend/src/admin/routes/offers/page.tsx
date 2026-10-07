import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Tag } from "@medusajs/icons"
import { Button, Container, Heading, Input, Label, Switch, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

type Offers = {
  bundle: { enabled: boolean; qty: number; price: number; label: string }
  freeDelivery: { enabled: boolean; threshold: number }
  giftBox: { enabled: boolean }
}

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col gap-y-4 px-6 py-5">{children}</div>
)

const OffersPage = () => {
  const [o, setO] = useState<Offers | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/admin/gk/offers", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setO(j.offers))
  }, [])

  const save = async () => {
    if (!o) return
    setSaving(true)
    const r = await fetch("/admin/gk/offers", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(o),
    })
    setSaving(false)
    if (r.ok) toast.success("Offers saved", { description: "The website updates within a minute." })
    else toast.error("Couldn't save", { description: (await r.json()).message })
  }

  if (!o) return <Container className="p-6"><Text>Loading offers…</Text></Container>

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Offers</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Switch shop-wide offers on or off. Discount codes live in Promotions.
            </Text>
          </div>
          <Button onClick={save} isLoading={saving}>Save</Button>
        </div>

        <Row>
          <div className="flex items-center justify-between">
            <div>
              <Heading level="h2">Bundle price</Heading>
              <Text size="small" className="text-ui-fg-subtle">Any {o.bundle.qty} bottles for £{o.bundle.price}. Applies to every full set in the bag.</Text>
            </div>
            <Switch checked={o.bundle.enabled} onCheckedChange={(v) => setO({ ...o, bundle: { ...o.bundle, enabled: v } })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label size="small">Bottles per set</Label>
              <Input type="number" min={2} max={10} value={o.bundle.qty} onChange={(e) => setO({ ...o, bundle: { ...o.bundle, qty: Number(e.target.value) } })} />
            </div>
            <div>
              <Label size="small">Set price (£)</Label>
              <Input type="number" step="0.01" min={1} value={o.bundle.price} onChange={(e) => setO({ ...o, bundle: { ...o.bundle, price: Number(e.target.value) } })} />
            </div>
            <div>
              <Label size="small">Label shown on the site</Label>
              <Input value={o.bundle.label} onChange={(e) => setO({ ...o, bundle: { ...o.bundle, label: e.target.value } })} />
            </div>
          </div>
        </Row>

        <Row>
          <div className="flex items-center justify-between">
            <div>
              <Heading level="h2">Free delivery</Heading>
              <Text size="small" className="text-ui-fg-subtle">Royal Mail Tracked 48 becomes free above this spend.</Text>
            </div>
            <Switch checked={o.freeDelivery.enabled} onCheckedChange={(v) => setO({ ...o, freeDelivery: { ...o.freeDelivery, enabled: v } })} />
          </div>
          <div className="max-w-[200px]">
            <Label size="small">Spend over (£)</Label>
            <Input type="number" step="0.01" min={0} value={o.freeDelivery.threshold} onChange={(e) => setO({ ...o, freeDelivery: { ...o.freeDelivery, threshold: Number(e.target.value) } })} />
          </div>
        </Row>

        <Row>
          <div className="flex items-center justify-between">
            <div>
              <Heading level="h2">Gift box add-on</Heading>
              <Text size="small" className="text-ui-fg-subtle">Offer the presentation box in the bag. Change its price in Products → Signature gift box.</Text>
            </div>
            <Switch checked={o.giftBox.enabled} onCheckedChange={(v) => setO({ ...o, giftBox: { enabled: v } })} />
          </div>
        </Row>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Offers", icon: Tag })

export default OffersPage
