"use client";

import Link from "next/link";
import { useState } from "react";
import { type Scent, formatPrice, genderLabel, inspiredLabel } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { Bottle } from "./Bottle";

export function ScentCard({ s, priority = false }: { s: Scent; priority?: boolean }) {
  const add = useCart((st) => st.add);
  const [added, setAdded] = useState(false);
  void priority;
  return (
    <article className="group relative flex flex-col">
      <Link
        href={`/perfume/${s.slug}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-m)] bg-ebony"
        aria-label={`${s.name}, smells like ${inspiredLabel(s)}`}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `radial-gradient(70% 55% at 50% 62%, ${s.tint}33, transparent 70%)` }}
        />
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <Bottle tint={s.tint} name={s.name} className="h-[86%] w-auto" />
        </div>
        <span className="small absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 text-ivory backdrop-blur">
          {genderLabel[s.gender]}
        </span>
      </Link>
      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="font-display text-[1.55rem] leading-[1.1] text-ivory">
          <Link href={`/perfume/${s.slug}`} className="hover:text-champagne">{s.name}</Link>
        </h3>
        <p className="mt-1 text-[0.95rem] text-champagne">
          {s.inspiredBy ? <>Smells like {inspiredLabel(s)}</> : <>A GK original</>}
        </p>
        <p className="small mt-1 text-smoke">{s.oneLiner}</p>
        <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[1.05rem] text-ivory">
            {formatPrice(s.price)} <span className="small text-smoke">/ 100 ml</span>
          </span>
          <button
            type="button"
            onClick={() => {
              add(s.slug);
              setAdded(true);
              window.setTimeout(() => setAdded(false), 1400);
            }}
            className="h-11 w-full rounded-full border sm:w-auto border-[var(--line)] px-5 text-[0.95rem] text-ivory transition-colors hover:border-gilt hover:bg-gilt hover:text-[#1a140c]"
          >
            {added ? "Added" : "Add to bag"}
          </button>
        </div>
      </div>
    </article>
  );
}
