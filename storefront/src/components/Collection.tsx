"use client";

import { useMemo, useState } from "react";
import { type Gender, type Scent } from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { ScentCard } from "./ScentCard";
import { SwipeRow } from "./SwipeRow";

const WHO: { id: Gender; label: string }[] = [
  { id: "men", label: "For him" },
  { id: "women", label: "For her" },
  { id: "unisex", label: "Unisex" },
];

/** Spreads b evenly through a, so unisex scents sit among his or hers instead of trailing at the end. */
function blend<T>(a: T[], b: T[]): T[] {
  if (!b.length) return a;
  if (!a.length) return b;
  const out: T[] = [];
  const step = (a.length + b.length) / b.length;
  let ai = 0;
  let bi = 0;
  for (let i = 0; i < a.length + b.length; i++) {
    const wantB = bi < b.length && (ai >= a.length || i + 1 >= Math.round((bi + 1) * step));
    out.push(wantB ? b[bi++] : a[ai++]);
  }
  return out;
}

/** For him / for her include the unisex scents, mixed in — one big collection each. */
function forWho(scents: Scent[], who: Gender) {
  if (who === "unisex") return scents.filter((s) => s.gender === "unisex");
  return blend(
    scents.filter((s) => s.gender === who),
    scents.filter((s) => s.gender === "unisex"),
  );
}

export function Collection({
  initialWho = "men",
  heading = "The collection",
  showFilters = true,
  as: H = "h2",
  intro = "Every bottle is 100 ml of extrait de parfum. Pick by who it’s for, then by the notes you like.",
  slider = false,
}: {
  initialWho?: Gender;
  /** On phones, show the scents as a sideways-swipe row (used on the home page) */
  slider?: boolean;
  heading?: string;
  showFilters?: boolean;
  as?: "h1" | "h2";
  intro?: string;
}) {
  const scents = useCatalog();
  const [who, setWho] = useState<Gender>(initialWho);
  const [tag, setTag] = useState<string | null>(null);

  // the most-used tags become the filter chips
  const tags = useMemo(() => {
    const n = new Map<string, number>();
    scents.forEach((s) => (s.tags ?? []).forEach((t) => n.set(t, (n.get(t) ?? 0) + 1)));
    return [...n.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t);
  }, [scents]);

  const byTag = (l: Scent[]) => (tag ? l.filter((s) => s.tags?.includes(tag)) : l);
  const list = byTag(forWho(scents, who));
  const total = list.length;

  return (
    <section className="wrap py-20 md:py-28" aria-labelledby="collection-title">
      <div data-reveal>
        <H id="collection-title" className={H === "h1" ? "display-xl" : "display-l"}>{heading}</H>
        <p className="lede mt-3">{intro}</p>
      </div>

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
          <button type="button" className="btn btn-ghost mt-5" onClick={() => setTag(null)}>Show all notes</button>
        </div>
      ) : slider ? (
        <SwipeRow label={`${WHO.find((w) => w.id === who)?.label} scents`} className="mt-6 md:hidden">
          {list.map((s, i) => (
            <li key={s.slug} className="w-[68%] shrink-0 snap-start sm:w-[44%]">
              <ScentCard s={s} priority={i < 2} showGender={false} />
            </li>
          ))}
        </SwipeRow>
      ) : null}
      {total > 0 && (
        <div className={`mt-6 grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 ${slider ? "hidden md:grid" : "grid"}`}>
          {list.map((s, i) => (
            <ScentCard key={s.slug} s={s} priority={i < 4} showGender={false} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
