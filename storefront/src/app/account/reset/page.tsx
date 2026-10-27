import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordClient } from "@/components/ResetPasswordClient";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default function ResetPage() {
  return (
    <Suspense>
      <ResetPasswordClient />
    </Suspense>
  );
}
