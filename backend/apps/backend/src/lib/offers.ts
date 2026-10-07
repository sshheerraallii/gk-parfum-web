/**
 * Offer switches shared by the API routes, the cart repricer and the admin page.
 * Money is in major units (pounds), matching Medusa v2.
 */
export type GkOffers = {
  bundle: { enabled: boolean; qty: number; price: number; label: string }
  freeDelivery: { enabled: boolean; threshold: number }
  giftBox: { enabled: boolean }
}

export const DEFAULT_OFFERS: GkOffers = {
  bundle: { enabled: true, qty: 3, price: 45, label: "Any 3 for £45" },
  freeDelivery: { enabled: true, threshold: 35 },
  giftBox: { enabled: true },
}

export const GIFT_BOX_SKU = "GKP-BOX-01"
export const PERFUME_TYPE = "Perfume"

export type Unit = { variant_id: string; base: number }

/**
 * Bundle allocation: units sorted dearest-first; every complete group of `qty`
 * costs `price`, split evenly in pence (remainder on the last unit). Others pay base.
 * Returns the charged price per unit, in the same order as the sorted input.
 */
export function allocate(units: Unit[], offers: GkOffers) {
  const sorted = [...units].sort((a, b) => b.base - a.base)
  const out: { variant_id: string; base: number; charged: number; bundled: boolean }[] = []
  const { enabled, qty, price } = offers.bundle
  const groups = enabled && qty > 0 ? Math.floor(sorted.length / qty) : 0
  for (let g = 0; g < groups; g++) {
    const group = sorted.slice(g * qty, (g + 1) * qty)
    const full = group.reduce((a, u) => a + u.base, 0)
    if (full <= price) {
      // never charge more than the normal price
      group.forEach((u) => out.push({ ...u, charged: u.base, bundled: false }))
      continue
    }
    const pence = Math.round(price * 100)
    const each = Math.floor(pence / qty)
    group.forEach((u, i) => {
      const p = i === qty - 1 ? pence - each * (qty - 1) : each
      out.push({ ...u, charged: p / 100, bundled: true })
    })
  }
  sorted.slice(groups * qty).forEach((u) => out.push({ ...u, charged: u.base, bundled: false }))
  return out
}
