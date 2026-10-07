import type { Scent } from "@/lib/catalog";
import { Bottle } from "./Bottle";

/** Uses the photo uploaded in the admin when there is one; otherwise the drawn bottle. */
export function ProductVisual({ s, className, sizes = "(min-width: 1024px) 25vw, 50vw", priority = false }: { s: Scent; className?: string; sizes?: string; priority?: boolean }) {
  const img = s.images?.[0];
  if (img) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={img}
        alt={`${s.name} — ${s.inspiredBy ? `inspired by ${s.inspiredBy.brand} ${s.inspiredBy.name}` : "GK Parfum"} 100ml extrait de parfum`}
        className={`${className ?? ""} object-contain`}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }
  return <Bottle tint={s.tint} name={s.name} className={className} />;
}
