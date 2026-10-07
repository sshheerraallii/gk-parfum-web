import type { Metadata } from "next";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Returns", description: "Return unopened GK Parfum bottles within 14 days for a full refund.", alternates: { canonical: "/returns" } };

export default function Returns() {
  return (
    <Prose title="Returns" intro="Changed your mind? Send unopened bottles back within 14 days of delivery for a full refund.">
      <h2>How to return</h2>
      <ul>
        <li>Email us with your order number and which bottles you&apos;re returning.</li>
        <li>Pack them securely — sealed and unused — and post them to the address we send you.</li>
        <li>We refund to your original payment method within 5 working days of receiving them.</li>
      </ul>
      <h2>Damaged or wrong items</h2>
      <p>If anything arrives broken or isn&apos;t what you ordered, tell us within 48 hours with a photo and we&apos;ll send a replacement at no cost.</p>
      <h2>Opened bottles</h2>
      <p>For hygiene reasons we can&apos;t accept opened or used perfume, unless it&apos;s faulty. This doesn&apos;t affect your statutory rights.</p>
    </Prose>
  );
}
