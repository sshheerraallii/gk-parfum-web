import type { Metadata } from "next";
import { BoxBuilder } from "@/components/BoxBuilder";
import { Faq } from "@/components/Faq";

export const metadata: Metadata = {
  title: "Perfume Gift Box — Any 3 Scents for £45",
  description: "Build a GK Parfum gift box: choose any three 100ml extrait de parfum scents for £45, with an optional presentation box.",
  alternates: { canonical: "/gift-box" },
};

export default function GiftBoxPage() {
  return (
    <>
      <h1 className="sr-only">Perfume gift box — any three scents</h1>
      <BoxBuilder id="builder" />
      <Faq withSchema={false} />
    </>
  );
}
