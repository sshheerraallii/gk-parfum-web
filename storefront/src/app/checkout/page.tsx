import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return (
    <div className="bg-paper text-ink" style={{ colorScheme: "light" }}>
      <CheckoutClient />
    </div>
  );
}
