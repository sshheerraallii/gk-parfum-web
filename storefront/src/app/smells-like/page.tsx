import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice, scents } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Smells Like — Find the Inspired Version of Your Favourite Perfume",
  description:
    "The full list: which GK Parfum scent smells like Creed Aventus, Baccarat Rouge 540, Dior Sauvage Elixir, Tom Ford Black Orchid, Lost Cherry, Delina and more.",
  alternates: { canonical: "/smells-like" },
};

export default function SmellsLike() {
  const list = scents.filter((s) => s.inspiredBy).sort((a, b) => a.inspiredBy!.brand.localeCompare(b.inspiredBy!.brand));
  return (
    <section className="wrap py-14 md:py-20">
      <h1 className="display-xl max-w-[16ch]">If you love this, wear ours</h1>
      <p className="lede mt-5">Every GK scent, listed next to the famous perfume it smells like.</p>
      <div className="mt-12 overflow-hidden rounded-[var(--radius-m)] border border-[var(--line)]">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Original perfumes and their GK Parfum equivalents</caption>
          <thead className="bg-ebony">
            <tr>
              <th scope="col" className="px-5 py-4 font-normal text-smoke">If you love</th>
              <th scope="col" className="px-5 py-4 font-normal text-smoke">Wear</th>
              <th scope="col" className="hidden px-5 py-4 text-right font-normal text-smoke sm:table-cell">100 ml</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.slug} className="border-t border-[var(--line-soft)]">
                <td className="px-5 py-4">
                  <span className="small block text-smoke">{s.inspiredBy!.brand}</span>
                  <span className="text-ivory">{s.inspiredBy!.name}</span>
                </td>
                <td className="px-5 py-4">
                  <Link href={`/perfume/${s.slug}`} className="font-display text-[1.35rem] text-champagne hover:text-ivory">{s.name}</Link>
                </td>
                <td className="hidden px-5 py-4 text-right text-ivory sm:table-cell">{formatPrice(s.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
