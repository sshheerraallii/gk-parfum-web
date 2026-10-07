import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Contact us", alternates: { canonical: "/contact" } };

export default function Contact() {
  return (
    <Prose title="Contact us" intro="A real person reads every message. We reply within one working day.">
      <h2>Email</h2>
      <p><a href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
      <h2>About an order?</h2>
      <p>Include your order number — it&apos;s in your confirmation email — and we can help faster.</p>
    </Prose>
  );
}
