import type { Metadata } from "next";
import { Faq } from "@/components/Faq";

export const metadata: Metadata = { title: "Questions", description: "Answers about GK Parfum: inspired-by scents, longevity, any 3 for £45, delivery, returns and payment.", alternates: { canonical: "/faq" } };

export default function FaqPage() {
  return (
    <>
      <h1 className="sr-only">Frequently asked questions</h1>
      <Faq />
    </>
  );
}
