import type { Metadata } from "next";
import { Suspense } from "react";
import { PreviewClient } from "@/components/PreviewClient";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

export default function PreviewPage() {
  return (
    <Suspense>
      <PreviewClient />
    </Suspense>
  );
}
