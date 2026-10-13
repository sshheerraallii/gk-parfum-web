import type { Scent } from "@/lib/catalog";
import { bottlePhoto } from "@/lib/bottles";
import { Bottle } from "./Bottle";
import { PhotoBottle } from "./PhotoBottle";

/** The bottle on its own (no backdrop): admin photo if uploaded, else the client's render, else the drawn bottle. */
export function ProductVisual({ s, className, priority = false }: { s: Scent; className?: string; sizes?: string; priority?: boolean }) {
  const img = s.images?.[0];
  const alt = `${s.name} — ${s.inspiredBy ? `inspired by ${s.inspiredBy.brand} ${s.inspiredBy.name}` : "GK Parfum"} 100ml extrait de parfum`;
  if (img) {
    return <img src={img} alt={alt} className={`${className ?? ""} object-contain`} loading={priority ? "eager" : "lazy"} decoding="async" />;
  }
  const p = bottlePhoto(s.slug);
  if (p) return <PhotoBottle p={p} tint={s.tint} alt={alt} priority={priority} className={className} />;
  return <Bottle tint={s.tint} name={s.name} className={className} />;
}
