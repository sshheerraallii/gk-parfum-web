import { FAQ } from "@/lib/faq";

export function Faq({ withSchema = true }: { withSchema?: boolean }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <section className="wrap py-20 md:py-28" aria-labelledby="faq-title">
      <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr]">
        <h2 id="faq-title" className="display-l max-w-[10ch]">Good questions</h2>
        <div className="divide-y divide-[var(--line-soft)] border-y border-[var(--line-soft)]">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.12rem] text-ivory marker:hidden">
                {f.q}
                <span aria-hidden className="relative h-4 w-4 shrink-0">
                  <span className="absolute left-0 top-1/2 h-px w-4 bg-gilt" />
                  <span className="absolute left-1/2 top-0 h-4 w-px bg-gilt transition-transform group-open:scale-y-0" />
                </span>
              </summary>
              <p className="max-w-[60ch] pb-6 text-smoke">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      {withSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />}
    </section>
  );
}
