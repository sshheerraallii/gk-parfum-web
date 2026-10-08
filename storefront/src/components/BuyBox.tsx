"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useOffers } from "@/lib/useOffers";

const off = (p: number, pct: number) => Math.round((p * (100 - pct)) / 100);

/** Product purchase options, Mister Fragrance style: how many bottles, and one-off or every 4 weeks. */
export function BuyBox({ slug, price, name }: { slug: string; price: number; name: string }) {
  const add = useCart((s) => s.add);
  const offers = useOffers();
  const t = offers.tiers;
  const sub = offers.subscription;
  const [packs, setPacks] = useState<1 | 3>(1);
  const [mode, setMode] = useState<"once" | "sub">("once");
  const [added, setAdded] = useState(false);

  const each = packs >= t.discountQty && t.enabled ? off(price, t.discountPct) : mode === "sub" && sub.enabled ? off(price, sub.pct) : price;
  const total = each * packs;

  const Option = ({ on, onClick, title, sub: subtitle, right, badge }: { on: boolean; onClick: () => void; title: string; sub: string; right: React.ReactNode; badge?: string }) => (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[12px] border px-4 py-3 text-left transition-colors ${on ? "border-gilt bg-[#081440]/50" : "border-[var(--line-soft)] hover:border-[var(--line)]"}`}
    >
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-gilt" : "border-smoke/60"}`} aria-hidden>
        {on && <span className="h-2.5 w-2.5 rounded-full bg-gilt" />}
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2 text-ivory">
          {title}
          {badge && <span className="rounded-full bg-[#b4432f] px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-white">{badge}</span>}
        </span>
        <span className="small text-smoke">{subtitle}</span>
      </span>
      <span className="text-right text-ivory">{right}</span>
    </button>
  );

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

      <div className="mt-5 space-y-2" role="radiogroup" aria-label="How many bottles">
        <Option on={packs === 1} onClick={() => setPacks(1)} title="1 × bottle" sub="100 ml extrait de parfum" right={formatPrice(price)} />
        {t.enabled && (
          <Option
            on={packs === 3}
            onClick={() => { setPacks(3); setMode("once"); }}
            title={`3 × bottles`}
            badge={`Save ${t.discountPct}%`}
            sub={`Only ${formatPrice(off(price, t.discountPct))} per bottle · free delivery`}
            right={<><span className="small mr-1.5 text-smoke line-through">{formatPrice(price * 3)}</span>{formatPrice(off(price, t.discountPct) * 3)}</>}
          />
        )}
      </div>

      {sub.enabled && packs === 1 && (
        <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Purchase option">
          {(["once", "sub"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-[12px] border px-4 py-3 text-left transition-colors ${mode === m ? "border-gilt bg-[#081440]/50" : "border-[var(--line-soft)] hover:border-[var(--line)]"}`}
            >
              <span className="block text-ivory">{m === "once" ? "One-off purchase" : `Deliver every ${sub.weeks} weeks`}</span>
              <span className="small text-smoke">
                {m === "once" ? formatPrice(price) : <>{formatPrice(off(price, sub.pct))} <span className="text-champagne">· {sub.pct}% off</span></>}
              </span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className="btn btn-gold mt-5 w-full"
        onClick={() => {
          add(slug, packs, packs === 1 && mode === "sub");
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1600);
        }}
      >
        {added ? `${name} added` : `Add to bag · ${formatPrice(total)}`}
      </button>

      <ul className="small mt-5 space-y-2 text-smoke">
        {t.enabled && (
          <li>
            <span className="text-champagne">Mix and match:</span> any {t.discountQty} bottles save {t.discountPct}%, any {t.freeShipQty} get free delivery too.{" "}
            <Link href="/bundle" className="underline underline-offset-4 hover:text-ivory">Build your bundle</Link>
          </li>
        )}
        {offers.giftBox.enabled && <li>Free signature gift box with every order.</li>}
        {offers.freeDelivery.enabled && <li>Free Royal Mail Tracked delivery over {formatPrice(offers.freeDelivery.threshold)}.</li>}
        {mode === "sub" && packs === 1 && <li>Repeat deliveries can be paused or cancelled any time — just get in touch.</li>}
      </ul>
    </div>
  );
}
