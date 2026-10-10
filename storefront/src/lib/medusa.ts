import "server-only";
import { defaultOffers, type Offers } from "./offers";
import { scents as localScents, type Gender, type Mood, type Occasion, type Scent } from "./catalog";

export const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "";
export const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

async function store<T>(path: string, revalidate = 60): Promise<T | null> {
  if (!MEDUSA_URL || !PUBLISHABLE_KEY) return null;
  try {
    const r = await fetch(`${MEDUSA_URL}${path}`, {
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
      next: { revalidate, tags: ["catalog"] },
      // A sleeping free server can take a minute to wake; show the built-in catalogue instead of hanging.
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/** Offer switches from Admin → Offers. Defaults when the backend is unreachable. */
export async function getOffers(): Promise<Offers> {
  const j = await store<{ offers: Offers }>("/store/gk/offers");
  if (!j?.offers) return defaultOffers;
  const o = j.offers;
  return {
    tiers: { ...defaultOffers.tiers, ...(o.tiers ?? {}) },
    freeDelivery: { ...defaultOffers.freeDelivery, ...(o.freeDelivery ?? {}) },
    giftBox: { ...defaultOffers.giftBox, ...(o.giftBox ?? {}) },
    subscription: { ...defaultOffers.subscription, ...(o.subscription ?? {}) },
    shipping: o.shipping?.length ? o.shipping : defaultOffers.shipping,
    bestSellers: o.bestSellers?.length ? o.bestSellers : defaultOffers.bestSellers,
  };
}

type MProduct = {
  id: string;
  handle: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnail: string | null;
  images: { url: string }[] | null;
  metadata: Record<string, unknown> | null;
  variants: { id: string; sku: string | null; calculated_price?: { calculated_amount: number } | null }[] | null;
  tags?: { value: string }[] | null;
};

const list = (v: unknown) =>
  String(v ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

/**
 * The catalogue as edited in the admin. Fields the owner hasn't filled in fall back
 * to the launch catalogue, so a half-edited product never breaks a page.
 */
export async function getScents(): Promise<Scent[]> {
  const regions = await store<{ regions: { id: string }[] }>("/store/regions", 3600);
  const region = regions?.regions?.[0]?.id;
  const j = await store<{ products: MProduct[] }>(
    `/store/products?limit=200${region ? `&region_id=${region}` : ""}&fields=id,handle,title,subtitle,description,thumbnail,images.url,metadata,tags.value,variants.id,variants.sku,*variants.calculated_price`
  );
  if (!j?.products?.length) return localScents;

  const out: Scent[] = [];
  for (const p of j.products) {
    const m = p.metadata ?? {};
    if (m.kind === "gift_box") continue;
    const fallback = localScents.find((s) => s.slug === p.handle);
    const v = p.variants?.[0];
    const price = v?.calculated_price?.calculated_amount;
    const brand = String(m.inspired_brand ?? fallback?.inspiredBy?.brand ?? "");
    const name = String(m.inspired_name ?? fallback?.inspiredBy?.name ?? "");
    const lmin = Number(m.longevity_min ?? fallback?.longevityHours[0] ?? 6);
    const lmax = Number(m.longevity_max ?? fallback?.longevityHours[1] ?? 8);
    const images = [p.thumbnail, ...(p.images ?? []).map((i) => i.url)].filter((x): x is string => !!x);
    out.push({
      sku: v?.sku ?? fallback?.sku ?? p.id,
      slug: p.handle,
      name: p.title,
      inspiredBy: brand && name ? { brand, name } : null,
      gender: (m.gender as Gender) ?? fallback?.gender ?? "unisex",
      families: m.families ? list(m.families) : fallback?.families ?? [],
      mood: (m.mood as Mood) ?? fallback?.mood ?? "fresh",
      time: (m.time as Scent["time"]) ?? fallback?.time ?? "any",
      notes: {
        top: m.notes_top ? list(m.notes_top) : fallback?.notes.top ?? [],
        heart: m.notes_heart ? list(m.notes_heart) : fallback?.notes.heart ?? [],
        base: m.notes_base ? list(m.notes_base) : fallback?.notes.base ?? [],
      },
      description: p.description ?? fallback?.description ?? "",
      longevityHours: [lmin, lmax],
      occasions: (m.occasions ? list(m.occasions) : fallback?.occasions ?? []) as Occasion[],
      price: typeof price === "number" ? Math.round(price * 100) : fallback?.price ?? 1799,
      tint: String(m.tint ?? fallback?.tint ?? "#C9A15B"),
      oneLiner: String(m.one_liner ?? fallback?.oneLiner ?? ""),
      variantId: v?.id,
      images: [...new Set(images)],
      tags: p.tags?.length ? p.tags.map((t) => t.value) : fallback?.tags ?? [],
    });
  }
  // keep the launch order for known scents, new products at the end
  const order = new Map(localScents.map((s, i) => [s.slug, i]));
  return out.sort((a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999));
}

export const backendConfigured = () => !!(MEDUSA_URL && PUBLISHABLE_KEY);

export type PublicReview = {
  id: string;
  product_handle: string | null;
  name: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  created_at: string;
};

/** Approved reviews only (Admin → Reviews). Empty when the backend isn't connected. */
export async function getReviews(product?: string): Promise<{ reviews: PublicReview[]; count: number; average: number | null }> {
  const j = await store<{ reviews: PublicReview[]; count: number; average: number | null }>(
    `/store/gk/reviews${product ? `?product=${encodeURIComponent(product)}` : ""}`
  );
  return j ?? { reviews: [], count: 0, average: null };
}
