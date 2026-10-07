"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { useOffers } from "@/lib/useOffers";
import { bySlug, formatPrice, inspiredLabel, scents } from "@/lib/catalog";
import { priceCart } from "@/lib/offers";
import { Bottle } from "./Bottle";

export function CartDrawer() {
  const { lines, open, setOpen, setQty, add, giftBoxes, setGiftBoxes } = useCart();
  const offers = useOffers();
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
    .map((l) => ({ l, s: bySlug(l.slug) }))
    .filter((x): x is { l: (typeof lines)[number]; s: NonNullable<ReturnType<typeof bySlug>> } => !!x.s);
  const totals = priceCart(priced.map(({ l, s }) => ({ slug: l.slug, qty: l.qty, unit: s.price })), offers, giftBoxes);
  const inBag = new Set(lines.map((l) => l.slug));
  const suggestions = scents.filter((s) => !inBag.has(s.slug)).slice(0, 3);

  const fdPct =
    offers.freeDelivery.enabled && totals.freeDeliveryLeft !== null
      ? Math.min(100, (totals.goods / offers.freeDelivery.threshold) * 100)
      : 0;

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
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

        {/* progress: offers made visible */}
        {totals.count > 0 && (
          <div className="mx-6 mb-2 space-y-3 rounded-[var(--radius-m)] bg-[var(--ebony-2)] p-4 text-[0.92rem]">
            {offers.bundle.enabled && (
              <p className="text-ivory">
                {totals.toNextBundle === 0 ? (
                  <>You&apos;re getting {offers.bundle.label.toLowerCase()} — saving {formatPrice(totals.bundleSaving)}.</>
                ) : (
                  <>Add {totals.toNextBundle} more {totals.toNextBundle === 1 ? "bottle" : "bottles"} for {offers.bundle.label.toLowerCase()}.</>
                )}
              </p>
            )}
            {offers.freeDelivery.enabled && totals.freeDeliveryLeft !== null && (
              <div>
                <p className="mb-2 text-smoke">
                  {totals.freeDeliveryLeft === 0 ? "Free UK delivery unlocked." : `${formatPrice(totals.freeDeliveryLeft)} away from free delivery.`}
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-black/40" role="progressbar" aria-valuenow={Math.round(fdPct)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to free delivery">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#b88c45] to-champagne transition-[width] duration-700" style={{ width: `${fdPct}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6">
          {priced.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center pb-24 text-center">
              <p className="display-m">Your bag is empty</p>
              <p className="mt-2 text-smoke">Pick a scent you love — or any three for {formatPrice(offers.bundle.price)}.</p>
              <Link href="/shop" onClick={() => setOpen(false)} className="btn btn-gold mt-6">Shop all scents</Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--line-soft)]">
              {priced.map(({ l, s }) => (
                <li key={l.slug} className="flex gap-4 py-4">
                  <Link href={`/perfume/${s.slug}`} onClick={() => setOpen(false)} className="flex h-24 w-16 shrink-0 items-center justify-center rounded-[var(--radius-s)] bg-black/30">
                    <Bottle tint={s.tint} className="h-20 w-auto" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/perfume/${s.slug}`} onClick={() => setOpen(false)} className="font-display text-[1.3rem] leading-tight text-ivory hover:text-champagne">
                        {s.name}
                      </Link>
                      <span className="shrink-0 text-ivory">{formatPrice(s.price * l.qty)}</span>
                    </div>
                    <p className="small mt-0.5 text-smoke">Smells like {inspiredLabel(s)} · 100 ml</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center rounded-full border border-[var(--line)]">
                        <button type="button" className="flex h-9 w-9 items-center justify-center text-lg text-ivory" onClick={() => setQty(l.slug, l.qty - 1)} aria-label={`One less ${s.name}`}>−</button>
                        <span className="w-6 text-center tabular-nums" aria-live="polite">{l.qty}</span>
                        <button type="button" className="flex h-9 w-9 items-center justify-center text-lg text-ivory" onClick={() => setQty(l.slug, l.qty + 1)} aria-label={`One more ${s.name}`}>+</button>
                      </div>
                      <button type="button" className="small text-smoke underline-offset-4 hover:text-ivory hover:underline" onClick={() => setQty(l.slug, 0)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {priced.length > 0 && offers.giftBox.enabled && (
            <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-[var(--radius-m)] border border-[var(--line)] p-4">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[var(--gilt)]"
                checked={giftBoxes > 0}
                onChange={(e) => setGiftBoxes(e.target.checked ? 1 : 0)}
              />
              <span className="flex-1">
                <span className="block text-ivory">Add the {offers.giftBox.name.toLowerCase()}</span>
                <span className="small text-smoke">A presentation box, ready to give.</span>
              </span>
              <span className="text-ivory">{formatPrice(offers.giftBox.price)}</span>
            </label>
          )}

          {priced.length > 0 && suggestions.length > 0 && (
            <div className="mb-6 mt-8">
              <p className="mb-3 text-smoke">Complete your three</p>
              <ul className="no-scrollbar -mx-6 flex gap-3 overflow-x-auto px-6">
                {suggestions.map((s) => (
                  <li key={s.slug} className="w-[150px] shrink-0 rounded-[var(--radius-m)] bg-[var(--ebony-2)] p-3">
                    <div className="flex h-24 items-center justify-center"><Bottle tint={s.tint} className="h-24 w-auto" /></div>
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
              <div className="flex justify-between text-smoke"><dt>Bottles</dt><dd>{formatPrice(totals.subtotal)}</dd></div>
              {totals.bundleSaving > 0 && (
                <div className="flex justify-between text-champagne"><dt>{offers.bundle.label}</dt><dd>−{formatPrice(totals.bundleSaving)}</dd></div>
              )}
              {totals.boxes > 0 && (
                <div className="flex justify-between text-smoke"><dt>{offers.giftBox.name}</dt><dd>{formatPrice(totals.boxes)}</dd></div>
              )}
              <div className="flex justify-between pt-1 text-[1.1rem] text-ivory"><dt>Total</dt><dd>{formatPrice(totals.goods)}</dd></div>
            </dl>
            <p className="small mt-1 text-smoke">Delivery is worked out at checkout.</p>
            <Link href="/checkout" onClick={() => setOpen(false)} className="btn btn-gold mt-4 w-full">
              Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
