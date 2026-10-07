import type { Metadata } from "next";
import { ReturnClient } from "@/components/checkout/ReturnClient";

export const metadata: Metadata = { title: "Finishing your order", robots: { index: false, follow: false } };

export default function ReturnPage() {
  return (
    <div className="bg-paper text-ink" style={{ colorScheme: "light" }}>
      <ReturnClient />
    </div>
  );
}
