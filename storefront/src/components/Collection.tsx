"use client";

import { useMemo, useState } from "react";
import { type Gender, type Scent } from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { ScentCard } from "./ScentCard";

const WHO: { id: Gender | "all"; label: string }[] = [
  { id: "all", label: "Everyone" },
  { id: "men", label: "For him" },
  { id: "women", label: "For her" },
  { id: "unisex", label: "Unisex" },
];

/** For him / for her show their own scents first, then the unisex ones under their own heading. */
function forWho(scents: Scent[], who: Gender | "all") {
  if (who === "all") return { main: scents, unisex: [] as Scent[] };
  if (who === "unisex") return { main: scents.filter((s) => s.gender === "unisex"), unisex: [] as Scent[] };
  return { main: scents.filter((s) => s.gender === who), unisex: scents.filter((s) => s.gender === "unisex") };
}

export function Collection({
  initialWho = "all",
  heading = "The collection",
  showFilters = true,
  as: H = "h2",
  intro = "Every bottle is 100 ml of extrait de parfum. Pick by who it’s for, then by the notes you like.",
}: {
  initialWho?: Gender | "all";
  heading?: string;
  showFilters?: boolean;
  as?: "h1" | "h2";
  intro?: string;
}) {
  const scents = useCatalog();
  const [who, setWho] = useState<Gender | "all">(initialWho);
  const [tag, setTag] = useState<string | null>(null);

  // the most-used tags become the filter chips
  const tags = useMemo(() => {
    const n = new Map<string, number>();
    scents.forEach((s) => (s.tags ?? []).forEach((t) => n.set(t, (n.get(t) ?? 0) + 1)));
    return [...n.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t);
  }, [scents]);

  const byTag = (l: Scent[]) => (tag ? l.filter((s) => s.tags?.includes(tag)) : l);
  const { main, unisex } = forWho(scents, who);
  const list = byTag(main);
  const extra = byTag(unisex);
  const total = list.length + extra.length;

  return (
    <section className="wrap py-20 md:py-28" aria-labelledby="collection-title">
      <H id="collection-title" className={H === "h1" ? "display-xl" : "display-l"}>{heading}</H>
      <p className="lede mt-3">{intro}</p>

      {showFilters && (
        <div className="mt-10 flex flex-col gap-3">
          <div role="group" aria-label="Who is it for" className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)]">
            {WHO.map((w) => (
              <button
                key={w.id}
                type="button"
                aria-pressed={who === w.id}
                onClick={() => setWho(w.id)}
                className={`h-11 shrink-0 rounded-full px-5 transition-colors ${who === w.id ? "bg-ivory text-velvet" : "border border-[var(--line)] text-ivory hover:border-gilt"}`}
              >
                {w.label}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Filter by tag" className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)]">
            <button
              type="button"
              aria-pressed={tag === null}
              onClick={() => setTag(null)}
              className={`small h-9 shrink-0 rounded-full px-4 transition-colors ${tag === null ? "bg-[var(--ebony-2)] text-champagne ring-1 ring-gilt" : "text-smoke hover:text-ivory"}`}
            >
              Any notes
            </button>
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tag === t}
                onClick={() => setTag(tag === t ? null : t)}
                className={`small h-9 shrink-0 rounded-full px-4 transition-colors ${tag === t ? "bg-[var(--ebony-2)] text-champagne ring-1 ring-gilt" : "text-smoke hover:text-ivory"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="small mt-6 text-smoke" aria-live="polite">{total} {total === 1 ? "scent" : "scents"}</p>
      {total === 0 ? (
        <div className="mt-6 rounded-[var(--radius-m)] border border-dashed border-[var(--line)] p-10 text-center">
          <p className="display-m">Nothing in that mix yet.</p>
          <button type="button" className="btn btn-ghost mt-5" onClick={() => { setTag(null); setWho("all"); }}>Show everything</button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {list.map((s, i) => (
              <ScentCard key={s.slug} s={s} priority={i < 4} />
            ))}
          </div>
          {extra.length > 0 && (
            <div className="mt-20">
              <h3 className="display-m">Unisex — for anyone</h3>
              <p className="small mt-2 text-smoke">Scents that work just as well {who === "women" ? "for her" : "for him"}.</p>
              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
                {extra.map((s) => (
                  <ScentCard key={s.slug} s={s} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
