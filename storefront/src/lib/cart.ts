"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartLine {
  slug: string;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  giftBoxes: number;
  open: boolean;
  lastAdded: string | null;
  add: (slug: string, qty?: number) => void;
  addMany: (slugs: string[]) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  setGiftBoxes: (n: number) => void;
  clear: () => void;
  setOpen: (v: boolean) => void;
}

// Storage can throw (private mode, blocked site data) — fall back to memory.
const safeStorage = createJSONStorage(() => {
  try {
    const t = "__gk";
    window.localStorage.setItem(t, t);
    window.localStorage.removeItem(t);
    return window.localStorage;
  } catch {
    const mem = new Map<string, string>();
    return {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    };
  }
});

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      giftBoxes: 0,
      open: false,
      lastAdded: null,
      add: (slug, qty = 1) =>
        set((s) => {
          const ex = s.lines.find((l) => l.slug === slug);
          const lines = ex
            ? s.lines.map((l) => (l.slug === slug ? { ...l, qty: Math.min(20, l.qty + qty) } : l))
            : [...s.lines, { slug, qty }];
          return { lines, open: true, lastAdded: slug };
        }),
      addMany: (slugs) =>
        set((s) => {
          let lines = [...s.lines];
          for (const slug of slugs) {
            const ex = lines.find((l) => l.slug === slug);
            lines = ex ? lines.map((l) => (l.slug === slug ? { ...l, qty: l.qty + 1 } : l)) : [...lines, { slug, qty: 1 }];
          }
          return { lines, open: true, lastAdded: slugs[0] ?? null };
        }),
      setQty: (slug, qty) =>
        set((s) => ({
          lines: qty <= 0 ? s.lines.filter((l) => l.slug !== slug) : s.lines.map((l) => (l.slug === slug ? { ...l, qty } : l)),
        })),
      remove: (slug) => set((s) => ({ lines: s.lines.filter((l) => l.slug !== slug) })),
      setGiftBoxes: (n) => set({ giftBoxes: Math.max(0, n) }),
      clear: () => set({ lines: [], giftBoxes: 0 }),
      setOpen: (v) => set({ open: v }),
    }),
    { name: "gk-cart", storage: safeStorage, partialize: (s) => ({ lines: s.lines, giftBoxes: s.giftBoxes }) }
  )
);
