"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Scent, formatPrice, genderLabel, inspiredLabel } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useAccount } from "@/lib/account";
import { ProductVisual } from "./ProductVisual";

export function WishButton({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  const account = useAccount((s) => s.account);
  const toggle = useAccount((s) => s.toggleWish);
  const router = useRouter();
  const on = !!account?.wishlist.includes(slug);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from your wishlist` : `Save ${name} to your wishlist`}
      onClick={(e) => {
        e.preventDefault();
        if (!account) router.push(`/account?next=${encodeURIComponent(location.pathname)}`);
        else toggle(slug);
      }}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-[#081440]/60 backdrop-blur transition-colors hover:text-champagne ${on ? "text-champagne" : "text-ivory"} ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function ScentCard({ s, priority = false }: { s: Scent; priority?: boolean }) {
  const add = useCart((st) => st.add);
  const [added, setAdded] = useState(false);
  return (
    <article className="group relative flex flex-col">
      <Link
        href={`/perfume/${s.slug}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-m)] bg-ebony"
        aria-label={`${s.name}, inspired by ${inspiredLabel(s)}`}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `radial-gradient(70% 55% at 50% 62%, ${s.tint}33, transparent 70%)` }}
        />
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <ProductVisual s={s} priority={priority} className="h-[86%] w-auto max-w-full" />
        </div>
        <span className="small absolute left-3 top-3 rounded-full bg-[#081440]/60 px-3 py-1 text-ivory backdrop-blur">
          {genderLabel[s.gender]}
        </span>
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
            className="h-11 w-full rounded-full border border-[var(--line)] px-5 text-[0.95rem] text-ivory transition-colors hover:border-gilt hover:bg-gilt hover:text-[#0a1a48] sm:w-auto"
          >
            {added ? "Added" : "Add to bag"}
          </button>
        </div>
      </div>
    </article>
  );
}
