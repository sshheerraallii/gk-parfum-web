import type { Metadata } from "next";
import { BundleBuilder } from "@/components/BundleBuilder";
import { Faq } from "@/components/Faq";

export const metadata: Metadata = {
  title: "Build Your Perfume Bundle — Save 10%, Free Delivery on 3",
  description:
    "Build your GK Parfum bundle: 2 bottles save 10%, 3 bottles save 10% plus free UK delivery. Mix men's, women's and unisex 100ml extrait de parfum. Free signature gift box with every order.",
  alternates: { canonical: "/bundle" },
};

export default function BundlePage() {
  return (
    <>
      <BundleBuilder />
      <Faq withSchema={false} />
    </>
  );
}
