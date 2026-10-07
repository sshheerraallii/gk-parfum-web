/**
 * Offer rules. In production these come from the backend (Admin → Promotions / Store settings),
 * where each one can be switched on/off and edited. These defaults are used until the
 * backend responds, and by the local preview.
 */
export interface Offers {
  bundle: { enabled: boolean; qty: number; price: number; label: string };
  freeDelivery: { enabled: boolean; threshold: number };
  giftBox: { enabled: boolean; price: number; name: string };
  shipping: { id: string; name: string; eta: string; price: number }[];
}

export const defaultOffers: Offers = {
  bundle: { enabled: true, qty: 3, price: 4500, label: "Any 3 for £45" },
  freeDelivery: { enabled: true, threshold: 3500 },
  giftBox: { enabled: true, price: 499, name: "Signature gift box" },
  shipping: [
    { id: "tracked-48", name: "Royal Mail Tracked 48", eta: "2–3 working days", price: 399 },
    { id: "tracked-24", name: "Royal Mail Tracked 24", eta: "Next working day", price: 599 },
  ],
};

export interface PricedLine {
  slug: string;
  qty: number;
  unit: number;
}

/** Bundle price applies to every complete group of N bottles, most expensive bottles first. */
export function priceCart(lines: PricedLine[], offers: Offers, giftBoxes: number) {
  const units = lines.flatMap((l) => Array.from({ length: l.qty }, () => l.unit)).sort((a, b) => b - a);
  const subtotal = units.reduce((a, b) => a + b, 0);
  let bundleSaving = 0;
  let bundledCount = 0;
  if (offers.bundle.enabled && units.length >= offers.bundle.qty) {
    const groups = Math.floor(units.length / offers.bundle.qty);
    for (let g = 0; g < groups; g++) {
      const group = units.slice(g * offers.bundle.qty, (g + 1) * offers.bundle.qty);
      const full = group.reduce((a, b) => a + b, 0);
      bundleSaving += Math.max(0, full - offers.bundle.price);
    }
    bundledCount = groups * offers.bundle.qty;
  }
  const boxes = offers.giftBox.enabled ? giftBoxes * offers.giftBox.price : 0;
  const goods = subtotal - bundleSaving + boxes;
  const toNextBundle =
    offers.bundle.enabled && units.length > 0
      ? (offers.bundle.qty - (units.length % offers.bundle.qty)) % offers.bundle.qty
      : 0;
  const freeDeliveryLeft = offers.freeDelivery.enabled ? Math.max(0, offers.freeDelivery.threshold - goods) : null;
  return { count: units.length, subtotal, bundleSaving, bundledCount, boxes, goods, toNextBundle, freeDeliveryLeft };
}

export function shippingFor(goods: number, optionId: string, offers: Offers) {
  const opt = offers.shipping.find((s) => s.id === optionId) ?? offers.shipping[0];
  const free =
    offers.freeDelivery.enabled && goods >= offers.freeDelivery.threshold && opt.id === offers.shipping[0].id;
  return { option: opt, cost: free ? 0 : opt.price };
}
