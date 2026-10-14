import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPosts, getScents } from "@/lib/medusa";
import { readingMinutes } from "@/lib/blog";
import { PostBody } from "@/components/PostBody";
import { PostCover, coverOf } from "@/components/PostCover";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

const abs = (u: string) => (u.startsWith("/") ? `${SITE.url}${u}` : u);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getPost((await params).slug);
  if (!p) return {};
  const img = coverOf(p);
  return {
    title: p.seo_title || p.title,
    description: p.seo_description || p.excerpt || undefined,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: {
      type: "article",
      title: p.seo_title || p.title,
      description: p.seo_description || p.excerpt || undefined,
      publishedTime: p.published_at,
      modifiedTime: p.updated_at,
      images: img ? [abs(img)] : undefined,
    },
  };
}

const date = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [p, scents, all] = await Promise.all([getPost(slug), getScents(), getPosts()]);
  if (!p) notFound();
  const img = coverOf(p);
  const more = all.filter((x) => x.slug !== p.slug).slice(0, 3);
  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.seo_description || p.excerpt || undefined,
    image: img ? [abs(img)] : undefined,
    datePublished: p.published_at,
    dateModified: p.updated_at || p.published_at,
    author: { "@type": p.author && p.author !== SITE.name ? "Person" : "Organization", name: p.author || SITE.name },
    publisher: { "@id": `${SITE.url}/#org` },
    mainEntityOfPage: `${SITE.url}/blog/${p.slug}`,
    keywords: p.tags?.join(", ") || undefined,
  };
  return (
    <article className="pb-20">
      <header className="wrap max-w-3xl pt-14 md:pt-20">
        <nav aria-label="Breadcrumb" className="small text-smoke">
          <Link href="/blog" className="hover:text-champagne">The GK Journal</Link>
          {p.tags?.[0] && <> · <span className="text-champagne">{p.tags[0]}</span></>}
        </nav>
        <h1 className="display-l mt-4">{p.title}</h1>
        {p.excerpt && <p className="lede mt-5">{p.excerpt}</p>}
        <p className="small mt-6 text-smoke">
          {p.author ? `${p.author} · ` : ""}
          <time dateTime={p.published_at}>{date(p.published_at)}</time> · {readingMinutes(p.body)} min read
        </p>
      </header>
      {p.cover_url && (
        <div className="wrap mt-10 max-w-5xl">
          <PostCover post={p} priority className="aspect-[16/9] rounded-[var(--radius-m)] border border-[var(--line-soft)]" />
        </div>
      )}
      <div className="wrap mt-12 max-w-3xl">
        <PostBody body={p.body ?? ""} scents={scents} />
      </div>

      {more.length > 0 && (
        <aside className="wrap mt-24" aria-labelledby="more-title">
          <div className="gilt-rule mb-12" />
          <h2 id="more-title" className="display-m">More from the journal</h2>
          <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-3">
            {more.map((m) => (
              <li key={m.slug}>
                <Link href={`/blog/${m.slug}`} className="group block">
                  <PostCover post={m} className="aspect-[16/10] rounded-[var(--radius-m)] border border-[var(--line-soft)]" />
                  <h3 className="mt-3 font-display text-[1.35rem] leading-tight text-ivory group-hover:text-champagne">{m.title}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    </article>
  );
}
