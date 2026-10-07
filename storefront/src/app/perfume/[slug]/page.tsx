import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CONCENTRATION, OIL_PERCENT, SIZE_ML, bySlug, formatPrice, genderLabel, inspiredLabel, scents } from "@/lib/catalog";
import { SITE } from "@/lib/site";
import { Bottle } from "@/components/Bottle";
import { ScentCard } from "@/components/ScentCard";
import { BuyBox } from "@/components/BuyBox";

export function generateStaticParams() {
  return scents.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = bySlug(slug);
  if (!s) return {};
  const insp = s.inspiredBy ? `Inspired by ${inspiredLabel(s)}` : "A GK original";
  const title = `${s.name} — ${insp} | ${SIZE_ML}ml Extrait`;
  const description = s.inspiredBy
    ? `${s.name} smells like ${inspiredLabel(s)}. ${SIZE_ML}ml extrait de parfum, ${OIL_PERCENT}% oil, lasts ${s.longevityHours[0]}–${s.longevityHours[1]} hours. ${formatPrice(s.price)}, made in the UK.`
    : `${s.name}: ${s.oneLiner} ${SIZE_ML}ml extrait de parfum, ${formatPrice(s.price)}, made in the UK.`;
  return {
    title: { absolute: `${title} | GK Parfum` },
    description,
    alternates: { canonical: `/perfume/${s.slug}` },
    openGraph: { title, description, url: `/perfume/${s.slug}`, type: "website" },
  };
}

const STAGES = [
  { key: "top", when: "First 15 minutes", hint: "What you smell when you spray" },
  { key: "heart", when: "After an hour", hint: "The heart of the scent" },
  { key: "base", when: "All day", hint: "What stays on your skin" },
] as const;

