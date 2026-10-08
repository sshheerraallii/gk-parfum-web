"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { useOffers } from "@/lib/useOffers";
import { bySlug, formatPrice, inspiredLabel } from "@/lib/catalog";
import { useBestSellers, useCatalog } from "./CatalogProvider";
import { ProductVisual } from "./ProductVisual";
import { nextReward, priceCart } from "@/lib/offers";
import { TierProgress } from "./TierProgress";

export function CartDrawer() {
  const { lines, open, setOpen, setQty, add } = useCart();
  const offers = useOffers();
  const scents = useCatalog();
  const best = useBestSellers();
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!mounted) return null;

  const priced = lines
    .map((l) => ({ l, s: bySlug(l.slug, scents) }))
    .filter((x): x is { l: (typeof lines)[number]; s: NonNullable<ReturnType<typeof bySlug>> } => !!x.s);
  const totals = priceCart(priced.map(({ l, s }) => ({ slug: l.slug, qty: l.qty, unit: s.price, sub: l.sub })), offers);
  const inBag = new Set(lines.map((l) => l.slug));
  const suggestions = best.filter((s) => !inBag.has(s.slug)).slice(0, 4);
  const reward = nextReward(totals.count, offers);
  const linePrice = (unit: number, sub?: boolean) =>
    totals.tierOn ? Math.round(unit * (100 - offers.tiers.discountPct) / 100) : sub && offers.subscription.enabled ? Math.round(unit * (100 - offers.subscription.pct) / 100) : unit;

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open} inert={!open}>
      <div
        className={`absolute inset-0 bg-[#040b24]/70 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => setOpen(false)}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        tabIndex={-1}
        className={`absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col border-l border-[var(--line)] bg-ebony shadow-2xl outline-none transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-6 pb-4 pt-5">
          <h2 className="display-m">Your bag</h2>
          <button type="button" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full text-smoke hover:text-ivory" aria-label="Close bag">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="1.6" /></svg>
          </button>
        </div>

        {totals.count > 0 && (
          <div className="mx-6 mb-2 rounded-[var(--radius-m)] bg-[var(--ebony-2)] p-4 text-[0.92rem]">
            <p className="mb-4 text-ivory" aria-live="polite">
              {reward ?? (totals.freeDelivery ? `You're saving ${formatPrice(totals.saving)} and delivery is free.` : `You're saving ${formatPrice(totals.saving)}.`)}
            </p>
            <TierProgress count={totals.count} offers={offers} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6">
          {priced.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center pb-24 text-center">
              <p className="display-m">Your bag is empty</p>
              <p className="mt-2 max-w-[30ch] text-smoke">Pick 2 scents to save {offers.tiers.discountPct}%, or 3 for free delivery too.</p>
              <Link href="/bundle" onClick={() => setOpen(false)} className="btn btn-gold mt-6">Build your bundle</Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--line-soft)]">
              {priced.map(({ l, s }) => {
                const each = linePrice(s.price, l.sub);
                return (
                  <li key={l.key} className="flex gap-4 py-4">
                    <Link href={`/perfume/${s.slug}`} onClick={() => setOpen(false)} className="flex h-24 w-16 shrink-0 items-center justify-center rounded-[var(--radius-s)] bg-[#081440]/50">
                      <ProductVisual s={s} className="h-20 w-auto max-w-[56px]" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/perfume/${s.slug}`} onClick={() => setOpen(false)} className="font-display text-[1.3rem] leading-tight text-ivory hover:text-champagne">
                          {s.name}
                        </Link>
                        <span className="shrink-0 text-right text-ivory">
                          {each < s.price && <span className="small mr-1.5 text-smoke line-through">{formatPrice(s.price * l.qty)}</span>}
                          {formatPrice(each * l.qty)}
                        </span>
                      </div>
                      <p className="small mt-0.5 text-smoke">Inspired by {inspiredLabel(s)} · 100 ml</p>
                      {l.sub && <p className="small mt-1 text-champagne">Delivered every {offers.subscription.weeks} weeks</p>}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex items-center rounded-full border border-[var(--line)]">
                          <button type="button" className="flex h-9 w-9 items-center justify-center text-lg text-ivory" onClick={() => setQty(l.key, l.qty - 1)} aria-label={`One less ${s.name}`}>−</button>
                          <span className="w-6 text-center tabular-nums" aria-live="polite">{l.qty}</span>
                          <button type="button" className="flex h-9 w-9 items-center justify-center text-lg text-ivory" onClick={() => setQty(l.key, l.qty + 1)} aria-label={`One more ${s.name}`}>+</button>
                        </div>
                        <button type="button" className="small text-smoke underline-offset-4 hover:text-ivory hover:underline" onClick={() => setQty(l.key, 0)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {priced.length > 0 && offers.giftBox.enabled && (
            <div className="mt-2 flex items-center gap-4 rounded-[var(--radius-m)] border border-[var(--line)] p-4">
              <img src="/brand/gk-crest-112.webp" alt="" aria-hidden className="h-12 w-auto" />
              <p className="flex-1">
                <span className="block text-ivory">Free {offers.giftBox.name.toLowerCase()}</span>
                <span className="small text-smoke">Included with every order.</span>
              </p>
              <span className="text-champagne">Free</span>
            </div>
          )}

          {priced.length > 0 && suggestions.length > 0 && (
            <div className="mb-6 mt-8">
              <p className="mb-3 text-smoke">Best sellers to add</p>
              <ul className="no-scrollbar -mx-6 flex gap-3 overflow-x-auto px-6">
                {suggestions.map((s) => (
                  <li key={s.slug} className="w-[150px] shrink-0 rounded-[var(--radius-m)] bg-[var(--ebony-2)] p-3">
                    <div className="flex h-24 items-center justify-center"><ProductVisual s={s} className="h-24 w-auto max-w-[110px]" /></div>
                    <p className="mt-2 font-display text-[1.05rem] leading-tight">{s.name}</p>
                    <p className="small truncate text-smoke">{inspiredLabel(s)}</p>
                    <button type="button" onClick={() => add(s.slug)} className="small mt-2 h-9 w-full rounded-full border border-[var(--line)] text-ivory hover:border-gilt hover:text-champagne">
                      Add · {formatPrice(s.price)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {priced.length > 0 && (
          <div className="border-t border-[var(--line-soft)] px-6 pb-6 pt-4">
            <dl className="space-y-1.5 text-[0.95rem]">
              <div className="flex justify-between text-smoke"><dt>Normal price</dt><dd>{formatPrice(totals.subtotal)}</dd></div>
              {totals.tierSaving > 0 && (
                <div className="flex justify-between text-champagne"><dt>Bundle discount ({offers.tiers.discountPct}%)</dt><dd>−{formatPrice(totals.tierSaving)}</dd></div>
              )}
              {totals.subSaving > 0 && (
                <div className="flex justify-between text-champagne"><dt>Subscribe &amp; save ({offers.subscription.pct}%)</dt><dd>−{formatPrice(totals.subSaving)}</dd></div>
              )}
              <div className="flex justify-between text-smoke"><dt>Delivery</dt><dd>{totals.freeDelivery ? "Free" : "From " + formatPrice(offers.shipping[0]?.price ?? 0)}</dd></div>
              <div className="flex justify-between pt-1 text-[1.1rem] text-ivory"><dt>Total</dt><dd>{formatPrice(totals.goods)}</dd></div>
            </dl>
            <Link href="/checkout" onClick={() => setOpen(false)} className="btn btn-gold mt-4 w-full">
              Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
