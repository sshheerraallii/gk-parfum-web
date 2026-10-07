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
      <h2>Safety</h2>
      <p>For external use only. Keep away from eyes, children and naked flames. Stop using if irritation occurs, and patch-test if you have sensitive skin.</p>
    </Prose>
  );
}
