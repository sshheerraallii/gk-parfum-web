"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useOffers } from "@/lib/useOffers";

export function BuyBox({ slug, price, name }: { slug: string; price: number; name: string }) {
  const add = useCart((s) => s.add);
  const offers = useOffers();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div className="mt-8 rounded-[var(--radius-m)] border border-[var(--line)] bg-ebony p-5 md:p-6">
      <div className="flex items-end justify-between gap-4">
        <p className="text-[1.8rem] leading-none text-ivory">
          {formatPrice(price)} <span className="text-[1rem] text-smoke">for 100 ml</span>
        </p>
        <p className="small flex items-center gap-2 text-[#9fd3a2]">
          <span className="h-2 w-2 rounded-full bg-[#7fc483]" aria-hidden /> In stock
        </p>
      </div>

      <div className="mt-5 flex gap-3">
        <div className="flex items-center rounded-full border border-[var(--line)]">
          <button type="button" className="flex h-[52px] w-12 items-center justify-center text-xl" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="One less">−</button>
          <span className="w-6 text-center tabular-nums" aria-live="polite" aria-label={`Quantity ${qty}`}>{qty}</span>
          <button type="button" className="flex h-[52px] w-12 items-center justify-center text-xl" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="One more">+</button>
        </div>
        <button
          type="button"
          className="btn btn-gold flex-1"
          onClick={() => {
            add(slug, qty);
            setAdded(true);
            window.setTimeout(() => setAdded(false), 1600);
          }}
        >
          {added ? `${name} added` : "Add to bag"}
        </button>
      </div>

      <ul className="small mt-5 space-y-2 text-smoke">
        {offers.bundle.enabled && (
          <li>
            <span className="text-champagne">{offers.bundle.label}</span> — mix with any other scents.{" "}
            <Link href="/gift-box" className="underline underline-offset-4 hover:text-ivory">Build a box</Link>
          </li>
        )}
        {offers.freeDelivery.enabled && <li>Free Royal Mail Tracked delivery over {formatPrice(offers.freeDelivery.threshold)}.</li>}
        <li>Packed by hand and posted within 1 working day.</li>
      </ul>
    </div>
  );
}
