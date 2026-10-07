"use client";

/** Browser-side calls to the Medusa store API, used by checkout. */
const URL_ = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";
const CART_KEY = "gk-cart-id";

export const backendReady = () => !!(URL_ && KEY);

export class StoreError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${URL_}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "x-publishable-api-key": KEY, ...(init?.headers ?? {}) },
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new StoreError(body?.message ?? `Request failed (${r.status})`, r.status);
  return body as T;
}

export type MCart = {
  id: string;
  email: string | null;
  completed_at?: string | null;
  items: {
    id: string;
    title: string;
    product_title: string;
    product_handle?: string;
    quantity: number;
    unit_price: number;
    thumbnail: string | null;
    metadata: Record<string, unknown> | null;
    variant_id: string;
  }[];
  shipping_address?: Record<string, string | null> | null;
  shipping_methods: { shipping_option_id: string; amount: number; name: string }[];
  promotions: { code: string }[];
  item_subtotal: number;
  item_total: number;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  payment_collection?: { id: string; payment_sessions?: { id: string; provider_id: string; data: Record<string, unknown> }[] } | null;
};

const CART_FIELDS =
  "fields=*items,*shipping_methods,*promotions,*shipping_address,*payment_collection,*payment_collection.payment_sessions,+item_total,+item_subtotal,+discount_total,+shipping_total,+tax_total,+total,+subtotal";

let regionId: string | null = null;
async function region(): Promise<string> {
  if (regionId) return regionId;
  const j = await call<{ regions: { id: string; countries: { iso_2: string }[] }[] }>("/store/regions");
  const gb = j.regions.find((r) => r.countries?.some((c) => c.iso_2 === "gb")) ?? j.regions[0];
  regionId = gb.id;
  return regionId;
}

function savedCartId() {
  try {
    return localStorage.getItem(CART_KEY);
  } catch {
    return null;
  }
}
function saveCartId(id: string | null) {
  try {
    if (id) localStorage.setItem(CART_KEY, id);
    else localStorage.removeItem(CART_KEY);
  } catch {
    /* storage blocked — the cart lives for this page only */
  }
}

export async function getCart(id: string) {
  return (await call<{ cart: MCart }>(`/store/carts/${id}?${CART_FIELDS}`)).cart;
}

export async function ensureCart(): Promise<MCart> {
  const id = savedCartId();
  if (id) {
    try {
      const c = await getCart(id);
      if (!c.completed_at) return c;
    } catch {
      /* stale id — make a new cart */
    }
  }
  const { cart } = await call<{ cart: MCart }>(`/store/carts?${CART_FIELDS}`, {
    method: "POST",
    body: JSON.stringify({ region_id: await region(), shipping_address: { country_code: "gb" } }),
  });
  saveCartId(cart.id);
  return cart;
}

export const forgetCart = () => saveCartId(null);

export async function syncCart(cartId: string, lines: { variant_id: string; quantity: number }[], gift_boxes: number) {
  await call(`/store/gk/carts/${cartId}/sync`, { method: "POST", body: JSON.stringify({ lines, gift_boxes }) });
  return getCart(cartId);
}

export async function updateCart(cartId: string, body: Record<string, unknown>) {
  return (await call<{ cart: MCart }>(`/store/carts/${cartId}?${CART_FIELDS}`, { method: "POST", body: JSON.stringify(body) })).cart;
}

export type ShippingOption = { id: string; name: string; amount: number; type?: { code: string; description: string } };

export async function shippingOptions(cartId: string) {
  return (await call<{ shipping_options: ShippingOption[] }>(`/store/shipping-options?cart_id=${cartId}`)).shipping_options;
}

export async function setShipping(cartId: string, optionId: string) {
  await call(`/store/carts/${cartId}/shipping-methods`, { method: "POST", body: JSON.stringify({ option_id: optionId }) });
  return getCart(cartId);
}

export async function addPromo(cartId: string, code: string) {
  await call(`/store/carts/${cartId}/promotions`, { method: "POST", body: JSON.stringify({ promo_codes: [code] }) });
  return getCart(cartId);
}

export async function removePromo(cartId: string, code: string) {
  await call(`/store/carts/${cartId}/promotions`, { method: "DELETE", body: JSON.stringify({ promo_codes: [code] }) });
  return getCart(cartId);
}

export async function startPayment(cartId: string, provider: string) {
  const cart = await getCart(cartId);
  let pcId = cart.payment_collection?.id;
  if (!pcId) {
    const j = await call<{ payment_collection: { id: string } }>("/store/payment-collections", {
      method: "POST",
      body: JSON.stringify({ cart_id: cartId }),
    });
    pcId = j.payment_collection.id;
  }
  const j = await call<{ payment_collection: { payment_sessions: { provider_id: string; data: Record<string, unknown> }[] } }>(
    `/store/payment-collections/${pcId}/payment-sessions`,
    { method: "POST", body: JSON.stringify({ provider_id: provider }) }
  );
  return j.payment_collection.payment_sessions.find((s) => s.provider_id === provider);
}

export async function completeCart(cartId: string) {
  const j = await call<{ type: "order"; order: { id: string; display_id: number } } | { type: "cart"; error: { message: string } }>(
    `/store/carts/${cartId}/complete`,
    { method: "POST" }
  );
  if (j.type !== "order") throw new StoreError(j.error?.message ?? "Payment wasn't completed", 400);
  saveCartId(null);
  return j.order;
}

export async function regionPaymentProviders(): Promise<string[]> {
  const id = await region();
  const j = await call<{ payment_providers: { id: string }[] }>(`/store/payment-providers?region_id=${id}`);
  return j.payment_providers.map((p) => p.id);
}

export async function getOrder(id: string) {
  return (
    await call<{
      order: {
        id: string;
        display_id: number;
        email: string;
        total: number;
        shipping_total: number;
        discount_total: number;
        items: { id: string; title: string; product_title: string; quantity: number; unit_price: number }[];
        shipping_address: Record<string, string | null> | null;
        shipping_methods: { name: string }[];
      };
    }>(`/store/orders/${id}?fields=*items,*shipping_address,*shipping_methods,+total,+shipping_total,+discount_total`)
  ).order;
}
