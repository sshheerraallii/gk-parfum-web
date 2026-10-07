import { SprayHero } from "@/components/SprayHero";
import { Matcher } from "@/components/Matcher";
import { Collection } from "@/components/Collection";
import { BoxBuilder } from "@/components/BoxBuilder";
import { Ledger } from "@/components/Ledger";
import { Faq } from "@/components/Faq";

export default function Home() {
  return (
    <>
      <SprayHero />
      <div className="gilt-rule" />
      <Matcher />
      <Collection />
      <BoxBuilder />
      <Ledger />
      <div className="gilt-rule" />
      <Faq />
    </>
  );
}
