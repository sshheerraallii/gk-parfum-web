"use client";

import Link from "next/link";
import { useState } from "react";
import { type Scent, genderLabel, inspiredLabel } from "@/lib/catalog";
import { Price } from "./Price";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { ProductScene } from "./ProductScene";
import { tiltHandlers, useUncapOnView } from "@/lib/useUncap";

export function WishButton({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  const { has, toggle } = useWishlist();
  const [pop, setPop] = useState(0);
  const on = has(slug);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from your wishlist` : `Save ${name} to your wishlist`}
      onClick={(e) => {
        e.preventDefault();
        toggle(slug).then((now) => now && setPop((n) => n + 1));
      }}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-[#0f0c0a]/60 backdrop-blur transition-colors hover:text-champagne ${on ? "text-champagne" : "text-ivory"} ${className}`}
    >
      <HeartIcon on={on} key={pop} className={pop ? "gk-heart-pop" : ""} />
    </button>
  );
}

export function HeartIcon({ on = false, size = 18, className = "" }: { on?: boolean; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" strokeLinejoin="round" />
    </svg>
  );
}

export function ScentCard({ s, priority = false, showGender = true, index }: { s: Scent; priority?: boolean; showGender?: boolean; index?: number }) {
  const add = useCart((st) => st.add);
  const [added, setAdded] = useState(false);
  const ref = useUncapOnView<HTMLElement>();
  return (
    <article
      ref={ref}
      data-fly
      {...(index !== undefined ? { "data-reveal": "", style: { ["--rd" as string]: `${(index % 4) * 0.08}s` } } : {})}
      className="gk-uncap group relative flex flex-col"
    >
      <Link
        href={`/perfume/${s.slug}`}
        {...tiltHandlers}
        className="gk-tilt relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-m)] bg-ebony"
        aria-label={`${s.name}, inspired by ${inspiredLabel(s)}`}
      >
        <ProductScene s={s} priority={priority} className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.03]" />
        {showGender && (
          <span className="small absolute left-3 top-3 rounded-full bg-[#0f0c0a]/60 px-3 py-1 text-ivory backdrop-blur">
            {genderLabel[s.gender]}
          </span>
        )}
      </Link>
      <WishButton slug={s.slug} name={s.name} className="absolute right-3 top-3" />
      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="font-display text-[1.55rem] leading-[1.1] text-ivory">
          <Link href={`/perfume/${s.slug}`} className="hover:text-champagne">{s.name}</Link>
        </h3>
        <p className="mt-1 text-[0.95rem] text-champagne">
          {s.inspiredBy ? <>Inspired by {inspiredLabel(s)}</> : <>A GK original</>}
        </p>
        {s.tags?.length ? (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Tags">
            {s.tags.slice(0, 3).map((t) => (
              <li key={t} className="rounded-full border border-[var(--line-soft)] px-2 py-0.5 text-[0.72rem] text-smoke">{t}</li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto flex flex-col gap-3 pt-4">
          <Price s={s} />
          <button
            type="button"
            onClick={() => {
              add(s.slug);
              setAdded(true);
              window.setTimeout(() => setAdded(false), 1400);
            }}
            className="h-11 w-full rounded-full border border-[var(--line)] px-5 text-[0.95rem] text-ivory transition-colors hover:border-gilt hover:bg-gilt hover:text-[#14110e]"
          >
            {added ? "Added" : "Add to bag"}
          </button>
        </div>
      </div>
    </article>
  );
}
