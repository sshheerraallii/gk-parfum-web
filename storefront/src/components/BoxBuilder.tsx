"use client";

import { useState } from "react";
import { formatPrice, inspiredLabel } from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { useCart } from "@/lib/cart";
import { useOffers } from "@/lib/useOffers";
import { ProductVisual } from "./ProductVisual";

/** The ivory room: pick three, watch the box fill, add it in one go. */
export function BoxBuilder({ id = "box" }: { id?: string }) {
  const offers = useOffers();
  const scents = useCatalog();
  const { addMany, setGiftBoxes, giftBoxes } = useCart();
  const N = offers.bundle.qty;
  const [picked, setPicked] = useState<string[]>([]);
  const [withBox, setWithBox] = useState(true);

  const toggle = (slug: string) =>
    setPicked((p) => {
      const i = p.indexOf(slug);
      if (i >= 0) return p.filter((_, k) => k !== i);
      if (p.length >= N) return [...p.slice(1), slug];
      return [...p, slug];
    });

  const full = picked.length === N;
  const usual = picked.reduce((a, s) => a + (scents.find((x) => x.slug === s)?.price ?? 0), 0);

  if (!offers.bundle.enabled) return null;

  return (
    <section id={id} className="scroll-mt-20 bg-paper text-ink" aria-labelledby={`${id}-title`}>
      <div className="wrap grid gap-12 py-20 md:grid-cols-[.9fr_1.1fr] md:py-28">
        <div className="md:sticky md:top-24 md:self-start">
          <h2 id={`${id}-title`} className="display-l max-w-[12ch]">Pick any three for {formatPrice(offers.bundle.price)}</h2>
          <p className="mt-5 max-w-[34ch] text-[1.08rem] leading-relaxed text-ink-soft">
            Mix his, hers and unisex. Tap three scents and they go straight into the box.
          </p>

          {/* the box */}
          <div className="mt-10 rounded-[var(--radius-m)] bg-ink p-5 text-ivory shadow-[0_30px_60px_-30px_rgba(29,24,19,.6)]">
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: N }).map((_, i) => {
                const s = scents.find((x) => x.slug === picked[i]);
                return (
                  <div key={i} className="flex aspect-[3/4] flex-col items-center justify-center rounded-[var(--radius-s)] border border-[var(--line)] bg-black/30 p-2 text-center">
                    {s ? (
                      <>
                        <ProductVisual s={s} className="h-[70%] w-auto max-w-full" />
                        <span className="mt-1 line-clamp-2 font-display text-[0.95rem] leading-tight">{s.name}</span>
                      </>
                    ) : (
                      <span className="small text-smoke">Scent {i + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
            {offers.giftBox.enabled && (
              <label className="mt-4 flex cursor-pointer items-center gap-3 text-[0.95rem]">
                <input type="checkbox" className="h-5 w-5 accent-[var(--gilt)]" checked={withBox} onChange={(e) => setWithBox(e.target.checked)} />
                <span className="flex-1">Pack it in the {offers.giftBox.name.toLowerCase()}</span>
                <span className="text-smoke">+{formatPrice(offers.giftBox.price)}</span>
              </label>
            )}
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-[var(--line-soft)] pt-4">
              <div>
                <p className="text-[1.25rem]">
                  {formatPrice(offers.bundle.price + (withBox && offers.giftBox.enabled ? offers.giftBox.price : 0))}
                </p>
                {full && usual > offers.bundle.price && (
                  <p className="small text-champagne">You save {formatPrice(usual - offers.bundle.price)}</p>
                )}
              </div>
              <button
                type="button"
                disabled={!full}
                className="btn btn-gold"
                onClick={() => {
                  addMany(picked);
                  if (withBox && offers.giftBox.enabled) setGiftBoxes(giftBoxes + 1);
                  setPicked([]);
                }}
              >
                {full ? "Add box to bag" : `Pick ${N - picked.length} more`}
              </button>
            </div>
          </div>
        </div>

        <div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {scents.map((s) => {
            const on = picked.includes(s.slug);
            return (
              <li key={s.slug}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.slug)}
                  className={`relative flex h-full w-full flex-col items-start rounded-[var(--radius-m)] border p-4 text-left transition-[border-color,background-color] ${on ? "border-ink bg-white" : "border-[var(--paper-line)] hover:border-ink/40"}`}
                >
                  <span className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border text-[0.8rem] ${on ? "border-ink bg-ink text-paper" : "border-ink/30"}`} aria-hidden>
                    {on ? "✓" : ""}
                  </span>
                  <span className="mb-3 block h-3 w-3 rounded-full" style={{ background: s.tint }} aria-hidden />
                  <span className="font-display text-[1.3rem] leading-tight">{s.name}</span>
                  <span className="small mt-1 text-ink-soft">{inspiredLabel(s)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {/* mobile: keep the box state in reach while scrolling the list */}
        <div className="sticky bottom-3 z-10 mt-4 md:hidden">
          <div className="flex items-center justify-between gap-3 rounded-full bg-ink py-2 pl-5 pr-2 text-ivory shadow-[0_16px_40px_-12px_rgba(29,24,19,.7)]">
            <span className="text-[0.95rem]">{picked.length} of {N} picked</span>
            <button
              type="button"
              disabled={!full}
              className="btn btn-gold min-h-[44px] px-5"
              onClick={() => {
                addMany(picked);
                if (withBox && offers.giftBox.enabled) setGiftBoxes(giftBoxes + 1);
                setPicked([]);
              }}
            >
              {full ? "Add box to bag" : `Pick ${N - picked.length} more`}
            </button>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
