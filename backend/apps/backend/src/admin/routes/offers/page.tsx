import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Tag } from "@medusajs/icons"
import { Badge, Button, Checkbox, Container, Heading, Input, Label, Switch, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

type Offers = {
  tiers: { enabled: boolean; discountQty: number; discountPct: number; freeShipQty: number }
  freeDelivery: { enabled: boolean; threshold: number }
  giftBox: { enabled: boolean }
  subscription: { enabled: boolean; pct: number; weeks: number }
  bestSellers: string[]
}
type Product = { id: string; handle: string; title: string; thumbnail: string | null; variants?: { sku: string | null }[] }

const Row = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col gap-y-4 px-6 py-5">{children}</div>

const Head = ({ title, help, on, set }: { title: string; help: string; on: boolean; set: (v: boolean) => void }) => (
  <div className="flex items-start justify-between gap-6">
    <div>
      <Heading level="h2">{title}</Heading>
      <Text size="small" className="text-ui-fg-subtle">{help}</Text>
    </div>
    <Switch checked={on} onCheckedChange={set} />
  </div>
)

const Num = ({ label, value, set, step = 1, min = 0 }: { label: string; value: number; set: (n: number) => void; step?: number; min?: number }) => (
  <div>
    <Label size="small">{label}</Label>
    <Input type="number" step={step} min={min} value={value} onChange={(e) => set(Number(e.target.value))} />
  </div>
)

const OffersPage = () => {
  const [o, setO] = useState<Offers | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/admin/gk/offers", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setO(j.offers))
    fetch("/admin/products?limit=200&fields=id,handle,title,thumbnail,variants.sku&status[]=published", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setProducts((j.products ?? []).filter((p: Product) => !(p.variants ?? []).some((v) => v.sku === "GKP-BOX-01"))))
  }, [])

  const save = async () => {
    if (!o) {
      return
    }
    setSaving(true)
    const r = await fetch("/admin/gk/offers", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(o),
    })
    setSaving(false)
    if (r.ok) {
      toast.success("Offers saved", { description: "The website updates within a minute." })
    } else {
      toast.error("Couldn't save", { description: (await r.json()).message })
    }
  }

  if (!o) {
    return <Container className="p-6"><Text>Loading offers…</Text></Container>
  }

  const t = o.tiers
  const toggleBest = (h: string) =>
    setO({ ...o, bestSellers: o.bestSellers.includes(h) ? o.bestSellers.filter((x) => x !== h) : [...o.bestSellers, h].slice(0, 12) })

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Offers</Heading>
            <Text size="small" className="text-ui-fg-subtle">Shop-wide deals. Discount codes live in Promotions.</Text>
          </div>
          <Button onClick={save} isLoading={saving}>Save</Button>
        </div>

        <Row>
          <Head
            title="Bundle tiers"
            help={`1 bottle: full price · ${t.discountQty}+ bottles: ${t.discountPct}% off every bottle · ${t.freeShipQty}+ bottles: ${t.discountPct}% off + free delivery`}
            on={t.enabled}
            set={(v) => setO({ ...o, tiers: { ...t, enabled: v } })}
          />
          <div className="grid grid-cols-3 gap-4">
            <Num label="Bottles to unlock discount" value={t.discountQty} min={2} set={(n) => setO({ ...o, tiers: { ...t, discountQty: n } })} />
            <Num label="Discount (%)" value={t.discountPct} min={1} set={(n) => setO({ ...o, tiers: { ...t, discountPct: n } })} />
            <Num label="Bottles for free delivery" value={t.freeShipQty} min={2} set={(n) => setO({ ...o, tiers: { ...t, freeShipQty: n } })} />
          </div>
        </Row>

        <Row>
          <Head
            title="Free delivery over a spend"
            help="Royal Mail Tracked 48 is free above this amount, whatever is in the bag."
            on={o.freeDelivery.enabled}
            set={(v) => setO({ ...o, freeDelivery: { ...o.freeDelivery, enabled: v } })}
          />
          <div className="max-w-[220px]">
            <Num label="Spend over (£)" value={o.freeDelivery.threshold} step={0.01} set={(n) => setO({ ...o, freeDelivery: { ...o.freeDelivery, threshold: n } })} />
          </div>
        </Row>

        <Row>
          <Head
            title="Subscribe & save"
            help="Shoppers can choose 'Deliver every few weeks' on a scent. Doesn't stack with the bundle discount — each bottle gets the better one."
            on={o.subscription.enabled}
            set={(v) => setO({ ...o, subscription: { ...o.subscription, enabled: v } })}
          />
          <div className="grid max-w-[460px] grid-cols-2 gap-4">
            <Num label="Discount (%)" value={o.subscription.pct} min={1} set={(n) => setO({ ...o, subscription: { ...o.subscription, pct: n } })} />
            <Num label="Every (weeks)" value={o.subscription.weeks} min={1} set={(n) => setO({ ...o, subscription: { ...o.subscription, weeks: n } })} />
          </div>
        </Row>

        <Row>
          <Head
            title="Free signature gift box"
            help="Added to every order at £0 so it shows on the packing list."
            on={o.giftBox.enabled}
            set={(v) => setO({ ...o, giftBox: { enabled: v } })}
          />
        </Row>
      </Container>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Best sellers</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Shown first in the bundle builder, the bag and "Which perfume do you love?". Tick them in the order you want.
            If none are ticked, the best-stocked scents are used.
          </Text>
        </div>
        <div className="grid grid-cols-1 gap-2 px-6 py-5 md:grid-cols-2">
          {products.map((p) => {
            const pos = o.bestSellers.indexOf(p.handle)
            return (
              <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 hover:bg-ui-bg-base-hover">
                <Checkbox checked={pos >= 0} onCheckedChange={() => toggleBest(p.handle)} />
                {p.thumbnail ? <img src={p.thumbnail} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-ui-bg-subtle" />}
                <Text size="small" className="flex-1">{p.title}</Text>
                {pos >= 0 && <Badge size="2xsmall">#{pos + 1}</Badge>}
              </label>
            )
          })}
        </div>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Offers", icon: Tag })

export default OffersPage
