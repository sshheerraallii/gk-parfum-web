"use client";

import { useState } from "react";
import { COLLECTIONS, collectionsOf, type Gender, type Scent } from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { ScentCard } from "./ScentCard";
import { SwipeRow } from "./SwipeRow";

const WHO: { id: Gender; label: string }[] = [
  { id: "men", label: "For him" },
  { id: "women", label: "For her" },
  { id: "unisex", label: "Unisex" },
];

/** For him / For her: their own scents first, then every unisex scent after them — one big collection each. */
function forWho(scents: Scent[], who: Gender) {
  if (who === "unisex") return scents.filter((s) => s.gender === "unisex");
  return [...scents.filter((s) => s.gender === who), ...scents.filter((s) => s.gender === "unisex")];
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

  // the shop's collections are the filter chips
  const tags: string[] = [...COLLECTIONS];

  const byTag = (l: Scent[]) => (tag ? l.filter((s) => collectionsOf(s).includes(tag)) : l);
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
          <div role="group" aria-label="Collections" className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)]">
            <button
              type="button"
              aria-pressed={tag === null}
              onClick={() => setTag(null)}
              className={`small h-9 shrink-0 rounded-full px-4 transition-colors ${tag === null ? "bg-[var(--ebony-2)] text-champagne ring-1 ring-gilt" : "text-smoke hover:text-ivory"}`}
            >
              All
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
