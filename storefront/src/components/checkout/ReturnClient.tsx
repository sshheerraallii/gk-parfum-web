"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { completeCart } from "@/lib/store-client";
import { useCart } from "@/lib/cart";

/** Landing page after redirect-based payments (PayPal, Klarna, 3-D Secure). */
function Inner() {
  const q = useSearchParams();
  const router = useRouter();
  const clear = useCart((s) => s.clear);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const cart = q.get("cart");
    const status = q.get("redirect_status");
    if (!cart) return setErr("We couldn't find your order.");
    if (status && status !== "succeeded" && status !== "processing") {
      return setErr("The payment wasn't completed. Nothing has been charged — you can try again.");
    }
    completeCart(cart)
      .then((o) => {
        clear();
        router.replace(`/order/${o.id}`);
      })
      .catch((e) => setErr(e.message));
  }, [q, router, clear]);

  return (
    <div className="wrap max-w-xl py-24">
      {err ? (
        <>
          <h1 className="display-l">Payment not finished</h1>
          <p className="mt-4 text-ink-soft">{err}</p>
          <Link href="/checkout" className="btn btn-ink mt-8">Back to checkout</Link>
        </>
      ) : (
        <p role="status" className="text-ink-soft">Confirming your payment…</p>
      )}
    </div>
  );
}

export function ReturnClient() {
  return (
    <Suspense fallback={<p className="wrap py-24 text-ink-soft">Confirming your payment…</p>}>
      <Inner />
    </Suspense>
  );
}
