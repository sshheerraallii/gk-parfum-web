"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPrice, inspiredLabel, searchScents, scents } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { Bottle } from "./Bottle";

const QUICK = ["Aventus", "Baccarat Rouge", "Sauvage", "Black Orchid", "Lost Cherry", "Delina", "Oud Wood", "Angels' Share"];

/** "Which perfume do you love?" — the plainest possible way into the catalogue. */
export function Matcher() {
  const [q, setQ] = useState("");
  const add = useCart((s) => s.add);
  const results = useMemo(() => searchScents(q).slice(0, 3), [q]);
  const best = results[0];

  return (
    <section id="find" className="wrap scroll-mt-24 py-24 md:py-32" aria-labelledby="find-title">
      <div className="grid gap-12 md:grid-cols-[1fr_1.1fr] md:items-start">
        <div>
          <h2 id="find-title" className="display-l max-w-[14ch]">Which perfume do you love?</h2>
          <p className="lede mt-5">Type its name. We&apos;ll show you the GK scent that smells like it.</p>

          <label htmlFor="matcher" className="sr-only">Perfume you love</label>
          <div className="relative mt-8">
            <input
              id="matcher"
              type="search"
              autoComplete="off"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. Creed Aventus"
              className="h-16 w-full rounded-full border border-[var(--line)] bg-ebony pl-6 pr-6 text-[1.15rem] text-ivory placeholder:text-[#6f675c] focus:border-gilt focus:outline-none"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setQ(t)}
                className={`small h-9 rounded-full border px-4 transition-colors ${q === t ? "border-gilt bg-gilt text-[#1a140c]" : "border-[var(--line)] text-smoke hover:text-ivory"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div aria-live="polite" className="md:min-h-[360px]">
          {best ? (
            <div className="relative overflow-hidden rounded-[var(--radius-m)] border border-[var(--line)] bg-ebony p-6 md:p-8">
              <div aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(60% 70% at 85% 60%, ${best.tint}30, transparent 70%)` }} />
              <div className="relative grid grid-cols-[1fr_auto] items-center gap-6">
                <div>
                  <p className="text-smoke">You&apos;ll love</p>
                  <p className="display-l mt-1 text-ivory">{best.name}</p>
                  <p className="mt-2 text-champagne">Smells like {inspiredLabel(best)}</p>
                  <p className="mt-4 max-w-[36ch] text-smoke">{best.oneLiner} Lasts {best.longevityHours[0]}–{best.longevityHours[1]} hours.</p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => add(best.slug)} className="btn btn-gold">
                      Add to bag · {formatPrice(best.price)}
                    </button>
                    <Link href={`/perfume/${best.slug}`} className="btn btn-ghost">See notes</Link>
                  </div>
                </div>
                <Bottle tint={best.tint} name={best.name} className="h-56 w-auto md:h-64" />
              </div>
              {results.length > 1 && (
                <div className="relative mt-6 border-t border-[var(--line-soft)] pt-4">
                  <p className="small mb-2 text-smoke">Also close</p>
                  <ul className="flex flex-wrap gap-x-6 gap-y-2">
                    {results.slice(1).map((r) => (
                      <li key={r.slug}>
                        <Link href={`/perfume/${r.slug}`} className="text-ivory hover:text-champagne">
                          {r.name} <span className="text-smoke">— {inspiredLabel(r)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : q.trim() ? (
            <div className="rounded-[var(--radius-m)] border border-dashed border-[var(--line)] p-8">
              <p className="display-m">We don&apos;t have that one yet.</p>
              <p className="mt-2 text-smoke">Try a note you like instead — vanilla, oud, rose or citrus — or browse everything.</p>
              <Link href="/shop" className="btn btn-ghost mt-6">Browse all {scents.length} scents</Link>
            </div>
          ) : (
            <>
            <p className="small mb-3 text-smoke">Or tap one of these</p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {scents.filter((s) => s.inspiredBy).slice(0, 6).map((s) => (
                <li key={s.slug}>
                  <button
                    type="button"
                    onClick={() => setQ(`${s.inspiredBy!.brand} ${s.inspiredBy!.name}`)}
                    className="flex h-full min-h-[104px] w-full flex-col items-start justify-end rounded-[var(--radius-m)] border border-[var(--line-soft)] bg-ebony p-4 text-left transition-colors hover:border-[var(--line)]"
                  >
                    <span className="small text-smoke">{s.inspiredBy!.brand}</span>
                    <span className="font-display text-[1.25rem] leading-tight text-ivory">{s.inspiredBy!.name}</span>
                  </button>
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
