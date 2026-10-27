"use client";

import { useEffect, useRef, useState } from "react";
import { startPayment, type MCart } from "@/lib/store-client";

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

type PayPalButtons = { render: (el: HTMLElement) => Promise<void>; close?: () => void };
type PayPalSdk = {
  Buttons: (o: {
    style?: Record<string, unknown>;
    createOrder: () => Promise<string>;
    onApprove: () => Promise<void>;
    onCancel?: () => void;
    onError?: (e: unknown) => void;
  }) => PayPalButtons;
};

let sdk: Promise<PayPalSdk> | null = null;
function loadSdk(): Promise<PayPalSdk> {
  return (sdk ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(CLIENT_ID)}&currency=GBP&intent=capture&components=buttons&disable-funding=card&locale=en_GB`;
    s.async = true;
    s.onload = () => resolve((window as unknown as { paypal: PayPalSdk }).paypal);
    s.onerror = () => {
      sdk = null;
      reject(new Error("PayPal couldn't load. Check your connection or pay by card."));
    };
    document.head.appendChild(s);
  }));
}

export const paypalConfigured = () => !!CLIENT_ID;

/**
 * PayPal button. Starts this bag's PayPal payment (the backend creates the PayPal order), the shopper approves
 * in PayPal's window, then completing the order captures the money.
 */
export function PayPalPay({ cart, onDone }: { cart: MCart; onDone: (id: string) => Promise<void> }) {
  const box = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    let buttons: PayPalButtons | null = null;
    setReady(false);
    setErr(null);
    (async () => {
      try {
        const [paypal, session] = await Promise.all([loadSdk(), startPayment(cart.id, "pp_paypal_paypal")]);
        const orderId = session?.data?.paypal_order_id as string | undefined;
        if (!orderId) throw new Error("PayPal isn't available right now — please pay by card.");
        if (!alive || !box.current) return;
        box.current.innerHTML = "";
        buttons = paypal.Buttons({
          style: { layout: "vertical", color: "gold", shape: "pill", label: "paypal", height: 48 },
          createOrder: async () => orderId,
          onApprove: async () => {
            setBusy(true);
            try {
              await onDone(cart.id);
            } catch (e) {
              setErr(e instanceof Error ? e.message : "PayPal approved, but the order didn't save — contact us and we'll sort it.");
              setBusy(false);
            }
          },
          onCancel: () => setErr("PayPal was cancelled — you haven't been charged."),
          onError: () => setErr("PayPal had a problem. Please try again or pay by card."),
        });
        await buttons.render(box.current);
        if (alive) setReady(true);
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : "PayPal isn't available right now.");
      }
    })();
    return () => {
      alive = false;
      buttons?.close?.();
    };
    // a new PayPal order whenever the amount changes
  }, [cart.id, cart.total]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {!ready && !err && <p className="text-ink-soft" role="status">Loading PayPal…</p>}
      <div ref={box} aria-label="Pay with PayPal" className={busy ? "pointer-events-none opacity-50" : ""} />
      {busy && <p className="mt-3 text-center text-ink-soft" role="status">Placing your order…</p>}
      {err && <p className="mt-3 text-[0.92rem] text-[#b4432f]" role="alert">{err}</p>}
    </div>
  );
}
