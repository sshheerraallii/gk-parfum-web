"use client";

import Link from "next/link";
import { formatPrice, inspiredLabel, type Scent } from "@/lib/catalog";
import { ProductScene } from "./ProductScene";

/**
 * The best sellers announced like an awards night: spotlights sweep the stage, then third, second and
 * first place rise on their steps one after another, and gold confetti falls on the winner.
 * Order on stage is 2 · 1 · 3 (winner in the middle, on the tallest step).
 */
const PLACES = [
  { rank: 2, label: "2nd", step: "h-14 sm:h-20", delay: 0.8, medal: "gk-medal-silver" },
  { rank: 1, label: "1st", step: "h-20 sm:h-28", delay: 1.4, medal: "gk-medal-gold" },
  { rank: 3, label: "3rd", step: "h-10 sm:h-14", delay: 0.2, medal: "gk-medal-bronze" },
] as const;

const CONFETTI = Array.from({ length: 22 }, (_, i) => ({
  x: ((i * 37) % 100) - 50, // spread, %
  r: (i * 53) % 360,
  d: (i % 7) * 0.09,
  t: 1.6 + (i % 5) * 0.25,
  c: ["#e8c77a", "#c9a15b", "#f3ecdf", "#b07a3a"][i % 4],
  w: 4 + (i % 3) * 2,
}));

export function Podium({ winners }: { winners: Scent[] }) {
  const byRank = (r: number) => winners[r - 1];
  return (
    <div data-inview className="gk-podium relative isolate overflow-hidden rounded-[var(--radius-m)] border border-[var(--line-soft)] bg-[radial-gradient(120%_80%_at_50%_0%,#2a2219,#14110e_70%)] px-2 pt-10 sm:px-5">
      {/* spotlights */}
      <span aria-hidden className="gk-spot gk-spot-l" />
      <span aria-hidden className="gk-spot gk-spot-c" />
      <span aria-hidden className="gk-spot gk-spot-r" />

      <ol className="relative grid grid-cols-3 items-end gap-2 sm:gap-4" aria-label="Best sellers, ranked">
        {PLACES.map((p) => {
          const s = byRank(p.rank);
          if (!s) return <li key={p.rank} />;
          return (
            <li
              key={p.rank}
              value={p.rank}
              className={`gk-pod-col relative flex flex-col items-center ${p.rank === 1 ? "gk-pod-first" : ""}`}
              style={{ ["--d" as string]: `${p.delay}s` }}
            >
              {p.rank === 1 && (
                <span aria-hidden className="gk-confetti pointer-events-none absolute inset-x-0 -top-8 h-0">
                  {CONFETTI.map((c, i) => (
                    <i
                      key={i}
                      style={{
                        left: `${50 + c.x}%`,
                        background: c.c,
                        width: c.w,
                        height: c.w * 1.8,
                        ["--cr" as string]: `${c.r}deg`,
                        ["--cd" as string]: `${c.d}s`,
                        ["--ct" as string]: `${c.t}s`,
                      }}
                    />
                  ))}
                </span>
              )}

              <Link href={`/perfume/${s.slug}`} className="gk-pod-card gk-uncap group relative w-full text-center">
                {p.rank === 1 && (
                  <svg aria-hidden viewBox="0 0 64 28" className="gk-crown mx-auto mb-1 h-5 w-11 sm:h-7 sm:w-14">
                    <path d="M4 26 L8 6 L22 16 L32 2 L42 16 L56 6 L60 26 Z" fill="url(#gkcrown)" stroke="#f3dca0" strokeWidth="1" />
                    <defs>
                      <linearGradient id="gkcrown" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0" stopColor="#f6e2a8" />
                        <stop offset="1" stopColor="#b8863c" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}
                <div className="relative">
                  <ProductScene s={s} className={`aspect-[4/5] w-full overflow-hidden rounded-[10px] ${p.rank === 1 ? "ring-1 ring-gilt/70" : ""}`} />
                  <span className={`gk-medal ${p.medal}`} aria-hidden>
                    {p.rank}
                  </span>
                </div>
                <span className={`mt-6 block font-display leading-tight text-ivory ${p.rank === 1 ? "text-[1.05rem] sm:text-[1.35rem]" : "text-[0.95rem] sm:text-[1.15rem]"}`}>{s.name}</span>
                <span className="block text-[0.72rem] leading-snug text-smoke sm:text-[0.82rem]">
                  {s.inspiredBy ? <>Inspired by {inspiredLabel(s)}</> : "A GK original"}
                </span>
                <span className="mt-1 block text-[0.8rem] text-champagne">{formatPrice(s.price)}</span>
              </Link>

              {/* the step */}
              <div className={`gk-pod-step relative mt-3 w-full ${p.step}`}>
                <span className="absolute inset-x-2 top-1.5 text-center font-display text-[1.5rem] leading-none text-[#14110e]/70 sm:text-[2rem]">{p.label}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="sr-only">
        {winners
          .slice(0, 3)
          .map((s, i) => `${i + 1}: ${s.name}`)
          .join(", ")}
      </p>
    </div>
  );
}
