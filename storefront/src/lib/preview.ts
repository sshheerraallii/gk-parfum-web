"use client";

/**
 * Pre-launch mode: the shop is public but checkout is closed. Testers open /preview?key=… once;
 * the key is kept in this browser and sent with the bag so the backend lets the payment through.
 */
export const SHOP_MODE = process.env.NEXT_PUBLIC_SHOP_MODE || "live";
const K = "gk-preview";

export function previewKey(): string {
  try {
    return localStorage.getItem(K) || "";
  } catch {
    return "";
  }
}

export function setPreviewKey(v: string | null) {
  try {
    if (v) localStorage.setItem(K, v);
    else localStorage.removeItem(K);
  } catch {}
}

/** Can this visitor pay right now? */
export const checkoutOpen = () => SHOP_MODE !== "prelaunch" || !!previewKey();
