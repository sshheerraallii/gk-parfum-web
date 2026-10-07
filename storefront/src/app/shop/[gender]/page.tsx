import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Collection } from "@/components/Collection";
import type { Gender } from "@/lib/catalog";

const COPY: Record<Gender, { h1: string; title: string; intro: string; description: string }> = {
  men: {
    h1: "Perfume for him",
    title: "Men's Inspired Perfumes — Aventus, Sauvage, Oud Wood & more",
    intro: "Fresh, spicy and woody scents that smell like the designer favourites. 100 ml extrait for £16.99–£17.99.",
    description:
      "Men's luxury inspired fragrances: scents like Creed Aventus, Dior Sauvage Elixir, Tom Ford Oud Wood and Parfums de Marly Althaïr. 100ml extrait, made in the UK.",
  },
  women: {
    h1: "Perfume for her",
    title: "Women's Inspired Perfumes — Delina, Symphony & more",
    intro: "Floral, fruity and soft scents that smell like the designer favourites. 100 ml extrait for £17.99.",
    description:
      "Women's luxury inspired fragrances: scents like Parfums de Marly Delina, Louis Vuitton Symphony and Creed Aventus for Her. 100ml extrait, made in the UK.",
  },
  unisex: {
    h1: "Unisex perfume",
    title: "Unisex Inspired Perfumes — Baccarat Rouge 540, Lost Cherry & more",
    intro: "Scents for anyone — amber, gourmand and dark florals. 100 ml extrait for £16.99–£17.99.",
    description:
      "Unisex luxury inspired fragrances: scents like Baccarat Rouge 540, Tom Ford Lost Cherry, Black Orchid and Kilian Angels' Share. 100ml extrait, made in the UK.",
  },
};

export function generateStaticParams() {
  return (Object.keys(COPY) as Gender[]).map((gender) => ({ gender }));
}

export async function generateMetadata({ params }: { params: Promise<{ gender: string }> }): Promise<Metadata> {
  const { gender } = await params;
  const c = COPY[gender as Gender];
  if (!c) return {};
  return { title: c.title, description: c.description, alternates: { canonical: `/shop/${gender}` } };
}

export default async function GenderPage({ params }: { params: Promise<{ gender: string }> }) {
  const { gender } = await params;
  const c = COPY[gender as Gender];
  if (!c) notFound();
  return <Collection key={gender} as="h1" heading={c.h1} intro={c.intro} initialWho={gender as Gender} />;
}
