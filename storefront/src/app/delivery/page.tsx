import type { Metadata } from "next";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Delivery", description: "UK delivery with Royal Mail Tracked 48 and Tracked 24. Free Tracked 48 delivery over £65 or on any 3 bottles.", alternates: { canonical: "/delivery" } };

export default function Delivery() {
  return (
    <Prose title="Delivery" intro="Every order is packed by hand and sent with Royal Mail, tracked from our door to yours.">
      <h2>Options and prices</h2>
      <ul>
        <li><strong>Royal Mail Tracked 48</strong> — 2–3 working days. £3.99, or free on orders over £65 and on any order of 3 or more bottles.</li>
        <li><strong>Royal Mail Tracked 24</strong> — next working day. £5.99.</li>
      </ul>
      <h2>Gift box</h2>
      <p>Every order arrives in our signature gift box, free of charge.</p>
      <h2>Repeat deliveries</h2>
      <p>If you chose &ldquo;Deliver every 4 weeks&rdquo; on a scent, we send it again every 4 weeks at 10% off. To pause, change or cancel, just <a href="/contact">get in touch</a>.</p>
      <h2>When will it ship?</h2>
      <p>Orders placed before 1pm on a working day are usually posted the same day, and always within one working day.</p>
      <h2>Tracking</h2>
      <p>When your order ships we email you a Royal Mail tracking number. You can follow it on our <a href="/track">tracking page</a>.</p>
      <h2>Where we deliver</h2>
      <p>We currently deliver to addresses in the United Kingdom only.</p>
    </Prose>
  );
}
