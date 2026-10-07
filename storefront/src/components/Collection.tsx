"use client";

import { useState } from "react";
import { type Gender, type Mood, scents } from "@/lib/catalog";
import { ScentCard } from "./ScentCard";

const WHO: { id: Gender | "all"; label: string }[] = [
  { id: "all", label: "Everyone" },
  { id: "men", label: "For him" },
  { id: "women", label: "For her" },
  { id: "unisex", label: "Unisex" },
];
const MOODS: { id: Mood | "all"; label: string }[] = [
  { id: "all", label: "Any feel" },
  { id: "fresh", label: "Fresh" },
  { id: "sweet", label: "Sweet" },
  { id: "warm", label: "Warm & spicy" },
  { id: "dark", label: "Dark & woody" },
];

export function Collection({
  initialWho = "all",
  heading = "The collection",
  showFilters = true,
  as: H = "h2",
  intro = "Every bottle is 100\u00a0ml of extrait de parfum. Pick by who it\u2019s for, then by how it feels.",
}: {
  initialWho?: Gender | "all";
  heading?: string;
  showFilters?: boolean;
  as?: "h1" | "h2";
  intro?: string;
}) {
  const [who, setWho] = useState<Gender | "all">(initialWho);
  const [mood, setMood] = useState<Mood | "all">("all");
  const list = scents.filter(
    (s) => (who === "all" || s.gender === who) && (mood === "all" || s.mood === mood)
  );

  return (
    <section className="wrap py-20 md:py-28" aria-labelledby="collection-title">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <H id="collection-title" className={H === "h1" ? "display-xl" : "display-l"}>{heading}</H>
          <p className="lede mt-3">{intro}</p>
        </div>
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
          <div role="group" aria-label="How it feels" className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)]">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={mood === m.id}
                onClick={() => setMood(m.id)}
                className={`small h-9 shrink-0 rounded-full px-4 transition-colors ${mood === m.id ? "bg-[var(--ebony-2)] text-champagne ring-1 ring-gilt" : "text-smoke hover:text-ivory"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="small mt-6 text-smoke" aria-live="polite">{list.length} {list.length === 1 ? "scent" : "scents"}</p>
      {list.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-m)] border border-dashed border-[var(--line)] p-10 text-center">
          <p className="display-m">Nothing in that mix yet.</p>
          <button type="button" className="btn btn-ghost mt-5" onClick={() => { setMood("all"); setWho("all"); }}>Show everything</button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {list.map((s, i) => (
            <ScentCard key={s.slug} s={s} priority={i < 4} />
          ))}
        </div>
      )}
    </section>
  );
}
