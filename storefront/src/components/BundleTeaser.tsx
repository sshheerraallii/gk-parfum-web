"use client";

import Link from "next/link";
import { useOffers } from "@/lib/useOffers";

/** Homepage room explaining the bundle tiers, in the ivory "atelier" palette. */
export function BundleTeaser() {
  const offers = useOffers();
  const t = offers.tiers;
  if (!t.enabled) return null;
  const tiers = [
    { n: "1", label: "bottle", d: "Full price" },
    { n: String(t.discountQty), label: "bottles", d: `Save ${t.discountPct}% on every bottle` },
    { n: String(t.freeShipQty), label: "bottles", d: `Save ${t.discountPct}% + free UK delivery` },
  ];
  return (
    <section className="bg-paper text-ink" style={{ colorScheme: "light" }} aria-labelledby="bundle-teaser">
      <div className="wrap grid items-center gap-12 py-20 md:grid-cols-[1.1fr_.9fr] md:py-28">
        <div>
          <h2 id="bundle-teaser" className="display-l max-w-[13ch]">Build your bundle, save as you go</h2>
          <p className="mt-5 max-w-[40ch] text-[1.08rem] leading-relaxed text-ink-soft">
            Mix any scents — his, hers or unisex. Every order comes with our signature gift box, free.
          </p>
          <ol className="mt-10 space-y-3">
            {tiers.map((x, i) => (
              <li key={i} className="flex items-center gap-5 rounded-[14px] border border-[var(--paper-line)] bg-white px-5 py-4">
                <span className="font-display text-[2.6rem] leading-none text-[#7a5a1c]">{x.n}</span>
                <span>
                  <span className="block text-ink">{x.label}</span>
                  <span className="text-[0.95rem] text-ink-soft">{x.d}</span>
                </span>
              </li>
            ))}
          </ol>
          <Link href="/bundle" className="btn btn-ink mt-8">Build your bundle</Link>
        </div>
        <img
          src="/brand/mockup-box-800.webp"
          alt="A GK Parfum bottle resting in the blue signature gift box"
          width={800}
          height={994}
          loading="lazy"
          decoding="async"
          className="w-full max-w-[460px] justify-self-center rounded-[18px] shadow-[0_40px_80px_-40px_rgba(13,28,71,.6)]"
        />
      </div>
    </section>
  );
}
