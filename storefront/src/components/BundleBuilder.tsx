"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatPrice, inspiredLabel, searchScents, type Scent } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useOffers } from "@/lib/useOffers";
import { nextReward, priceCart } from "@/lib/offers";
import { useBestSellers, useCatalog } from "./CatalogProvider";
import { ProductVisual } from "./ProductVisual";
import { TierProgress } from "./TierProgress";

type Tab = "best" | "men" | "women" | "unisex" | "all";
const TABS: { id: Tab; label: string }[] = [
  { id: "best", label: "Best sellers" },
  { id: "men", label: "For him" },
  { id: "women", label: "For her" },
  { id: "unisex", label: "Unisex" },
  { id: "all", label: "All scents" },
];

const off = (pence: number, pct: number) => Math.round((pence * (100 - pct)) / 100);

/** Pick scents, watch the savings unlock, add the lot to the bag. */
export function BundleBuilder() {
  const scents = useCatalog();
  const best = useBestSellers();
  const offers = useOffers();
  const t = offers.tiers;
  const addMany = useCart((s) => s.addMany);
  const bag = useCart((s) => s.lines);
  const [tab, setTab] = useState<Tab>("best");
  const [tag, setTag] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [sheet, setSheet] = useState(false);

  const tags = useMemo(() => {
    const n = new Map<string, number>();
    scents.forEach((s) => (s.tags ?? []).forEach((x) => n.set(x, (n.get(x) ?? 0) + 1)));
    return [...n.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([x]) => x);
  }, [scents]);

  const list = useMemo(() => {
    let l: Scent[] = tab === "best" ? best : tab === "all" ? scents : scents.filter((s) => s.gender === tab);
    if (tab === "women" || tab === "men") l = [...l, ...scents.filter((s) => s.gender === "unisex")];
    if (tag) l = l.filter((s) => s.tags?.includes(tag));
    if (q.trim()) {
      const hits = new Set(searchScents(q, scents).map((s) => s.slug));
      l = l.filter((s) => hits.has(s.slug));
    }
    return l;
  }, [tab, tag, q, scents, best]);

  const chosen = Object.entries(picked)
    .filter(([, n]) => n > 0)
    .map(([slug, n]) => ({ s: scents.find((x) => x.slug === slug)!, n }))
    .filter((x) => x.s);
  const count = chosen.reduce((a, c) => a + c.n, 0);
  const totals = priceCart(chosen.map(({ s, n }) => ({ slug: s.slug, qty: n, unit: s.price })), offers);
  const reward = nextReward(count, offers);
  const bagCount = bag.reduce((a, l) => a + l.qty, 0);

  const set = (slug: string, n: number) => setPicked((p) => ({ ...p, [slug]: Math.max(0, Math.min(10, n)) }));

  // Mister Fragrance-style: picking a scent takes you straight back up to the bundle, so you see it land
  const top = useRef<HTMLDivElement>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const pick = (slug: string, n: number) => {
    set(slug, n);
    setFlash(slug);
    const el = top.current;
    const wide = window.matchMedia("(min-width: 1024px)").matches; // the summary is always on screen there
    if (el && !wide && el.getBoundingClientRect().top < 0) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 84, behavior: reduce ? "auto" : "smooth" });
    }
  };
  // reaching 2 or 3 bottles: a burst of gold and a note of what just unlocked
  const prevCount = useRef(count);
  const [unlock, setUnlock] = useState<{ id: number; text: string } | null>(null);
  useEffect(() => {
    const was = prevCount.current;
    prevCount.current = count;
    if (!t.enabled || count <= was) return;
    const text =
      was < t.freeShipQty && count >= t.freeShipQty
        ? "Free delivery unlocked"
        : was < t.discountQty && count >= t.discountQty
          ? `${t.discountPct}% off unlocked`
          : null;
    if (text) setUnlock({ id: Date.now(), text });
  }, [count, t]);
  useEffect(() => {
    if (!unlock) return;
    const x = setTimeout(() => setUnlock(null), 2500);
    return () => clearTimeout(x);
  }, [unlock]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 900);
    return () => clearTimeout(t);
  }, [flash]);

  // one slot per bottle, in the order picked; always at least the three that unlock the savings
  const units = chosen.flatMap(({ s, n }) => Array.from({ length: n }, () => s));
  const slotCount = Math.min(10, Math.max(t.freeShipQty, units.length + (units.length >= t.freeShipQty ? 1 : 0)));
  const slotHint = (i: number) =>
    i + 1 === t.discountQty && t.enabled ? `Save ${t.discountPct}%` : i + 1 === t.freeShipQty && t.enabled ? "Free delivery" : i === 0 ? "Pick a scent" : "Add more";

  const addToBag = () => {
    addMany(chosen.flatMap(({ s, n }) => Array.from({ length: n }, () => s.slug)));
    setPicked({});
    setSheet(false);
  };

  const summary = (
    <div>
      <h2 className="display-m text-ink">Your bundle</h2>
      <p className="mt-1 text-[0.95rem] text-ink-soft" aria-live="polite">
        {count === 0 ? "Pick your scents — savings unlock as you go." : reward ?? "Bundle complete: you've unlocked every saving."}
      </p>
      <div className="mt-5">
        <TierProgress count={count} offers={offers} tone="light" />
      </div>

      {chosen.length > 0 && (
        <ul className="mt-6 divide-y divide-[var(--paper-line)]">
          {chosen.map(({ s, n }) => (
            <li key={s.slug} className="flex items-center gap-3 py-3">
              <div className="flex h-14 w-11 shrink-0 items-center justify-center rounded-[8px] bg-ink">
                <ProductVisual s={s} className="h-12 w-auto max-w-[40px]" />
              </div>
              <p className="min-w-0 flex-1 truncate text-ink">{s.name}</p>
              <div className="flex items-center rounded-full border border-[var(--paper-line)]">
                <button type="button" className="flex h-8 w-8 items-center justify-center text-ink" onClick={() => set(s.slug, n - 1)} aria-label={`One less ${s.name}`}>−</button>
                <span className="w-5 text-center tabular-nums text-ink">{n}</span>
                <button type="button" className="flex h-8 w-8 items-center justify-center text-ink" onClick={() => set(s.slug, n + 1)} aria-label={`One more ${s.name}`}>+</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex items-center gap-3 rounded-[12px] border border-[var(--paper-line)] bg-white p-3">
        <img src="/brand/gk-crest-112.webp" alt="" aria-hidden className="h-10 w-auto" />
        <p className="flex-1 text-[0.92rem] text-ink">Free signature gift box with every order</p>
        <span className="text-[0.92rem] text-[#7a5a1c]">Free</span>
      </div>

      <dl className="mt-5 space-y-1.5 border-t border-[var(--paper-line)] pt-4 text-[0.98rem]">
        <div className="flex justify-between text-ink-soft"><dt>Normal price</dt><dd>{formatPrice(totals.subtotal)}</dd></div>
        <div className="flex justify-between text-[#7a5a1c]"><dt>Discounts</dt><dd>{totals.saving ? `−${formatPrice(totals.saving)}` : "—"}</dd></div>
        <div className="flex justify-between text-ink-soft"><dt>Delivery</dt><dd>{count === 0 ? "—" : totals.freeDelivery ? "Free" : `From ${formatPrice(offers.shipping[0]?.price ?? 0)}`}</dd></div>
        <div className="flex items-baseline justify-between pt-1 text-ink">
          <dt className="text-[1.1rem]">Bundle price</dt>
          <dd className="font-display text-[2rem] leading-none">{formatPrice(totals.goods)}</dd>
        </div>
      </dl>
      <button type="button" disabled={count === 0} onClick={addToBag} className="btn btn-ink mt-5 w-full">
        {count === 0 ? "Pick a scent to start" : `Add ${count} ${count === 1 ? "bottle" : "bottles"} to bag`}
      </button>
      {bagCount > 0 && (
        <p className="mt-3 text-center text-[0.85rem] text-ink-soft">
          You already have {bagCount} in your bag — savings count everything together.
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-paper text-ink" style={{ colorScheme: "light" }}>
      <section className="wrap pb-6 pt-12 md:pt-16" aria-labelledby="bundle-title">
        <h1 id="bundle-title" className="display-xl">Build your bundle</h1>
        <p className="mt-4 max-w-[46ch] text-[1.1rem] text-ink-soft">Mix his, hers and unisex. The more you pick, the more you save.</p>
        <div ref={top} data-fly className="relative mt-7 scroll-mt-24 rounded-[18px] border border-[var(--paper-line)] bg-white p-4 shadow-[0_24px_50px_-40px_rgba(13,28,71,.55)] sm:p-5">
          {unlock && (
            <div key={unlock.id} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center">
              <div className="gk-burst absolute left-1/2 top-16 h-0 w-0">
                {Array.from({ length: 18 }, (_, i) => {
                  const a = (i / 18) * Math.PI * 2;
                  const d = 70 + (i % 3) * 30;
                  return <span key={i} style={{ ["--x" as string]: `${Math.cos(a) * d}px`, ["--y" as string]: `${Math.sin(a) * d * 0.7}px`, animationDelay: `${(i % 4) * 0.03}s` }} />;
                })}
              </div>
              <p className="gk-toast mt-[-14px] rounded-full bg-ink px-4 py-1.5 text-[0.85rem] text-[#ecd6a2] shadow-lg">✦ {unlock.text}</p>
            </div>
          )}
          <p className="text-[0.95rem] text-ink-soft" aria-live="polite">
            {count === 0 ? "Pick your scents below — savings unlock as you go." : reward ?? "Bundle complete: you've unlocked every saving."}
          </p>
          <ol className="no-scrollbar -mx-1 mt-4 flex gap-2.5 overflow-x-auto px-1 pb-1" aria-label="Bottles in your bundle">
            {Array.from({ length: slotCount }, (_, i) => {
              const sc = units[i];
              const prize = t.enabled && (i + 1 === t.discountQty || i + 1 === t.freeShipQty);
              return (
                <li key={i} className="w-[76px] shrink-0 sm:w-[92px]">
                  {sc ? (
                    <div className={`relative flex aspect-[4/5] items-center justify-center rounded-[10px] bg-ink ring-2 ring-[#c9a15b] ${flash === sc.slug && units[i + 1]?.slug !== sc.slug ? "gk-pop" : ""}`}>
                      <ProductVisual s={sc} className="h-[84%] w-auto max-w-[70%]" />
                      <button
                        type="button"
                        onClick={() => set(sc.slug, (picked[sc.slug] ?? 1) - 1)}
                        aria-label={`Remove one ${sc.name}`}
                        className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[0.8rem] text-ink shadow ring-1 ring-[var(--paper-line)]"
                      >
                        ✕
                      </button>
                      <span className="absolute bottom-1 left-1.5 text-[0.7rem] text-[#ecd6a2]">{i + 1}</span>
                    </div>
                  ) : (
                    <div className={`flex aspect-[4/5] flex-col items-center justify-center rounded-[10px] border-2 border-dashed px-1 text-center ${prize ? "border-[#c9a15b] bg-[#fbf3e2]" : "border-[var(--paper-line)]"}`}>
                      <span className={`text-[0.66rem] font-medium uppercase leading-tight tracking-[0.06em] ${prize ? "text-[#7a5a1c]" : "text-ink-soft"}`}>{slotHint(i)}</span>
                      <span className="mt-1 font-display text-[1.2rem] leading-none text-ink/60">{i + 1}</span>
                    </div>
                  )}
                  <p className="mt-1 truncate text-center text-[0.72rem] text-ink-soft">{sc ? sc.name : "\u00a0"}</p>
                </li>
              );
            })}
          </ol>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--paper-line)] pt-3">
            <div>
              <p className="text-[0.8rem] text-ink-soft">
                Bundle price{totals.saving ? <> · <s>{formatPrice(totals.subtotal)}</s></> : null}
              </p>
              <p className="font-display text-[1.7rem] leading-none text-ink">{formatPrice(totals.goods)}</p>
            </div>
            <button type="button" disabled={count === 0} onClick={addToBag} className="btn btn-ink min-h-[48px] px-5">
              {count === 0 ? "Add to bag" : `Add ${count} to bag`}
            </button>
          </div>
        </div>
      </section>

      <div className="wrap grid gap-10 pb-28 pt-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-20">
        <div className="min-w-0">
          <div role="tablist" aria-label="Choose from" className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)]">
            {TABS.map((x) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={tab === x.id}
                type="button"
                onClick={() => setTab(x.id)}
                className={`h-11 shrink-0 rounded-full px-5 transition-colors ${tab === x.id ? "bg-ink text-paper" : "border border-[var(--paper-line)] bg-white text-ink hover:border-ink/40"}`}
              >
                {x.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <label htmlFor="bq" className="sr-only">Search notes or perfumes</label>
            <input
              id="bq"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a note or a perfume you love"
              className="h-11 w-full rounded-full border border-[var(--paper-line)] bg-white px-5 text-ink outline-none placeholder:text-[#8b93ab] focus:border-ink sm:max-w-[320px]"
            />
            <div className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] sm:mx-0 sm:px-0" role="group" aria-label="Filter by tag">
              {tags.map((x) => (
                <button
                  key={x}
                  type="button"
                  aria-pressed={tag === x}
                  onClick={() => setTag(tag === x ? null : x)}
                  className={`h-9 shrink-0 rounded-full px-3.5 text-[0.85rem] transition-colors ${tag === x ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>

          {list.length === 0 ? (
            <div className="mt-8 rounded-[14px] border border-dashed border-[var(--paper-line)] p-10 text-center">
              <p className="display-m">No scents match that.</p>
              <button type="button" className="btn btn-ink mt-5" onClick={() => { setTag(null); setQ(""); setTab("all"); }}>Show all scents</button>
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              {list.map((s) => {
                const n = picked[s.slug] ?? 0;
                return (
                  <li key={s.slug} className={`gk-uncap flex flex-col rounded-[14px] border bg-white p-3 transition-colors ${n ? "border-ink" : "border-[var(--paper-line)]"}`}>
                    <Link href={`/perfume/${s.slug}`} className="flex h-32 items-center justify-center rounded-[10px] bg-ink sm:h-40" aria-label={`${s.name} details`}>
                      <ProductVisual s={s} className="h-28 w-auto max-w-[80px] sm:h-36 sm:max-w-[100px]" />
                    </Link>
                    <p className="mt-3 font-display text-[1.15rem] leading-tight sm:text-[1.3rem]">{s.name}</p>
                    <p className="text-[0.82rem] text-ink-soft">Inspired by {inspiredLabel(s)}</p>
                    <div className="mt-2 text-[0.85rem]">
                      <span className="text-ink-soft">Normal {formatPrice(s.price)}</span>
                      {t.enabled && <span className="ml-2 text-[#7a5a1c]">Bundle {formatPrice(off(s.price, t.discountPct))}</span>}
                    </div>
                    <div className="mt-auto pt-3">
                      {n === 0 ? (
                        <button type="button" onClick={() => pick(s.slug, 1)} className="h-10 w-full rounded-full bg-ink text-[0.88rem] text-paper hover:bg-[#1a3170]">
                          Add to bundle
                        </button>
                      ) : (
                        <div className="flex h-10 items-center justify-between rounded-full border border-ink">
                          <button type="button" className="h-10 w-10 text-lg" onClick={() => set(s.slug, n - 1)} aria-label={`One less ${s.name}`}>−</button>
                          <span className="text-[0.9rem] tabular-nums" aria-live="polite">{n}<span className="hidden sm:inline"> in bundle</span></span>
                          <button type="button" className="h-10 w-10 text-lg" onClick={() => pick(s.slug, n + 1)} aria-label={`One more ${s.name}`}>+</button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="hidden lg:block" aria-label="Your bundle">
          <div className="sticky top-24 rounded-[18px] border border-[var(--paper-line)] bg-[#fbf8f2] p-6 shadow-[0_30px_60px_-40px_rgba(13,28,71,.5)]">{summary}</div>
        </aside>
      </div>

      {/* phones: summary as a bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-30 lg:hidden">
        {sheet && <div className="fixed inset-0 bg-[#040b24]/50" onClick={() => setSheet(false)} aria-hidden />}
        <div className="relative rounded-t-[18px] border-t border-[var(--paper-line)] bg-[#fbf8f2] px-[var(--gutter)] pb-4 pt-3 shadow-[0_-20px_40px_-20px_rgba(13,28,71,.35)]">
          {sheet ? (
            <div className="max-h-[75vh] overflow-y-auto pb-2">
              <button type="button" onClick={() => setSheet(false)} className="mx-auto mb-3 block h-1.5 w-12 rounded-full bg-ink/20" aria-label="Close summary" />
              {summary}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setSheet(true)} className="min-w-0 flex-1 text-left" aria-expanded={sheet}>
                <span className="block truncate text-[0.82rem] text-ink-soft">
                  {count} {count === 1 ? "bottle" : "bottles"} ·{" "}
                  {count < t.discountQty
                    ? `+${t.discountQty - count} to save ${t.discountPct}%`
                    : count < t.freeShipQty
                      ? `+${t.freeShipQty - count} for free delivery`
                      : "all savings on"}
                </span>
                <span className="font-display text-[1.5rem] leading-none text-ink">{formatPrice(totals.goods)}</span>
              </button>
              <button type="button" disabled={count === 0} onClick={addToBag} className="btn btn-ink min-h-[48px] px-5">Add to bag</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
