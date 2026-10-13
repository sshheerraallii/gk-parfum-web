import type { Scent } from "@/lib/catalog";
import { bottlePhoto, STAGE } from "@/lib/bottles";
import { PhotoBottle } from "./PhotoBottle";
import { Bottle } from "./Bottle";

/**
 * A 4:5 product stage: the scent's note backdrop (woods, citrus, smoke...) with the bottle standing on the ledge.
 * An admin-uploaded photo replaces the whole thing; scents without a render fall back to the drawn bottle.
 */
export function ProductScene({ s, priority = false, className = "" }: { s: Scent; priority?: boolean; className?: string }) {
  // callers may position it themselves (absolute inset-0); otherwise it's a normal box
  const pos = /\b(absolute|fixed)\b/.test(className) ? "" : "relative";
  const alt = `${s.name}${s.inspiredBy ? ` — inspired by ${s.inspiredBy.brand} ${s.inspiredBy.name}` : ""}, 100ml extrait de parfum`;
  if (s.images?.[0]) {
    return (
      <div className={`${pos} overflow-hidden ${className}`}>
        <img src={s.images[0]} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading={priority ? "eager" : "lazy"} decoding="async" />
      </div>
    );
  }
  const p = bottlePhoto(s.slug);
  if (!p) {
    return (
      <div className={`${pos} flex items-center justify-center overflow-hidden ${className}`} style={{ background: `radial-gradient(70% 55% at 50% 62%, ${s.tint}33, transparent 70%)` }}>
        <Bottle tint={s.tint} name={s.name} className="h-[86%] w-auto max-w-full" />
      </div>
    );
  }
  return (
    <div className={`${pos} overflow-hidden ${className}`}>
      <img src={p.bg} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" loading={priority ? "eager" : "lazy"} decoding="async" />
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: `${(STAGE.ledge - STAGE.bottleH) * 100}%`, height: `${STAGE.bottleH * 100}%` }}>
        <PhotoBottle p={p} tint={s.tint} alt={alt} priority={priority} className="h-full" />
      </div>
    </div>
  );
}
