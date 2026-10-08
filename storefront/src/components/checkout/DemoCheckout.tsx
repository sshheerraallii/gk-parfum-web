"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { useCatalog } from "../CatalogProvider";
import { useOffers } from "@/lib/useOffers";
import { formatPrice } from "@/lib/catalog";
import { priceCart, shippingFor } from "@/lib/offers";
import { ProductVisual } from "../ProductVisual";
import { recordDemoOrder, useAccount } from "@/lib/account";
import { EMAIL, Field, Section, UK_POSTCODE } from "./CheckoutClient";

/**
 * Preview checkout used when the site runs without the shop backend (e.g. the demo link).
 * Same layout and rules as the real one; places a pretend order and takes no payment.
 */
const DEMO_CODES: Record<string, { label: string; pct?: number; freeShip?: boolean }> = {
  WELCOME10: { label: "WELCOME10 — 10% off", pct: 10 },
  FREESHIP: { label: "FREESHIP — free delivery", freeShip: true },
};

export const DEMO_ORDER_KEY = "gk-demo-order";

export function DemoCheckout() {
  const router = useRouter();
  const { lines, clear } = useCart();
  const account = useAccount((st) => st.account);
  const scents = useCatalog();
  const offers = useOffers();
  const [email, setEmail] = useState(account?.email ?? "");
  const [a, setA] = useState(() => {
    const d = account?.addresses[0];
    return {
      first_name: d?.first_name || account?.first_name || "",
      last_name: d?.last_name || account?.last_name || "",
      address_1: d?.address_1 ?? "",
      address_2: d?.address_2 ?? "",
      city: d?.city ?? "",
      postal_code: d?.postal_code ?? "",
      phone: d?.phone || account?.phone || "",
    };
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [ship, setShip] = useState(offers.shipping[0]?.id ?? "");
  const [promo, setPromo] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [placing, setPlacing] = useState(false);

  const items = lines
    .map((l) => ({ l, s: scents.find((x) => x.slug === l.slug) }))
    .filter((x): x is { l: (typeof lines)[number]; s: NonNullable<(typeof x)["s"]> } => !!x.s);
  const t = priceCart(items.map(({ l, s }) => ({ slug: l.slug, qty: l.qty, unit: s.price, sub: l.sub })), offers);
  const pct = codes.reduce((m, c) => Math.max(m, DEMO_CODES[c]?.pct ?? 0), 0);
  const discount = Math.round((t.goods * pct) / 100);
  const afterDiscount = t.goods - discount;
  const shipping = shippingFor(t, ship, offers);
  const shipCost = codes.some((c) => DEMO_CODES[c]?.freeShip) ? 0 : shipping.cost;
  const total = afterDiscount + shipCost;

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!EMAIL.test(email)) e.email = "Enter an email like name@example.com";
    if (!a.first_name.trim()) e.first_name = "Enter your first name";
    if (!a.last_name.trim()) e.last_name = "Enter your last name";
    if (!a.address_1.trim()) e.address_1 = "Enter the first line of your address";
    if (!a.city.trim()) e.city = "Enter your town or city";
    if (!UK_POSTCODE.test(a.postal_code.trim())) e.postal_code = "Enter a UK postcode, like SW1A 1AA";
    if (a.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a phone number so the courier can reach you";
    return e;
  }, [email, a]);
  const ok = !Object.keys(errors).length;
  const err = (k: string) => (touched[k] ? errors[k] : undefined);
  const touch = (k: string) => () => setTouched((x) => ({ ...x, [k]: true }));

  if (!items.length) {
    return (
      <div className="wrap max-w-xl py-24">
        <h1 className="display-l text-ink">Your bag is empty</h1>
        <p className="mt-4 text-ink-soft">Pick 2 scents to save {offers.tiers.discountPct}%, or 3 for free delivery too — then come back here to pay.</p>
        <Link href="/shop" className="btn btn-ink mt-8">Shop all scents</Link>
      </div>
    );
  }

  const applyPromo = () => {
    const c = promo.trim().toUpperCase();
    if (!c) return;
    if (!DEMO_CODES[c]) return setPromoMsg("That code isn't valid. In this preview, try WELCOME10 or FREESHIP.");
    setCodes((x) => (x.includes(c) ? x : [...x, c]));
    setPromo("");
    setPromoMsg(null);
  };

  const place = () => {
    if (!ok) {
      setTouched(Object.fromEntries(Object.keys(errors).map((k) => [k, true])));
      return;
    }
    setPlacing(true);
    const order = {
      id: "demo",
      display_id: Math.floor(1000 + Math.random() * 9000),
      email,
      first_name: a.first_name,
      items: items.map(({ l, s }) => ({ title: s.name, qty: l.qty, unit: s.price, sub: !!l.sub })),
      giftBox: offers.giftBox.enabled,
      saving: t.saving,
      discount,
      shipping: { name: shipping.option.name, cost: shipCost },
      total,
    };
    try {
      sessionStorage.setItem(DEMO_ORDER_KEY, JSON.stringify(order));
    } catch {
      /* storage blocked — the thank-you page shows a generic message */
    }
    recordDemoOrder({
      id: `demo_${order.display_id}`,
      display_id: order.display_id,
      created_at: new Date().toISOString(),
      total: total / 100,
      items: items.map(({ l, s }) => ({ product_title: s.name, quantity: l.qty })),
    });
    clear();
    router.push("/order/demo");
  };

  const summary = (
    <div>
      <ul className="space-y-4">
        {items.map(({ l, s }) => (
          <li key={l.key} className="flex items-center gap-4">
            <div className="relative flex h-16 w-14 shrink-0 items-center justify-center rounded-[8px] border border-[var(--paper-line)] bg-ink">
              <ProductVisual s={s} className="h-14 w-auto max-w-[48px]" />
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-soft px-1 text-[0.72rem] text-paper">{l.qty}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-ink">{s.name}</p>
              <p className="text-[0.85rem] text-ink-soft">{l.sub ? `Delivered every ${offers.subscription.weeks} weeks` : "100 ml"}</p>
            </div>
            <p className="text-ink">{formatPrice(s.price * l.qty)}</p>
          </li>
        ))}
      </ul>

      {offers.giftBox.enabled && (
        <div className="mt-5 flex items-center gap-3 rounded-[12px] border border-[#d9c18b] bg-[#fbf3df] p-3">
          <img src="/brand/gk-crest-112.webp" alt="" aria-hidden className="h-11 w-auto" />
          <p className="flex-1 text-[0.95rem] text-ink">
            <span className="block font-medium">Congratulations — you&apos;ve won a free signature gift box</span>
            <span className="text-[0.85rem] text-ink-soft">It&apos;s included with your order.</span>
          </p>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <label htmlFor="promo" className="sr-only">Discount code</label>
        <input
          id="promo"
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())}
          placeholder="Discount code"
          className="h-12 min-w-0 flex-1 rounded-[10px] border border-[var(--paper-line)] bg-white px-4 uppercase text-ink outline-none placeholder:normal-case placeholder:text-[#a59a8a] focus:border-ink"
        />
        <button type="button" onClick={applyPromo} disabled={!promo.trim()} className="h-12 rounded-[10px] bg-ink-soft px-5 text-paper disabled:opacity-40">Apply</button>
      </div>
      {promoMsg && <p className="mt-2 text-[0.85rem] text-[#b4432f]">{promoMsg}</p>}
      {codes.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {codes.map((c) => (
            <li key={c} className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[0.85rem] text-ink">
              {c}
              <button type="button" aria-label={`Remove ${c}`} className="text-ink-soft hover:text-ink" onClick={() => setCodes((x) => x.filter((y) => y !== c))}>×</button>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-6 space-y-2 border-t border-[var(--paper-line)] pt-5 text-[0.98rem]">
        <div className="flex justify-between text-ink-soft"><dt>Subtotal</dt><dd>{formatPrice(t.subtotal)}</dd></div>
        {t.saving > 0 && <div className="flex justify-between text-[#7a5a1c]"><dt>Bundle &amp; subscription savings</dt><dd>−{formatPrice(t.saving)}</dd></div>}
        {discount > 0 && <div className="flex justify-between text-[#7a5a1c]"><dt>Discount</dt><dd>−{formatPrice(discount)}</dd></div>}
        <div className="flex justify-between text-ink-soft"><dt>Delivery</dt><dd>{shipCost === 0 ? "Free" : formatPrice(shipCost)}</dd></div>
        <div className="flex items-baseline justify-between pt-2 text-ink">
          <dt className="text-[1.15rem]">Total</dt>
          <dd className="font-display text-[2rem] leading-none">{formatPrice(total)}</dd>
        </div>
        <p className="text-[0.82rem] text-ink-soft">Prices include VAT where applicable.</p>
      </dl>
    </div>
  );

  return (
    <div className="grid min-h-[calc(100dvh-100px)] lg:grid-cols-[1.15fr_.85fr]">
      <div className="border-b border-[var(--paper-line)] bg-[#e9e3d6] lg:hidden">
        <button type="button" className="wrap flex h-14 w-full items-center justify-between text-ink" onClick={() => setSummaryOpen((v) => !v)} aria-expanded={summaryOpen}>
          <span>{summaryOpen ? "Hide" : "Show"} order summary</span>
          <span className="font-display text-[1.3rem]">{formatPrice(total)}</span>
        </button>
        {summaryOpen && <div className="wrap pb-6">{summary}</div>}
      </div>

      <div className="wrap max-w-[680px] py-10 lg:ml-auto lg:mr-0 lg:py-14 lg:pr-14">
        <h1 className="sr-only">Checkout</h1>
        <p className="mb-8 rounded-[10px] bg-[#f1e6c8] px-4 py-3 text-[0.9rem] text-[#7a5a1c]">
          Preview checkout — orders here are pretend and no payment is taken.
        </p>

        <Section n={1} title="Your email">
          <Field label="Email" id="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={touch("email")} error={err("email")} placeholder="name@example.com" />
        </Section>

        <Section n={2} title="Where should we send it?">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name" id="first_name" autoComplete="given-name" value={a.first_name} onChange={(e) => setA({ ...a, first_name: e.target.value })} onBlur={touch("first_name")} error={err("first_name")} />
            <Field label="Last name" id="last_name" autoComplete="family-name" value={a.last_name} onChange={(e) => setA({ ...a, last_name: e.target.value })} onBlur={touch("last_name")} error={err("last_name")} />
            <Field className="col-span-2" label="Address" id="address_1" autoComplete="address-line1" value={a.address_1} onChange={(e) => setA({ ...a, address_1: e.target.value })} onBlur={touch("address_1")} error={err("address_1")} placeholder="House number and street" />
            <Field className="col-span-2" label="Flat, suite, etc. (optional)" id="address_2" autoComplete="address-line2" value={a.address_2} onChange={(e) => setA({ ...a, address_2: e.target.value })} />
            <Field label="Town or city" id="city" autoComplete="address-level2" value={a.city} onChange={(e) => setA({ ...a, city: e.target.value })} onBlur={touch("city")} error={err("city")} />
            <Field label="Postcode" id="postal_code" autoComplete="postal-code" value={a.postal_code} onChange={(e) => setA({ ...a, postal_code: e.target.value.toUpperCase() })} onBlur={touch("postal_code")} error={err("postal_code")} />
            <Field className="col-span-2" label="Phone" id="phone" type="tel" autoComplete="tel" inputMode="tel" value={a.phone} onChange={(e) => setA({ ...a, phone: e.target.value })} onBlur={touch("phone")} error={err("phone")} placeholder="For delivery updates only" />
          </div>
          <p className="mt-3 text-[0.85rem] text-ink-soft">We deliver to the United Kingdom.</p>
        </Section>

        <Section n={3} title="Delivery">
          <fieldset>
            <legend className="sr-only">Delivery method</legend>
            <div className="overflow-hidden rounded-[12px] border border-[var(--paper-line)] bg-white">
              {offers.shipping.map((o, i) => {
                const c = shippingFor(t, o.id, offers).cost;
                return (
                  <label key={o.id} className={`flex cursor-pointer items-center gap-4 px-5 py-4 ${i ? "border-t border-[var(--paper-line)]" : ""} ${ship === o.id ? "bg-[#f6f1e6]" : ""}`}>
                    <input type="radio" name="shipping" className="h-5 w-5 accent-[var(--ink)]" checked={ship === o.id} onChange={() => setShip(o.id)} />
                    <span className="flex-1">
                      <span className="block text-ink">{o.name}</span>
                      <span className="text-[0.88rem] text-ink-soft">{o.eta}</span>
                    </span>
                    <span className="text-ink">{c === 0 ? "Free" : formatPrice(c)}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </Section>

        <Section n={4} title="Payment">
          <div className="rounded-[12px] border border-[var(--paper-line)] bg-white p-5">
            <p className="text-ink">Card, Apple Pay, Google Pay, PayPal or Klarna</p>
            <p className="mt-1 text-[0.9rem] text-ink-soft">The secure Stripe payment form appears here on the live shop.</p>
          </div>
          <button type="button" onClick={place} disabled={placing} className="btn btn-ink mt-6 w-full">
            {placing ? "Placing order…" : `Place preview order · ${formatPrice(total)}`}
          </button>
          {!ok && Object.keys(touched).length > 0 && (
            <p className="mt-3 text-[0.92rem] text-[#b4432f]" role="alert">Check the details marked in red above.</p>
          )}
        </Section>
      </div>

      <aside className="hidden border-l border-[var(--paper-line)] bg-[#e9e3d6] lg:block" aria-label="Order summary">
        <div className="sticky top-0 max-w-[480px] px-12 py-14">{summary}</div>
      </aside>
    </div>
  );
}
