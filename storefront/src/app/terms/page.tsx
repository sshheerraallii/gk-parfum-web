import type { Metadata } from "next";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Terms and conditions", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <Prose title="Terms and conditions" intro="The rules for buying from GK Parfum.">
      <h2>Our products</h2>
      <p>GK Parfum sells original fragrances inspired by the scent profiles of well-known perfumes. We name those perfumes only to describe what our scents smell like. We are not affiliated with, endorsed by or connected to any of those brands, and their trade marks belong to their owners.</p>
      <h2>Orders and prices</h2>
      <p>Prices are in pounds sterling and include VAT where applicable. Your order is accepted when we email your confirmation.</p>
      <h2>Delivery and returns</h2>
      <p>See our <a href="/delivery">delivery</a> and <a href="/returns">returns</a> pages. Your statutory rights under the Consumer Rights Act 2015 are not affected.</p>
      <h2>Offers</h2>
      <p>Bundle savings (10% off with 2 or more bottles, plus free delivery with 3 or more) and the subscribe-and-save discount don&apos;t combine: each bottle receives the better of the two. Offers may change; the price shown in your bag at checkout is the price you pay.</p>
      <h2 id="prize-draw">Newsletter prize draw</h2>
      <p>Everyone who joins our mailing list through the website is entered into a free prize draw to win one full-size bottle of their choice. No purchase is necessary. Open to UK residents aged 18 and over. The draw date and closing date are announced on our website and social channels; the winner is chosen at random and contacted by email, and must reply within 14 days to claim the prize. One entry per person. The prize has no cash alternative. The promoter is GK Parfum.</p>
      <h2>Safety</h2>
      <p>For external use only. Keep away from eyes, children and naked flames. Stop using if irritation occurs, and patch-test if you have sensitive skin.</p>
    </Prose>
  );
}
