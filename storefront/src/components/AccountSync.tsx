"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "@/lib/account";
import { useCart, type CartLine } from "@/lib/cart";
import { wakeBackend } from "@/lib/store-client";

/**
 * Loads the signed-in customer, brings their saved bag back on sign-in (merged with
 * anything already in the bag), and keeps the saved bag up to date as it changes.
 */
export function AccountSync() {
  const { init, account, saveBag } = useAccount();
  const lines = useCart((s) => s.lines);
  const setLines = useCart((s) => s.setLines);
  const merged = useRef<string | null>(null);

  useEffect(() => {
    wakeBackend();
    init();
  }, [init]);

  // on sign-in: merge the saved bag into the current one, once per account
  useEffect(() => {
    if (!account || merged.current === account.email) return;
    merged.current = account.email;
    if (!account.bag.length) return;
    const map = new Map<string, CartLine>(lines.map((l) => [l.key, l]));
    for (const l of account.bag) {
      if (!l?.key || !l.slug) continue;
      const ex = map.get(l.key);
      map.set(l.key, ex ? { ...ex, qty: Math.max(ex.qty, l.qty) } : l);
    }
    setLines([...map.values()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.email]);

  // keep the saved bag current (debounced)
  useEffect(() => {
    if (!account || merged.current !== account.email) return;
    const t = setTimeout(() => saveBag(lines), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, account?.email]);

  if (!account) merged.current = null;
  return null;
}
