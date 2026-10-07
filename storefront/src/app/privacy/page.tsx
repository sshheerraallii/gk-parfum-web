import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <Prose title="Privacy policy" intro="What we collect, why, and the choices you have.">
      <h2>What we collect</h2>
      <ul>
        <li>Your name, email, delivery address and phone number, so we can deliver your order and contact you about it.</li>
        <li>Your order history, so we can handle returns and questions.</li>
        <li>Payment details are handled by Stripe and PayPal. We never see or store your card number.</li>
      </ul>
      <h2>Marketing</h2>
      <p>We only email you offers if you tick the box at checkout. Every email has an unsubscribe link.</p>
      <h2>Who we share it with</h2>
      <p>Only the services needed to run the shop: our payment provider, Royal Mail for delivery, and our hosting and email providers. We never sell your data.</p>
      <h2>Your rights</h2>
      <p>Under UK GDPR you can ask to see, correct or delete your data at any time. Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
    </Prose>
  );
}
