"use client";

import { formatPrice, type Scent } from "@/lib/catalog";
import { useOffersCtx } from "./CatalogProvider";

/**
 * Price with the honest extras: during a sale set in the admin, the normal price struck through
 * and the % off; otherwise what each bottle costs in a bundle.
 */
export function Price({ s, tone = "dark", className = "" }: { s: Scent; tone?: "dark" | "light"; className?: string }) {
  const offers = useOffersCtx();
  const pct = offers.tiers.discountPct;
  const sale = s.compareAt && s.compareAt > s.price ? Math.round((1 - s.price / s.compareAt) * 100) : 0;
  const muted = tone === "dark" ? "text-smoke" : "text-ink-soft";
  const strong = tone === "dark" ? "text-ivory" : "text-ink";
  return (
    <div className={className}>
      <p className="flex flex-wrap items-baseline gap-x-2">
        {sale > 0 && (
          <s className={`text-[0.95rem] ${muted}`}>
            <span className="sr-only">Was </span>
            {formatPrice(s.compareAt!)}
          </s>
        )}
        <span className={`text-[1.1rem] ${strong}`}>
          {sale > 0 && <span className="sr-only">Now </span>}
          {formatPrice(s.price)}
        </span>
        {sale > 0 ? (
          <span className="rounded-full bg-gilt px-2 py-0.5 text-[0.72rem] font-medium text-[#14110e]">−{sale}%</span>
        ) : (
          <span className={`small ${muted}`}>/ 100 ml</span>
        )}
      </p>
      {offers.tiers.enabled && pct > 0 && (
        <p className={`mt-0.5 text-[0.8rem] ${tone === "dark" ? "text-champagne" : "text-[#8a6a2c]"}`}>
          {formatPrice(Math.round(s.price * (1 - pct / 100)))} each in a bundle of {offers.tiers.discountQty}+
        </p>
      )}
    </div>
  );
}
