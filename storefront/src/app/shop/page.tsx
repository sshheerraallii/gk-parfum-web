import type { Metadata } from "next";
import { Collection } from "@/components/Collection";

export const metadata: Metadata = {
  title: "All Perfumes — Inspired Fragrances, 100ml Extrait",
  description:
    "Shop all 16 GK Parfum scents: luxury inspired perfumes for men, women and unisex. 100ml extrait de parfum, 40% oil, from £16.99. Any 3 for £45.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return <Collection as="h1" heading="All scents" />;
}
