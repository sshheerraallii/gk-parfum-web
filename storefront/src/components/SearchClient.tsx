"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { searchScents } from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { logSearch } from "@/lib/store-client";
import { ScentCard } from "./ScentCard";

export function SearchClient() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const router = useRouter();
  const scents = useCatalog();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  useEffect(() => {
    const t = setTimeout(() => router.replace(q ? `/search?q=${encodeURIComponent(q)}` : "/search", { scroll: false }), 300);
    return () => clearTimeout(t);
  }, [q, router]);
  const results = useMemo(() => (q.trim() ? searchScents(q, scents) : scents), [q, scents]);
  const logged = useRef("");
  useEffect(() => {
    const v = q.trim();
    if (v.length < 3 || v === logged.current) return;
    const t = setTimeout(() => {
      logged.current = v;
      logSearch(v, results.length, "search");
    }, 1500);
    return () => clearTimeout(t);
  }, [q, results.length]);
  return (
    <section className="wrap py-14 md:py-20">
      <h1 className="display-l">Search</h1>
      <label htmlFor="q" className="sr-only">Search by perfume, brand or note</label>
      <input
        ref={ref}
        id="q"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="A perfume you love, or notes like woody, oud, vanilla"
        className="mt-6 h-16 w-full rounded-full border border-[var(--line)] bg-ebony px-6 text-[1.15rem] text-ivory placeholder:text-[#6f675c] focus:border-gilt focus:outline-none"
      />
      <p className="small mt-4 text-smoke" aria-live="polite">
        {q.trim() ? `${results.length} ${results.length === 1 ? "match" : "matches"}` : "Showing everything"}
      </p>
      {results.length === 0 ? (
        <p className="display-m mt-10">No matches. Try a note — oud, rose, vanilla, citrus.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {results.map((s) => <ScentCard key={s.slug} s={s} />)}
        </div>
      )}
    </section>
  );
}
