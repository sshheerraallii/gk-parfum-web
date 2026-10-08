/**
 * Offer switches shared by the API routes, the cart repricer, the order check and the
 * admin page. Money is in major units (pounds), matching Medusa v2.
 *
 * Bundle tiers (no stacking — each bottle gets at most one discount):
 *   2+ bottles -> discountPct off every bottle
 *   3+ bottles -> discountPct off + free delivery
 * Subscribe & save -> subscription.pct off that bottle (only when the tier discount isn't on)
 * Free delivery when goods total >= freeDelivery.threshold
 * Free signature gift box added to every order
 */
export type GkOffers = {
  tiers: { enabled: boolean; discountQty: number; discountPct: number; freeShipQty: number }
  freeDelivery: { enabled: boolean; threshold: number }
  giftBox: { enabled: boolean }
  subscription: { enabled: boolean; pct: number; weeks: number }
  /** product handles, in display order. Empty = best-stocked products are used. */
  bestSellers: string[]
}

export const DEFAULT_OFFERS: GkOffers = {
  tiers: { enabled: true, discountQty: 2, discountPct: 10, freeShipQty: 3 },
  freeDelivery: { enabled: true, threshold: 65 },
  giftBox: { enabled: true },
  subscription: { enabled: true, pct: 10, weeks: 4 },
  bestSellers: [],
}

/** Older saved settings (any-3-for-£45 era) are upgraded to the tier model. */
export function normaliseOffers(raw: Partial<GkOffers> | null | undefined): GkOffers {
  const r = (raw ?? {}) as Partial<GkOffers>
  return {
    tiers: { ...DEFAULT_OFFERS.tiers, ...(r.tiers ?? {}) },
    freeDelivery: { ...DEFAULT_OFFERS.freeDelivery, ...(r.freeDelivery ?? {}) },
    giftBox: { ...DEFAULT_OFFERS.giftBox, ...(r.giftBox ?? {}) },
    subscription: { ...DEFAULT_OFFERS.subscription, ...(r.subscription ?? {}) },
    bestSellers: Array.isArray(r.bestSellers) ? r.bestSellers.filter((h) => typeof h === "string") : [],
  }
}

export const GIFT_BOX_SKU = "GKP-BOX-01"
/** Promotion code the cart sync adds automatically when a bag reaches the free-delivery tier. */
export const BUNDLE_DELIVERY_CODE = "GK-BUNDLE-DELIVERY"

export type Unit = { variant_id: string; base: number; sub: boolean }
export type Charged = Unit & { charged: number; reason: "tier" | "subscription" | null }

const pct = (pounds: number, off: number) => Math.round(Math.round(pounds * 100) * (100 - off) / 100) / 100

export function allocate(units: Unit[], offers: GkOffers): { units: Charged[]; count: number; freeShip: boolean } {
  const count = units.length
  const t = offers.tiers
  const tierOn = t.enabled && count >= t.discountQty
  const out = units.map<Charged>((u) => {
    if (tierOn) {
      return { ...u, charged: pct(u.base, t.discountPct), reason: "tier" }
    }
    if (offers.subscription.enabled && u.sub) {
      return { ...u, charged: pct(u.base, offers.subscription.pct), reason: "subscription" }
    }
    return { ...u, charged: u.base, reason: null }
  })
  return { units: out, count, freeShip: t.enabled && count >= t.freeShipQty }
}
