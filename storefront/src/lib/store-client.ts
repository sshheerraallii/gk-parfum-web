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

const TOKEN_KEY = "gk-customer-token";
export function authToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function setAuthToken(t: string | null) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked */
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const tok = authToken();
  const r = await fetch(`${URL_}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": KEY,
      ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
      ...(init?.headers ?? {}),
    },
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

export type SyncLine = { variant_id: string; quantity: number; subscribe?: boolean };

/** The backend prices the bag (tiers, subscribe & save, free gift box, bundle delivery). */
export async function syncCart(cartId: string, lines: SyncLine[]) {
  await call(`/store/gk/carts/${cartId}/sync`, { method: "POST", body: JSON.stringify({ lines }) });
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

/* ── engagement: search log, newsletter, contact, reviews ───────── */

/** Fire-and-forget: the shop owner sees these in Admin → Searches. */
export function logSearch(query: string, results: number, source: "matcher" | "search") {
  if (!backendReady() || query.trim().length < 2) return;
  call("/store/gk/search-log", { method: "POST", body: JSON.stringify({ query: query.slice(0, 200), results, source }) }).catch(() => {});
}

export const subscribe = (email: string, phone: string | null, source: "popup" | "footer" | "checkout") =>
  call("/store/gk/subscribe", { method: "POST", body: JSON.stringify({ email, phone: phone || null, source }) });

export const sendContact = (b: { name: string; email: string; order_ref?: string; message: string }) =>
  call("/store/gk/contact", { method: "POST", body: JSON.stringify(b) });

export type Review = { id: string; product_handle: string | null; name: string; rating: number; title: string | null; body: string; verified: boolean; created_at: string };

export const getReviews = (product?: string) =>
  call<{ reviews: Review[]; count: number; average: number | null }>(`/store/gk/reviews${product ? `?product=${encodeURIComponent(product)}` : ""}`);

export const submitReview = (b: { product_handle?: string | null; name: string; email: string; rating: number; title?: string; body: string }) =>
  call("/store/gk/reviews", { method: "POST", body: JSON.stringify(b) });

/* ── customer accounts ──────────────────────────────────────────── */

export type Customer = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  metadata: Record<string, unknown> | null;
  addresses?: { id: string; first_name: string | null; last_name: string | null; address_1: string | null; address_2: string | null; city: string | null; postal_code: string | null; phone: string | null; is_default_shipping?: boolean }[];
};

export async function register(b: { email: string; password: string; first_name: string; last_name: string }) {
  const reg = await fetch(`${URL_}/auth/customer/emailpass/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: b.email, password: b.password }),
  });
  const rj = await reg.json().catch(() => ({}));
  if (!reg.ok) {
    throw new StoreError(rj?.message?.includes("exists") ? "There's already an account with this email. Sign in instead." : rj?.message ?? "Couldn't create the account.", reg.status);
  }
  setAuthToken(rj.token);
  await call("/store/customers", { method: "POST", body: JSON.stringify({ email: b.email, first_name: b.first_name, last_name: b.last_name }) });
  return login(b.email, b.password);
}

export async function login(email: string, password: string) {
  const r = await fetch(`${URL_}/auth/customer/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.token) throw new StoreError("That email and password don't match. Try again or reset your password.", r.status);
  setAuthToken(j.token);
  return me();
}

export function logout() {
  setAuthToken(null);
}

export async function me(): Promise<Customer | null> {
  if (!authToken()) return null;
  try {
    return (await call<{ customer: Customer }>("/store/customers/me?fields=*addresses")).customer;
  } catch (e) {
    if (e instanceof StoreError && e.status === 401) setAuthToken(null);
    return null;
  }
}

export async function updateMe(b: Partial<Pick<Customer, "first_name" | "last_name" | "phone" | "metadata">>) {
  return (await call<{ customer: Customer }>("/store/customers/me?fields=*addresses", { method: "POST", body: JSON.stringify(b) })).customer;
}

export async function addAddress(a: { first_name: string; last_name: string; address_1: string; address_2?: string; city: string; postal_code: string; phone?: string }) {
  return (await call<{ customer: Customer }>("/store/customers/me/addresses?fields=*addresses", {
    method: "POST",
    body: JSON.stringify({ ...a, country_code: "gb", is_default_shipping: true }),
  })).customer;
}

export async function deleteAddress(id: string) {
  await call(`/store/customers/me/addresses/${id}`, { method: "DELETE" });
  return me();
}

export type OrderSummary = { id: string; display_id: number; created_at: string; total: number; status: string; fulfillment_status: string; items: { id: string; product_title: string; quantity: number }[] };

export async function myOrders() {
  return (await call<{ orders: OrderSummary[] }>("/store/orders?fields=id,display_id,created_at,total,status,fulfillment_status,*items&order=-created_at&limit=50")).orders;
}

/** Links the current checkout cart to the signed-in customer so the order shows in their account. */
export async function attachCart(cartId: string) {
  if (!authToken()) return;
  await call(`/store/carts/${cartId}/customer`, { method: "POST" }).catch(() => {});
}

export async function requestPasswordReset(email: string) {
  await fetch(`${URL_}/auth/customer/emailpass/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email }),
  });
}
