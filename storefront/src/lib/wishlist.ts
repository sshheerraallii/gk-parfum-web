"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAccount } from "./account";
import { RENAMED_SLUGS } from "./catalog";

/**
 * The wishlist. Anyone can save scents — no account needed. Guests' hearts are kept in this browser;
 * once they sign in they're merged into the account (customer metadata gk_wishlist), so the list
 * follows them to any device.
 */
interface GuestWishState {
  items: string[];
  set: (items: string[]) => void;
}

const storage = createJSONStorage(() => {
  try {
    return window.localStorage;
  } catch {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
});

export const useGuestWish = create<GuestWishState>()(
  persist((set) => ({ items: [], set: (items) => set({ items }) }), {
    name: "gk-wishlist",
    version: 1,
    storage,
  })
);

/** One hook for both: the signed-in account's list, or this browser's. */
export function useWishlist() {
  const account = useAccount((s) => s.account);
  const toggleAccount = useAccount((s) => s.toggleWish);
  const guest = useGuestWish((s) => s.items);
  const setGuest = useGuestWish((s) => s.set);
  // the guest list lives in this browser, so it's only read after the page has loaded (no flicker on hydration)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const items = mounted ? (account ? account.wishlist : guest).map((s) => RENAMED_SLUGS[s] ?? s) : [];

  const toggle = async (slug: string): Promise<boolean> => {
    if (account) return toggleAccount(slug);
    const on = !guest.includes(slug);
    setGuest(on ? [...guest, slug] : guest.filter((s) => s !== slug));
    return on;
  };

  return { ready: mounted, items, count: items.length, has: (slug: string) => items.includes(slug), toggle, signedIn: !!account };
}
