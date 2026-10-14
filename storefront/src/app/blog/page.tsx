import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/medusa";
import { readingMinutes } from "@/lib/blog";
import { PostCover } from "@/components/PostCover";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "The GK Journal — Perfume Tips, Guides & News",
  description: "Perfume guides, scent pairings, new launches and behind-the-scenes from GK Parfum — luxury inspired fragrances, 100ml extrait de parfum.",
  alternates: { canonical: "/blog" },
};

const date = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default async function BlogIndex() {
  const posts = await getPosts();
  const [lead, ...rest] = posts;
  return (
    <section className="wrap py-14 md:py-20" aria-labelledby="blog-title">
      <div data-reveal>
        <p className="text-champagne">The GK Journal</p>
        <h1 id="blog-title" className="display-xl mt-1">Stories, guides &amp; new scents</h1>
        <p className="lede mt-4 max-w-[56ch]">How to choose, wear and layer perfume — plus what&apos;s new at GK Parfum.</p>
      </div>

      {!lead ? (
        <p className="mt-12 text-smoke">New posts are on their way.</p>
      ) : (
        <>
          <Link href={`/blog/${lead.slug}`} className="group mt-12 grid overflow-hidden rounded-[var(--radius-m)] border border-[var(--line-soft)] bg-ebony md:grid-cols-[1.2fr_1fr]" data-reveal>
            <PostCover post={lead} priority className="aspect-[16/10] md:aspect-auto md:min-h-[360px]" />
            <div className="flex flex-col justify-center p-6 md:p-10">
              <p className="small text-champagne">{lead.tags?.[0] ?? "Latest"} · {date(lead.published_at)}</p>
              <h2 className="display-l mt-3 text-ivory group-hover:text-champagne">{lead.title}</h2>
              {lead.excerpt && <p className="mt-4 text-smoke">{lead.excerpt}</p>}
              <span className="small mt-6 text-ivory underline-offset-4 group-hover:underline">Read the story →</span>
            </div>
          </Link>

          {rest.length > 0 && (
            <ul className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <li key={p.slug} data-reveal>
                  <Link href={`/blog/${p.slug}`} className="group block">
                    <PostCover post={p} className="aspect-[16/10] rounded-[var(--radius-m)] border border-[var(--line-soft)]" />
                    <p className="small mt-4 text-champagne">
                      {p.tags?.[0] ? `${p.tags[0]} · ` : ""}
                      {date(p.published_at)}
                      {p.body ? ` · ${readingMinutes(p.body)} min read` : ""}
                    </p>
                    <h2 className="mt-2 font-display text-[1.6rem] leading-[1.15] text-ivory group-hover:text-champagne">{p.title}</h2>
                    {p.excerpt && <p className="mt-2 line-clamp-3 text-smoke">{p.excerpt}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
