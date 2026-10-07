import type { Metadata } from "next";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Delivery", description: "UK delivery with Royal Mail Tracked 48 and Tracked 24. Free Tracked 48 delivery over £35.", alternates: { canonical: "/delivery" } };

export default function Delivery() {
  return (
    <Prose title="Delivery" intro="Every order is packed by hand and sent with Royal Mail, tracked from our door to yours.">
      <h2>Options and prices</h2>
      <ul>
        <li><strong>Royal Mail Tracked 48</strong> — 2–3 working days. £3.99, or free on orders over £35.</li>
        <li><strong>Royal Mail Tracked 24</strong> — next working day. £5.99.</li>
      </ul>
      <h2>When will it ship?</h2>
      <p>Orders placed before 1pm on a working day are usually posted the same day, and always within one working day.</p>
      <h2>Tracking</h2>
      <p>When your order ships we email you a Royal Mail tracking number. You can follow it on our <a href="/track">tracking page</a>.</p>
      <h2>Where we deliver</h2>
      <p>We currently deliver to addresses in the United Kingdom only.</p>
    </Prose>
  );
}
