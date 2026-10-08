"use client";

import { create } from "zustand";
import {
  addAddress,
  backendReady,
  deleteAddress,
  login as apiLogin,
  logout as apiLogout,
  me,
  myOrders,
  register as apiRegister,
  updateMe,
  type Customer,
  type OrderSummary,
} from "./store-client";
import type { CartLine } from "./cart";

/**
 * Customer accounts: profile, addresses, wishlist and a saved bag that follows you between devices.
 * With the shop backend connected these are real Medusa customer accounts. On the preview site
 * (no backend) the same screens work against this browser only, and say so.
 */
export type Address = { id: string; first_name: string; last_name: string; address_1: string; address_2?: string; city: string; postal_code: string; phone?: string };
export type Account = {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  addresses: Address[];
  wishlist: string[];
  bag: CartLine[];
  marketing: boolean;
};
export type DemoOrder = { id: string; display_id: number; created_at: string; total: number; items: { product_title: string; quantity: number }[] };

const DEMO_KEY = "gk-demo-account";
const DEMO_ORDERS = "gk-demo-orders";

const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k: string, v: unknown) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage blocked */
  }
};

function fromCustomer(c: Customer): Account {
  const m = (c.metadata ?? {}) as Record<string, unknown>;
  return {
    email: c.email,
    first_name: c.first_name ?? "",
    last_name: c.last_name ?? "",
    phone: c.phone ?? "",
    addresses: (c.addresses ?? []).map((a) => ({
      id: a.id,
      first_name: a.first_name ?? "",
      last_name: a.last_name ?? "",
      address_1: a.address_1 ?? "",
      address_2: a.address_2 ?? "",
      city: a.city ?? "",
      postal_code: a.postal_code ?? "",
      phone: a.phone ?? "",
    })),
    wishlist: Array.isArray(m.gk_wishlist) ? (m.gk_wishlist as string[]) : [],
    bag: Array.isArray(m.gk_bag) ? (m.gk_bag as CartLine[]) : [],
    marketing: !!m.marketing_opt_in,
  };
}

interface AccountState {
  account: Account | null;
  ready: boolean;
  demo: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (b: { email: string; password: string; first_name: string; last_name: string; marketing: boolean }) => Promise<void>;
  logout: () => void;
  saveProfile: (b: Partial<Pick<Account, "first_name" | "last_name" | "phone" | "marketing">>) => Promise<void>;
  toggleWish: (slug: string) => Promise<boolean>;
  saveBag: (lines: CartLine[]) => Promise<void>;
  addAddress: (a: Omit<Address, "id">) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  orders: () => Promise<(OrderSummary | DemoOrder)[]>;
}

async function saveMeta(acc: Account, patch: Record<string, unknown>) {
  const c = await me();
  await updateMe({ metadata: { ...((c?.metadata ?? {}) as Record<string, unknown>), ...patch } });
  return acc;
}

export const useAccount = create<AccountState>()((set, get) => ({
  account: null,
  ready: false,
  demo: false,

  init: async () => {
    const demo = !backendReady();
    if (demo) {
      set({ account: read<Account | null>(DEMO_KEY, null), ready: true, demo });
      return;
    }
    const c = await me();
    set({ account: c ? fromCustomer(c) : null, ready: true, demo });
  },

  login: async (email, password) => {
    if (get().demo) {
      const a = read<Account | null>(DEMO_KEY, null);
      if (!a || a.email.toLowerCase() !== email.toLowerCase()) throw new Error("No preview account with that email on this device. Create one first.");
      set({ account: a });
      return;
    }
    const c = await apiLogin(email, password);
    if (!c) throw new Error("Signed in, but your profile couldn't be loaded. Try again.");
    set({ account: fromCustomer(c) });
  },

  register: async ({ email, password, first_name, last_name, marketing }) => {
    if (get().demo) {
      const a: Account = { email, first_name, last_name, phone: "", addresses: [], wishlist: [], bag: [], marketing };
      write(DEMO_KEY, a);
      set({ account: a });
      return;
    }
    const c = await apiRegister({ email, password, first_name, last_name });
    if (!c) throw new Error("Account created — please sign in.");
    if (marketing) await updateMe({ metadata: { ...(c.metadata ?? {}), marketing_opt_in: true } });
    set({ account: fromCustomer({ ...c, metadata: { ...(c.metadata ?? {}), marketing_opt_in: marketing } }) });
  },

  logout: () => {
    if (!get().demo) apiLogout();
    else write(DEMO_KEY, null);
    set({ account: null });
  },

  saveProfile: async (b) => {
    const acc = get().account;
    if (!acc) return;
    const next = { ...acc, ...b };
    if (get().demo) {
      write(DEMO_KEY, next);
    } else {
      const c = await updateMe({ first_name: next.first_name, last_name: next.last_name, phone: next.phone });
      await saveMeta(next, { marketing_opt_in: next.marketing });
      void c;
    }
    set({ account: next });
  },

  toggleWish: async (slug) => {
    const acc = get().account;
    if (!acc) return false;
    const on = !acc.wishlist.includes(slug);
    const next = { ...acc, wishlist: on ? [...acc.wishlist, slug] : acc.wishlist.filter((s) => s !== slug) };
    set({ account: next });
    if (get().demo) write(DEMO_KEY, next);
    else await saveMeta(next, { gk_wishlist: next.wishlist }).catch(() => {});
    return on;
  },

  saveBag: async (lines) => {
    const acc = get().account;
    if (!acc) return;
    const next = { ...acc, bag: lines };
    set({ account: next });
    if (get().demo) write(DEMO_KEY, next);
    else await saveMeta(next, { gk_bag: lines }).catch(() => {});
  },

  addAddress: async (a) => {
    const acc = get().account;
    if (!acc) return;
    if (get().demo) {
      const next = { ...acc, addresses: [...acc.addresses, { ...a, id: `addr_${Date.now()}` }] };
      write(DEMO_KEY, next);
      set({ account: next });
      return;
    }
    const c = await addAddress(a);
    set({ account: { ...acc, addresses: fromCustomer(c).addresses } });
  },

  removeAddress: async (id) => {
    const acc = get().account;
    if (!acc) return;
    if (get().demo) {
      const next = { ...acc, addresses: acc.addresses.filter((x) => x.id !== id) };
      write(DEMO_KEY, next);
      set({ account: next });
      return;
    }
    const c = await deleteAddress(id);
    set({ account: c ? { ...acc, addresses: fromCustomer(c).addresses } : acc });
  },

  orders: async () => {
    if (get().demo) return read<DemoOrder[]>(DEMO_ORDERS, []);
    return myOrders();
  },
}));

/** The preview checkout records pretend orders here so they show in the preview account. */
export function recordDemoOrder(o: DemoOrder) {
  write(DEMO_ORDERS, [o, ...read<DemoOrder[]>(DEMO_ORDERS, [])].slice(0, 20));
}
