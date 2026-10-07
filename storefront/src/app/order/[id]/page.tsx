import type { Metadata } from "next";
import { OrderClient } from "@/components/checkout/OrderClient";

export function generateStaticParams() {
  return [{ id: "demo" }];
}

export const metadata: Metadata = { title: "Thank you", robots: { index: false, follow: false } };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderClient id={id} />;
}
