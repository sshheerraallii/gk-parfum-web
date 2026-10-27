"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { previewKey, setPreviewKey, SHOP_MODE } from "@/lib/preview";

/** /preview?key=… turns on pre-launch checkout in this browser; /preview?off turns it off. */
export function PreviewClient() {
  const params = useSearchParams();
  const [on, setOn] = useState<boolean | null>(null);

  useEffect(() => {
    const k = params.get("key");
    if (params.has("off")) setPreviewKey(null);
    else if (k) setPreviewKey(k);
    setOn(!!previewKey());
  }, [params]);

  return (
    <section className="wrap max-w-xl py-20">
      <h1 className="display-l">Preview mode</h1>
      {on === null ? null : SHOP_MODE !== "prelaunch" ? (
        <p className="lede mt-5">The shop is live — checkout is open to everyone, no preview needed.</p>
      ) : on ? (
        <>
          <p className="lede mt-5">Checkout is unlocked in this browser for testing. Payments here use the test setup.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-gold">Go to the shop</Link>
            <Link href="/preview?off" className="btn btn-ghost">Turn preview off</Link>
          </div>
        </>
      ) : (
        <p className="lede mt-5">Preview is off in this browser. Checkout shows &ldquo;launching soon&rdquo;.</p>
      )}
    </section>
  );
}