export default async function PerfumePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = bySlug(slug);
  if (!s) notFound();

  const related = scents
    .filter((x) => x.slug !== s.slug && (x.mood === s.mood || x.families.some((f) => s.families.includes(f))))
    .slice(0, 4);

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${SITE.url}/perfume/${s.slug}#product`,
        name: `${s.name} ${CONCENTRATION} ${SIZE_ML}ml`,
        description: s.description,
        sku: s.sku,
        brand: { "@type": "Brand", name: "GK Parfum" },
        category: "Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne",
        image: [`${SITE.url}/brand/gk-mark-foil-transparent.svg`],
        audience: { "@type": "PeopleAudience", suggestedGender: s.gender === "men" ? "male" : s.gender === "women" ? "female" : "unisex" },
        additionalProperty: [
          { "@type": "PropertyValue", name: "Volume", value: `${SIZE_ML} ml` },
          { "@type": "PropertyValue", name: "Concentration", value: `${CONCENTRATION} (${OIL_PERCENT}% oil)` },
          { "@type": "PropertyValue", name: "Top notes", value: s.notes.top.join(", ") },
          { "@type": "PropertyValue", name: "Heart notes", value: s.notes.heart.join(", ") },
          { "@type": "PropertyValue", name: "Base notes", value: s.notes.base.join(", ") },
          ...(s.inspiredBy ? [{ "@type": "PropertyValue", name: "Inspired by", value: inspiredLabel(s) }] : []),
        ],
        offers: {
          "@type": "Offer",
          url: `${SITE.url}/perfume/${s.slug}`,
          priceCurrency: "GBP",
          price: (s.price / 100).toFixed(2),
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingDestination: { "@type": "DefinedRegion", addressCountry: "GB" },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
              transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
            },
          },
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "GB",
            returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: 14,
            returnMethod: "https://schema.org/ReturnByMail",
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
          { "@type": "ListItem", position: 2, name: genderLabel[s.gender], item: `${SITE.url}/shop/${s.gender}` },
          { "@type": "ListItem", position: 3, name: s.name, item: `${SITE.url}/perfume/${s.slug}` },
        ],
      },
    ],
  };

  const maxH = 12;

  return (
    <>
      <nav aria-label="Breadcrumb" className="wrap pt-6">
        <ol className="small flex flex-wrap gap-2 text-smoke">
          <li><Link href="/" className="hover:text-ivory">Home</Link> /</li>
          <li><Link href={`/shop/${s.gender}`} className="hover:text-ivory">{genderLabel[s.gender]}</Link> /</li>
          <li aria-current="page" className="text-ivory">{s.name}</li>
        </ol>
      </nav>

      <section className="wrap grid gap-10 pb-20 pt-6 md:grid-cols-2 md:gap-16 md:pt-10">
        {/* stage */}
        <div className="md:sticky md:top-24 md:self-start">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[var(--radius-m)] bg-ebony md:aspect-[4/5]">
            <div aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(60% 50% at 50% 60%, ${s.tint}40, transparent 70%)` }} />
            <Bottle tint={s.tint} name={s.name} className="relative h-[78%] w-auto drop-shadow-[0_40px_50px_rgba(0,0,0,.55)]" />
          </div>
        </div>

        <div>
          <p className="text-smoke">{genderLabel[s.gender]}</p>
          <h1 className="display-xl mt-2 text-ivory">{s.name}</h1>
          <p className="mt-4 text-[1.2rem] text-champagne">
            {s.inspiredBy ? <>Smells like {inspiredLabel(s)}</> : <>A GK original</>}
          </p>
          <p className="lede mt-4">{s.description}</p>

          <BuyBox slug={s.slug} price={s.price} name={s.name} />

          {/* longevity, in plain terms */}
          <div className="mt-10">
            <div className="flex items-baseline justify-between">
              <h2 className="text-ivory">How long it lasts</h2>
              <span className="text-champagne">{s.longevityHours[0]}–{s.longevityHours[1]} hours</span>
            </div>
            <div className="relative mt-3 h-2 rounded-full bg-ebony" aria-hidden>
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#8a5a1f] to-champagne" style={{ width: `${(s.longevityHours[1] / maxH) * 100}%` }} />
              <div className="absolute inset-y-0 rounded-full bg-champagne/30" style={{ left: `${(s.longevityHours[0] / maxH) * 100}%`, width: `${((s.longevityHours[1] - s.longevityHours[0]) / maxH) * 100}%` }} />
            </div>
            <div className="small mt-2 flex justify-between text-smoke" aria-hidden>
              <span>Spray</span><span>6 hours</span><span>12 hours</span>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-ivory">Wear it for</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {s.occasions.map((o) => (
                <li key={o} className="rounded-full border border-[var(--line)] px-4 py-1.5 text-[0.95rem] text-ivory">{o}</li>
              ))}
            </ul>
          </div>

          {/* notes as the scent unfolds — a real sequence */}
          <div className="mt-12">
            <h2 className="display-m">How it changes on your skin</h2>
            <ol className="relative mt-6 space-y-8 border-l border-[var(--line)] pl-7">
              {STAGES.map((st) => (
                <li key={st.key} className="relative">
                  <span aria-hidden className="absolute -left-[33px] top-1.5 h-3 w-3 rounded-full border border-gilt bg-velvet" />
                  <p className="text-champagne">{st.when}</p>
                  <p className="small text-smoke">{st.hint}</p>
                  <p className="mt-2 font-display text-[1.45rem] leading-snug text-ivory">{s.notes[st.key].join(", ")}</p>
                </li>
              ))}
            </ol>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-m)] border border-[var(--line-soft)] bg-[var(--line-soft)] text-[0.95rem]">
            {[
              ["Size", `${SIZE_ML} ml`],
              ["Strength", `${CONCENTRATION}, ${OIL_PERCENT}% oil`],
              ["Scent family", s.families.join(", ")],
              ["Made in", "United Kingdom"],
            ].map(([k, v]) => (
              <div key={k} className="bg-velvet p-4">
                <dt className="small text-smoke">{k}</dt>
                <dd className="mt-1 text-ivory">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {related.length > 0 && (
        <section className="wrap pb-10" aria-labelledby="related-title">
          <div className="gilt-rule mb-16" />
          <h2 id="related-title" className="display-l">If you like {s.name}</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 lg:gap-x-6">
            {related.map((r) => <ScentCard key={r.slug} s={r} />)}
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
