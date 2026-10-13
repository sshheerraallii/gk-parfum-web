"use client";

import { useEffect, useRef, useState } from "react";
import type { Scent } from "@/lib/catalog";
import { ProductScene } from "./ProductScene";
import { bottlePhoto } from "@/lib/bottles";

/** Product page bottle: the cap lifts and it sprays once on arrival, then again whenever you tap it. */
export function ProductStage({ s }: { s: Scent }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hint, setHint] = useState(true);
  const timers = useRef<number[]>([]);
  // the cap only comes off our own renders / drawings, not an uploaded photo
  const drawn = !s.images?.length;
  const photo = !!bottlePhoto(s.slug);

  const spray = (delay = 0) => {
    const el = ref.current;
    if (!el || !drawn || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timers.current.forEach(clearTimeout);
    el.classList.remove("gk-open");
    void el.offsetWidth;
    timers.current = [
      window.setTimeout(() => el.classList.add("gk-open"), delay),
      window.setTimeout(() => el.classList.remove("gk-open"), delay + 2400),
    ];
  };

  useEffect(() => {
    spray(900);
    const t = timers.current;
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.slug]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => {
        spray();
        setHint(false);
      }}
      aria-label={`${s.name} — tap to open the bottle`}
      className="relative flex h-full w-full cursor-pointer items-center justify-center"
    >
      <ProductScene s={s} priority className="absolute inset-0" />
      {drawn && hint && <span className="small absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/35 px-3 py-1 text-ivory backdrop-blur">{photo ? "Tap to open" : "Tap the bottle"}</span>}
    </button>
  );
}
