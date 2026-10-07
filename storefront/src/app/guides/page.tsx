import type { Metadata } from "next";
import Link from "next/link";
import { guides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Fragrance Guides",
  description: "Plain-English guides to perfume: strengths, notes, making scents last, and choosing the right inspired fragrance.",
  alternates: { canonical: "/guides" },
};

export default function Guides() {
  return (
    <section className="wrap py-16 md:py-24">
      <h1 className="display-xl">Fragrance guides</h1>
      <p className="lede mt-5">Short, useful reads on wearing and choosing perfume.</p>
      <ul className="mt-12 divide-y divide-[var(--line-soft)] border-y border-[var(--line-soft)]">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link href={`/guides/${g.slug}`} className="group block py-8">
              <h2 className="display-m text-ivory group-hover:text-champagne">{g.title}</h2>
              <p className="mt-2 max-w-[65ch] text-smoke">{g.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
