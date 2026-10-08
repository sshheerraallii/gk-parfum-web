"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatPrice, inspiredLabel, searchScents } from "@/lib/catalog";
import { useBestSellers, useCatalog } from "./CatalogProvider";
import { ProductVisual } from "./ProductVisual";
import { useCart } from "@/lib/cart";
import { logSearch } from "@/lib/store-client";

const QUICK = ["Woody", "Oud", "Fresh & citrus", "Sweet & vanilla", "Floral", "Spicy", "Fruity", "Smoky", "Date night", "Office"];

/** "Which perfume do you love?" — describe what you like in your own words; we match on notes. */
export function Matcher() {
  const [q, setQ] = useState("");
  const add = useCart((s) => s.add);
  const scents = useCatalog();
  const best = useBestSellers();
  const results = useMemo(() => searchScents(q, scents), [q, scents]);
  const top = results.slice(0, 3);
  const logged = useRef("");

  // record what people ask for (the owner sees it in Admin → Searches)
  useEffect(() => {
    const v = q.trim();
    if (v.length < 3 || v === logged.current) return;
    const t = setTimeout(() => {
      logged.current = v;
      logSearch(v, results.length, "matcher");
    }, 1500);
    return () => clearTimeout(t);
  }, [q, results.length]);

  return (
    <section id="find" className="wrap scroll-mt-24 py-24 md:py-32" aria-labelledby="find-title">
      <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
        <div>
          <h2 id="find-title" className="display-l max-w-[14ch]">Which perfume do you love?</h2>
          <p className="lede mt-5">Tell us what you like — woody, oud, something sweet for date night — and we&apos;ll find your scents.</p>

          <label htmlFor="matcher" className="sr-only">Describe the scents you like</label>
          <input
            id="matcher"
            type="search"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. I like woody scents and oud"
            className="mt-8 h-16 w-full rounded-full border border-[var(--line)] bg-ebony px-6 text-[1.1rem] text-ivory placeholder:text-[#8d98bb] focus:border-gilt focus:outline-none"
          />
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Quick picks">
            {QUICK.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={q === t}
                onClick={() => setQ(q === t ? "" : t)}
                className={`small h-9 rounded-full border px-4 transition-colors ${q === t ? "border-gilt bg-gilt text-[#0a1a48]" : "border-[var(--line)] text-smoke hover:text-ivory"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div aria-live="polite">
          {top.length ? (
            <>
              <p className="small mb-3 text-smoke">
                {results.length === 1 ? "Your match" : `Your top ${top.length} of ${results.length} matches`}
              </p>
              <ul className="space-y-3">
                {top.map((s, i) => (
                  <li key={s.slug} className="relative overflow-hidden rounded-[var(--radius-m)] border border-[var(--line)] bg-ebony">
                    <div aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(60% 90% at 90% 50%, ${s.tint}2e, transparent 70%)` }} />
                    <div className="relative grid grid-cols-[auto_1fr] items-center gap-4 p-4 sm:gap-6 sm:p-5">
                      <Link href={`/perfume/${s.slug}`} className="flex h-28 w-20 items-center justify-center" aria-label={s.name}>
                        <ProductVisual s={s} className="h-28 w-auto max-w-[80px]" />
                      </Link>
                      <div className="min-w-0">
                        {i === 0 && <p className="small text-champagne">Best match</p>}
                        <Link href={`/perfume/${s.slug}`} className="font-display text-[1.6rem] leading-tight text-ivory hover:text-champagne">{s.name}</Link>
                        <p className="small mt-0.5 text-smoke">Inspired by {inspiredLabel(s)}</p>
                        <p className="small mt-1 truncate text-smoke">{[...new Set([...s.notes.top.slice(0, 2), ...s.notes.heart.slice(0, 2), ...s.notes.base.slice(0, 2)])].slice(0, 4).join(" · ")}</p>
                        <button type="button" onClick={() => add(s.slug)} className="small mt-3 h-9 rounded-full border border-[var(--line)] px-4 text-ivory hover:border-gilt hover:bg-gilt hover:text-[#0a1a48]">
                          Add to bag · {formatPrice(s.price)}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {results.length > 3 && (
                <Link href={`/search?q=${encodeURIComponent(q)}`} className="mt-4 inline-block text-champagne underline-offset-4 hover:underline">
                  See all {results.length} matches
                </Link>
              )}
            </>
          ) : q.trim() ? (
            <div className="rounded-[var(--radius-m)] border border-dashed border-[var(--line)] p-8">
              <p className="display-m">Nothing matches that yet.</p>
              <p className="mt-2 text-smoke">Try a note — vanilla, oud, rose, citrus — or a mood like &ldquo;fresh for the office&rdquo;. We&apos;ve noted what you searched for.</p>
              <Link href="/shop" className="btn btn-ghost mt-6">Browse all {scents.length} scents</Link>
            </div>
          ) : (
            <>
              <p className="small mb-3 text-smoke">Or start with our best sellers</p>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {best.slice(0, 6).map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/perfume/${s.slug}`}
                      className="flex h-full flex-col items-center rounded-[var(--radius-m)] border border-[var(--line-soft)] bg-ebony p-4 text-center transition-colors hover:border-[var(--line)]"
                    >
                      <ProductVisual s={s} className="h-24 w-auto max-w-[70px]" />
                      <span className="mt-2 font-display text-[1.2rem] leading-tight text-ivory">{s.name}</span>
                      <span className="small mt-0.5 text-smoke">{s.inspiredBy ? s.inspiredBy.name : "GK original"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
