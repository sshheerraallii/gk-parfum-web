"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { useCatalog } from "./CatalogProvider";
import { ScentCard, HeartIcon } from "./ScentCard";

export function WishlistClient() {
  const scents = useCatalog();
  const { items, ready, signedIn } = useWishlist();
  const addMany = useCart((s) => s.addMany);
  const list = items.map((slug) => scents.find((s) => s.slug === slug)).filter((s): s is NonNullable<typeof s> => !!s);

  return (
    <section className="wrap py-14 md:py-20" aria-labelledby="wish-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-smoke">Saved for later</p>
          <h1 id="wish-title" className="display-xl mt-1">Your wishlist</h1>
        </div>
        {list.length > 1 && (
          <button type="button" className="btn btn-gold" data-fly onClick={() => addMany(list.map((s) => s.slug))}>
            Add all {list.length} to bag
          </button>
        )}
      </div>

      {ready && !signedIn && list.length > 0 && (
        <p className="small mt-4 text-smoke">
          Saved in this browser. <Link href="/account?next=/wishlist" className="text-champagne underline-offset-4 hover:underline">Sign in</Link> to keep your wishlist on every device.
        </p>
      )}

      {!ready ? null : list.length ? (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {list.map((s, i) => (
            <ScentCard key={s.slug} s={s} index={i} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-[var(--radius-m)] border border-dashed border-[var(--line)] p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--line)] text-champagne">
            <HeartIcon size={24} />
          </span>
          <p className="display-m mt-5">Nothing saved yet</p>
          <p className="mx-auto mt-2 max-w-[44ch] text-smoke">Tap the heart on any scent to keep it here — no account needed.</p>
          <Link href="/shop" className="btn btn-ghost mt-6">Browse the collection</Link>
        </div>
      )}
    </section>
  );
}
