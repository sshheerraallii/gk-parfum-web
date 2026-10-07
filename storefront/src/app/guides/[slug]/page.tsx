import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { guideBySlug, guides } from "@/lib/guides";
import { getScents } from "@/lib/medusa";
import { ScentCard } from "@/components/ScentCard";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = guideBySlug((await params).slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { type: "article", title: g.title, description: g.description, publishedTime: g.published },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const g = guideBySlug((await params).slug);
  if (!g) notFound();
  const scents = await getScents();
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.description,
    datePublished: g.published,
    author: { "@type": "Organization", name: SITE.name },
    publisher: { "@id": `${SITE.url}/#org` },
    mainEntityOfPage: `${SITE.url}/guides/${g.slug}`,
  };
  return (
    <article className="wrap max-w-3xl py-16 md:py-24">
      <h1 className="display-l">{g.title}</h1>
      <p className="lede mt-5">{g.description}</p>
      <div className="prose-gk mt-12">
        {g.blocks.map((b, i) =>
          b.h ? (
            <h2 key={i}>{b.h}</h2>
          ) : b.p ? (
            <p key={i}>{b.p}</p>
          ) : b.list ? (
            <ul key={i}>{b.list.map((l) => <li key={l}>{l}</li>)}</ul>
          ) : b.scents ? (
            <div key={i} className="not-prose my-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3">
              {b.scents.map((slug) => {
                const s = scents.find((x) => x.slug === slug);
                return s ? <ScentCard key={slug} s={s} /> : null;
              })}
            </div>
          ) : null
        )}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </article>
  );
}
