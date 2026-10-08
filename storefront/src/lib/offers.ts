/**
 * Offer rules. In production these come from the backend (Admin → Offers), where each
 * one can be switched on/off and edited. These defaults are used until the backend
 * responds, and by the preview (demo) site. Money is in pence.
 *
 * Bundle tiers (no stacking — every bottle gets at most one discount):
 *   1 bottle   → full price
 *   2+ bottles → 10% off every bottle
 *   3+ bottles → 10% off + free delivery
 * Subscribe (deliver every 4 weeks) → 10% off that bottle, even on its own.
 * Free delivery on any order over £65. Free signature gift box with every order.
 */
export interface Offers {
  tiers: { enabled: boolean; discountQty: number; discountPct: number; freeShipQty: number };
  freeDelivery: { enabled: boolean; threshold: number };
  giftBox: { enabled: boolean; name: string };
  subscription: { enabled: boolean; pct: number; weeks: number };
  shipping: { id: string; name: string; eta: string; price: number }[];
  /** product handles chosen in Admin → Offers; when empty the backend picks the best-stocked */
  bestSellers: string[];
}

export const defaultOffers: Offers = {
  tiers: { enabled: true, discountQty: 2, discountPct: 10, freeShipQty: 3 },
  freeDelivery: { enabled: true, threshold: 6500 },
  giftBox: { enabled: true, name: "Signature gift box" },
  subscription: { enabled: true, pct: 10, weeks: 4 },
  shipping: [
    { id: "tracked-48", name: "Royal Mail Tracked 48", eta: "2–3 working days", price: 399 },
    { id: "tracked-24", name: "Royal Mail Tracked 24", eta: "Next working day", price: 599 },
  ],
  bestSellers: ["royal-adventure", "crimson-luxe", "angels-cognac", "midnight-orchid", "lost-cherry-dream", "delina-exclusive"],
};

export interface PricedLine {
  slug: string;
  qty: number;
  unit: number;
  sub?: boolean;
}

const off = (pence: number, pct: number) => Math.round((pence * (100 - pct)) / 100);

/** Prices the bag exactly as the backend does. */
export function priceCart(lines: PricedLine[], offers: Offers) {
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.unit * l.qty, 0);
  const t = offers.tiers;
  const tierOn = t.enabled && count >= t.discountQty;
  const subOn = offers.subscription.enabled;
  let goods = 0;
  let tierSaving = 0;
  let subSaving = 0;
  for (const l of lines) {
    if (tierOn) {
      const p = off(l.unit, t.discountPct);
      goods += p * l.qty;
      tierSaving += (l.unit - p) * l.qty;
    } else if (subOn && l.sub) {
      const p = off(l.unit, offers.subscription.pct);
      goods += p * l.qty;
      subSaving += (l.unit - p) * l.qty;
    } else {
      goods += l.unit * l.qty;
    }
  }
  const tierShip = t.enabled && count >= t.freeShipQty;
  const spendShip = offers.freeDelivery.enabled && goods >= offers.freeDelivery.threshold;
  const freeDelivery = tierShip || spendShip;
  const toDiscount = t.enabled ? Math.max(0, t.discountQty - count) : 0;
  const toFreeShip = t.enabled ? Math.max(0, t.freeShipQty - count) : 0;
  const freeDeliveryLeft = offers.freeDelivery.enabled ? Math.max(0, offers.freeDelivery.threshold - goods) : null;
  return { count, subtotal, goods, tierOn, tierSaving, subSaving, saving: tierSaving + subSaving, freeDelivery, tierShip, toDiscount, toFreeShip, freeDeliveryLeft };
}

export function shippingFor(totals: { freeDelivery: boolean }, optionId: string, offers: Offers) {
  const opt = offers.shipping.find((s) => s.id === optionId) ?? offers.shipping[0];
  const free = totals.freeDelivery && opt.id === offers.shipping[0].id;
  return { option: opt, cost: free ? 0 : opt.price };
}

/** One-line description of the next reward, for the bag and bundle builder. */
export function nextReward(count: number, offers: Offers): string | null {
  const t = offers.tiers;
  if (!t.enabled) return null;
  if (count < t.discountQty) {
    const n = t.discountQty - count;
    return `Add ${n} more ${n === 1 ? "bottle" : "bottles"} to save ${t.discountPct}%`;
  }
  if (count < t.freeShipQty) {
    const n = t.freeShipQty - count;
    return `Add ${n} more ${n === 1 ? "bottle" : "bottles"} for free delivery`;
  }
  return null;
}
