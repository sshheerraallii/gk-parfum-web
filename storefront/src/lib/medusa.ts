import { defaultOffers, type Offers } from "./offers";

export const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "";
export const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

/** Offer switches are stored in the backend (GET /store/gk/offers). Defaults when it's unreachable. */
export async function getOffers(): Promise<Offers> {
  if (!MEDUSA_URL) return defaultOffers;
  try {
    const r = await fetch(`${MEDUSA_URL}/store/gk/offers`, {
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
      next: { revalidate: 60 },
    });
    if (!r.ok) return defaultOffers;
    const j = await r.json();
    return { ...defaultOffers, ...j.offers };
  } catch {
    return defaultOffers;
  }
}
