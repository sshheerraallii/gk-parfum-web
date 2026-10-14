import Link from "next/link";
import { getReviews, getScents, type PublicReview } from "@/lib/medusa";
import { ReviewForm } from "./ReviewForm";
import { ProductVisual } from "./ProductVisual";
import { SAMPLE_REVIEWS_ON, sampleReviews } from "@/lib/sampleReviews";
import type { Scent } from "@/lib/catalog";

export function Stars({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5 text-gilt" role="img" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden fill={i <= Math.round(n) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4">
          <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}

function ReviewCard({ r, productName }: { r: PublicReview; productName?: string }) {
  return (
    <li className="flex h-full flex-col rounded-[var(--radius-m)] border border-[var(--line-soft)] bg-ebony p-5">
      <Stars n={r.rating} />
      {r.title && <p className="mt-3 font-display text-[1.35rem] leading-tight text-ivory">{r.title}</p>}
      <p className="mt-2 flex-1 text-smoke">{r.body}</p>
      <p className="small mt-4 text-ivory">
        {r.name}
        {r.verified && <span className="ml-2 text-champagne">· Verified buyer</span>}
      </p>
      {productName && <p className="small text-smoke">on {productName}</p>}
    </li>
  );
}

/** A review as the home page shows it — real (from the admin) or a sample. */
type Shown = { id: string; name: string; place?: string; rating: number; title?: string | null; body: string; scent?: Scent; verified?: boolean; when?: string };

function MarqueeCard({ r }: { r: Shown }) {
  return (
    <li className="flex w-[300px] shrink-0 flex-col rounded-[var(--radius-m)] border border-[var(--line-soft)] bg-ebony/90 p-5 sm:w-[360px]">
      <div className="flex items-center justify-between">
        <Stars n={r.rating} />
        {r.when && <span className="small text-smoke">{r.when}</span>}
      </div>
      {r.title && <p className="mt-3 font-display text-[1.35rem] leading-tight text-ivory">{r.title}</p>}
      <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-smoke">&ldquo;{r.body}&rdquo;</p>
      <div className="mt-4 flex items-center gap-3 border-t border-[var(--line-soft)] pt-4">
        {r.scent && (
          <Link href={`/perfume/${r.scent.slug}`} className="h-12 w-9 shrink-0" aria-label={r.scent.name}>
            <ProductVisual s={r.scent} className="h-12 w-auto" />
          </Link>
        )}
        <div className="min-w-0">
          <p className="truncate text-ivory">
            {r.name}
            {r.place && <span className="text-smoke"> · {r.place}</span>}
          </p>
          {r.scent && (
            <p className="small truncate text-champagne">
              {r.scent.name}
              {r.verified && <span className="text-smoke"> · Verified buyer</span>}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * Home page reviews: two rows gliding in opposite directions. Shows real, approved reviews as soon as there
 * are any; until then (and only while NEXT_PUBLIC_SAMPLE_REVIEWS isn't "off") clearly-labelled sample reviews.
 */
export async function ReviewsStrip() {
  const [{ reviews, count, average }, scents] = await Promise.all([getReviews(), getScents()]);
  const bySlug = (h?: string | null) => scents.find((x) => x.slug === h);
  const real = count > 0;
  if (!real && !SAMPLE_REVIEWS_ON) return null;
  const list: Shown[] = real
    ? reviews.map((r) => ({ id: r.id, name: r.name, rating: r.rating, title: r.title, body: r.body, scent: bySlug(r.product_handle), verified: r.verified }))
    : sampleReviews.map((r) => ({ id: r.id, name: r.name, place: r.place, rating: r.rating, title: r.title, body: r.body, scent: bySlug(r.scent), when: r.when }));
  const half = Math.ceil(list.length / 2);
  const rows = list.length > 6 ? [list.slice(0, half), list.slice(half)] : [list];
  return (
    <section className="py-20 md:py-28" aria-labelledby="reviews-strip">
      <div className="wrap flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="reviews-strip" data-reveal className="display-l">What customers say</h2>
          {real ? (
            <p className="mt-3 flex items-center gap-3 text-smoke">
              <Stars n={average ?? 0} /> {average} out of 5 from {count} {count === 1 ? "review" : "reviews"}
            </p>
          ) : (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1 text-[0.8rem] text-champagne">
              Sample reviews — preview only. Real customer reviews replace these automatically.
            </p>
          )}
        </div>
        <Link href="/reviews" className="btn btn-ghost">{real ? "Read all reviews" : "Write a review"}</Link>
      </div>
      <div className="gk-reviews mt-10 space-y-4 overflow-hidden" role="region" aria-label="Reviews">
        {rows.map((row, i) => (
          <div key={i} className="gk-reviews-row">
            <ul className={`gk-reviews-track flex w-max gap-4 ${i % 2 ? "gk-reviews-rev" : ""}`} style={{ ["--n" as string]: row.length }}>
              {[...row, ...row].map((r, k) => (
                <MarqueeCard key={`${r.id}-${k}`} r={r} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Reviews block on a product page, with AggregateRating schema only when real reviews exist. */
export async function ProductReviews({ handle, name }: { handle: string; name: string }) {
  const { reviews, count, average } = await getReviews(handle);
  const ld =
    count > 0
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name,
          aggregateRating: { "@type": "AggregateRating", ratingValue: average, reviewCount: count },
          review: reviews.slice(0, 10).map((r) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: r.rating },
            author: { "@type": "Person", name: r.name },
            reviewBody: r.body,
            datePublished: r.created_at?.slice(0, 10),
          })),
        }
      : null;
  return (
    <section className="wrap pb-16" aria-labelledby="pr-title" id="reviews">
      <div className="gilt-rule mb-14" />
      <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr]">
        <div>
          <h2 id="pr-title" className="display-l">Reviews</h2>
          {count > 0 ? (
            <p className="mt-3 flex items-center gap-3 text-smoke">
              <Stars n={average ?? 0} /> {average} out of 5 · {count} {count === 1 ? "review" : "reviews"}
            </p>
          ) : (
            <p className="mt-3 text-smoke">No reviews for {name} yet. Tried it? Be the first.</p>
          )}
          <div className="mt-8">
            <ReviewForm productHandle={handle} productName={name} />
          </div>
        </div>
        {count > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => <ReviewCard key={r.id} r={r} />)}
          </ul>
        )}
      </div>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />}
    </section>
  );
}

/** The full /reviews page. */
export async function AllReviews() {
  const [{ reviews, count, average }, scents] = await Promise.all([getReviews(), getScents()]);
  const name = (h: string | null) => scents.find((s) => s.slug === h)?.name;
  return (
    <section className="wrap py-16 md:py-24" aria-labelledby="all-reviews">
      <h1 id="all-reviews" className="display-xl">Reviews</h1>
      {count > 0 ? (
        <p className="lede mt-5 flex items-center gap-3">
          <Stars n={average ?? 0} size={20} /> {average} out of 5 from {count} {count === 1 ? "review" : "reviews"}
        </p>
      ) : (
        <p className="lede mt-5">
          We&apos;re a new house, so our first reviews are still on their way. Every review here comes from a real customer and is checked before it&apos;s published.
        </p>
      )}
      <div className="mt-12 grid gap-12 lg:grid-cols-[1.3fr_.7fr]">
        {count > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => <ReviewCard key={r.id} r={r} productName={name(r.product_handle)} />)}
          </ul>
        ) : SAMPLE_REVIEWS_ON ? (
          <div>
            <p className="mb-4 inline-flex rounded-full border border-[var(--line)] px-3 py-1 text-[0.8rem] text-champagne">
              Sample reviews — preview only. Real customer reviews replace these automatically.
            </p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {sampleReviews.map((r) => (
                <li key={r.id} className="flex h-full flex-col rounded-[var(--radius-m)] border border-[var(--line-soft)] bg-ebony p-5">
                  <Stars n={r.rating} />
                  <p className="mt-3 font-display text-[1.35rem] leading-tight text-ivory">{r.title}</p>
                  <p className="mt-2 flex-1 text-smoke">{r.body}</p>
                  <p className="small mt-4 text-ivory">{r.name} <span className="text-smoke">· {r.place}</span></p>
                  <p className="small text-smoke">on {name(r.scent)}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-[var(--radius-m)] border border-dashed border-[var(--line)] p-10">
            <p className="display-m">Be one of the first</p>
            <p className="mt-3 max-w-[48ch] text-smoke">
              Bought from us? Tell other shoppers how your scent wears, how long it lasts and how close it is to the original.
            </p>
            <Link href="/shop" className="btn btn-ghost mt-6">Browse scents</Link>
          </div>
        )}
        <div>
          <h2 className="display-m">Write a review</h2>
          <div className="mt-6">
            <ReviewForm scents={scents.map((s) => ({ slug: s.slug, name: s.name }))} />
          </div>
        </div>
      </div>
    </section>
  );
}
