import type { Metadata } from "next";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Our story", description: "Why GK Parfum makes 100ml extrait de parfum inspired by the world's great houses, hand-poured in the UK.", alternates: { canonical: "/about" } };

export default function About() {
  return (
    <Prose title="Our story" intro="Great perfume shouldn't need a great salary.">
      <img src="/brand/mockup-box-800.webp" alt="A GK Parfum bottle in its presentation box" width={800} height={994} className="mb-10 w-full max-w-[460px] rounded-[var(--radius-m)]" />
      <p>The scents people love most come from houses that charge £100 to £380 a bottle — and much of that price pays for advertising, packaging and department-store rent rather than what&apos;s inside.</p>
      <p>GK Parfum takes those much-loved scent profiles and recreates them as extrait de parfum: 40% fragrance oil, 100&nbsp;ml in every bottle, hand-poured and packed in the UK.</p>
      <h2>What we promise</h2>
      <ul>
        <li>The strength we say on the bottle — always extrait, always 40% oil.</li>
        <li>Honest names. We tell you exactly which famous perfume each scent is inspired by.</li>
        <li>Every order packed by hand, posted within one working day.</li>
      </ul>
    </Prose>
  );
}
