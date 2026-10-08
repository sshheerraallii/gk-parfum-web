"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** A bag line. The same scent can appear twice: once as a one-off, once as a 4-weekly subscription. */
export interface CartLine {
  key: string;
  slug: string;
  qty: number;
  sub?: boolean;
}

export const lineKey = (slug: string, sub?: boolean) => (sub ? `${slug}~sub` : slug);

interface CartState {
  lines: CartLine[];
  open: boolean;
  lastAdded: string | null;
  add: (slug: string, qty?: number, sub?: boolean) => void;
  addMany: (slugs: string[]) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  setLines: (lines: CartLine[]) => void;
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

const addTo = (lines: CartLine[], slug: string, qty: number, sub?: boolean) => {
  const key = lineKey(slug, sub);
  const ex = lines.find((l) => l.key === key);
  return ex
    ? lines.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + qty) } : l))
    : [...lines, { key, slug, qty: Math.min(20, qty), sub: !!sub }];
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      lastAdded: null,
      add: (slug, qty = 1, sub = false) => set((s) => ({ lines: addTo(s.lines, slug, qty, sub), open: true, lastAdded: slug })),
      addMany: (slugs) =>
        set((s) => {
          let lines = s.lines;
          for (const slug of slugs) lines = addTo(lines, slug, 1);
          return { lines, open: true, lastAdded: slugs[0] ?? null };
        }),
      setQty: (key, qty) =>
        set((s) => ({
          lines: qty <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(20, qty) } : l)),
        })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      setLines: (lines) => set({ lines }),
      clear: () => set({ lines: [] }),
      setOpen: (v) => set({ open: v }),
    }),
    {
      name: "gk-cart",
      version: 2,
      storage: safeStorage,
      partialize: (s) => ({ lines: s.lines }),
      // v1 lines had no key/sub
      migrate: (persisted) => {
        const p = persisted as { lines?: { slug: string; qty: number; key?: string; sub?: boolean }[] };
        return { lines: (p?.lines ?? []).map((l) => ({ key: l.key ?? lineKey(l.slug, l.sub), slug: l.slug, qty: l.qty, sub: !!l.sub })) } as never;
      },
    }
  )
);
