import { SprayHero } from "@/components/SprayHero";
import { Matcher } from "@/components/Matcher";
import { Collection } from "@/components/Collection";
import { BundleTeaser } from "@/components/BundleTeaser";
import { Ledger } from "@/components/Ledger";
import { ReviewsStrip } from "@/components/Reviews";
import { Faq } from "@/components/Faq";

export default function Home() {
  return (
    <>
      <SprayHero />
      <div className="gilt-rule" />
      <Matcher />
      <BundleTeaser />
      <Collection />
      <Ledger />
      <ReviewsStrip />
      <div className="gilt-rule" />
      <Faq />
    </>
  );
}
