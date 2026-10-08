"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getOrder } from "@/lib/store-client";
import { formatPrice } from "@/lib/catalog";

type Order = Awaited<ReturnType<typeof getOrder>>;
const pence = (n: number) => Math.round(Number(n) * 100);

type DemoOrder = {
  display_id: number;
  email: string;
  first_name: string;
  items: { title: string; qty: number; unit: number; sub?: boolean }[];
  giftBox: boolean;
  saving: number;
  discount: number;
  shipping: { name: string; cost: number };
  total: number;
};

function DemoThanks() {
  const [o, setO] = useState<DemoOrder | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("gk-demo-order");
      if (raw) setO(JSON.parse(raw));
    } catch {
      /* nothing saved */
    }
  }, []);
  return (
    <section className="wrap max-w-2xl py-20 md:py-28">
      <img src="/brand/gk-crest-240.webp" alt="" aria-hidden className="h-28 w-auto" />
      <h1 className="display-xl mt-8">Thank you{o?.first_name ? `, ${o.first_name}` : ""}</h1>
      <p className="lede mt-5">
        {o ? <>Order #{o.display_id} is confirmed. We&apos;ll pack it by hand and email {o.email} when it&apos;s on its way.</> : <>Your order is confirmed.</>}
      </p>
      <p className="small mt-3 text-champagne">Preview order — nothing was charged.</p>
      {o && (
        <div className="mt-10 rounded-[var(--radius-m)] border border-[var(--line)] bg-ebony p-6">
          <ul className="divide-y divide-[var(--line-soft)]">
            {o.items.map((i) => (
              <li key={i.title} className="flex justify-between gap-4 py-3">
                <span className="text-ivory">
                  {i.title} <span className="text-smoke">× {i.qty}</span>
                  {i.sub && <span className="small block text-champagne">Delivered every 4 weeks</span>}
                </span>
                <span className="text-ivory">{formatPrice(i.unit * i.qty)}</span>
              </li>
            ))}
            {o.giftBox && (
              <li className="flex justify-between gap-4 py-3"><span className="text-ivory">Signature gift box</span><span className="text-champagne">Free</span></li>
            )}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-[var(--line-soft)] pt-4">
            {o.saving > 0 && <div className="flex justify-between text-champagne"><dt>Bundle &amp; subscription savings</dt><dd>−{formatPrice(o.saving)}</dd></div>}
            {o.discount > 0 && <div className="flex justify-between text-champagne"><dt>Discount</dt><dd>−{formatPrice(o.discount)}</dd></div>}
            <div className="flex justify-between text-smoke"><dt>Delivery ({o.shipping.name})</dt><dd>{o.shipping.cost === 0 ? "Free" : formatPrice(o.shipping.cost)}</dd></div>
            <div className="flex justify-between text-[1.15rem] text-ivory"><dt>Total</dt><dd>{formatPrice(o.total)}</dd></div>
          </dl>
        </div>
      )}
      <Link href="/shop" className="btn btn-ghost mt-10">Keep browsing</Link>
    </section>
  );
}

export function OrderClient({ id }: { id: string }) {
  if (id === "demo") return <DemoThanks />;
  return <LiveOrder id={id} />;
}

function LiveOrder({ id }: { id: string }) {
  const [o, setO] = useState<Order | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    getOrder(id).then(setO).catch((e) => setErr(e.message));
  }, [id]);

  return (
    <section className="wrap max-w-2xl py-20 md:py-28">
      <img src="/brand/gk-crest-240.webp" alt="" aria-hidden className="h-28 w-auto" />
      <h1 className="display-xl mt-8">Thank you{o?.shipping_address?.first_name ? `, ${o.shipping_address.first_name}` : ""}</h1>
      {err ? (
        <p className="lede mt-5">Your order is placed. We couldn&apos;t load the details just now — your confirmation email has everything.</p>
      ) : !o ? (
        <p className="lede mt-5" role="status">Loading your order…</p>
      ) : (
        <>
          <p className="lede mt-5">
            Order #{o.display_id} is confirmed. We&apos;ll pack it by hand and email {o.email} when it&apos;s on its way.
          </p>
          <div className="mt-10 rounded-[var(--radius-m)] border border-[var(--line)] bg-ebony p-6">
            <ul className="divide-y divide-[var(--line-soft)]">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-3">
                  <span className="text-ivory">{i.product_title} <span className="text-smoke">× {i.quantity}</span></span>
                  <span className="text-ivory">{formatPrice(pence(i.unit_price) * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-[var(--line-soft)] pt-4">
              <div className="flex justify-between text-smoke"><dt>Delivery ({o.shipping_methods?.[0]?.name})</dt><dd>{pence(o.shipping_total) === 0 ? "Free" : formatPrice(pence(o.shipping_total))}</dd></div>
              <div className="flex justify-between text-[1.15rem] text-ivory"><dt>Total paid</dt><dd>{formatPrice(pence(o.total))}</dd></div>
            </dl>
          </div>
        </>
      )}
      <Link href="/shop" className="btn btn-ghost mt-10">Keep browsing</Link>
    </section>
  );
}
