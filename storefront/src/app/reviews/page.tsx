import type { Metadata } from "next";
import { AllReviews } from "@/components/Reviews";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Customer Reviews",
  description: "Real reviews of GK Parfum's 100ml extrait de parfum inspired scents, from verified customers. Write your own review.",
  alternates: { canonical: "/reviews" },
};

export default function ReviewsPage() {
  return <AllReviews />;
}
