import type { Metadata } from "next";
import { WishlistClient } from "@/components/WishlistClient";

export const metadata: Metadata = {
  title: "Your Wishlist",
  description: "The GK Parfum scents you've saved.",
  alternates: { canonical: "/wishlist" },
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return <WishlistClient />;
}
