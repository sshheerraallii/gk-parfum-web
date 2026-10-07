"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js/pure";
import type { Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useCart } from "@/lib/cart";
import { useCatalog } from "../CatalogProvider";
import { useOffers } from "@/lib/useOffers";
import { formatPrice } from "@/lib/catalog";
import {
  addPromo,
  backendReady,
  completeCart,
  ensureCart,
  regionPaymentProviders,
  removePromo,
  setShipping,
  shippingOptions,
  startPayment,
  syncCart,
  updateCart,
  type MCart,
  type ShippingOption,
} from "@/lib/store-client";
import { ProductVisual } from "../ProductVisual";

const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_KEY ?? "";
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => (STRIPE_KEY ? (stripePromise ??= loadStripe(STRIPE_KEY)) : null);

const pence = (pounds: number | undefined | null) => Math.round(Number(pounds ?? 0) * 100);

type Address = {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  postal_code: string;
  phone: string;
};
const EMPTY: Address = { first_name: "", last_name: "", address_1: "", address_2: "", city: "", postal_code: "", phone: "" };

const UK_POSTCODE = /^([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}|GIR ?0A{2})$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({
  label,
  id,
  error,
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; error?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[0.9rem] text-ink-soft">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`h-[52px] w-full rounded-[10px] border bg-white px-4 text-[1.02rem] text-ink outline-none transition-colors placeholder:text-[#a59a8a] focus:border-ink ${error ? "border-[#b4432f]" : "border-[var(--paper-line)]"}`}
        {...rest}
      />
      {error && (
        <p id={`${id}-err`} className="mt-1 text-[0.85rem] text-[#b4432f]">
          {error}
        </p>
      )}
    </div>
  );
}

function Section({ n, title, children, muted }: { n: number; title: string; children: React.ReactNode; muted?: boolean }) {
  return (
    <section className={`border-t border-[var(--paper-line)] py-8 first:border-t-0 first:pt-0 ${muted ? "opacity-50" : ""}`} aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="mb-5 flex items-baseline gap-3 font-display text-[1.7rem] leading-none text-ink">
        <span className="text-[1rem] text-ink-soft" aria-hidden>{n}.</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CheckoutClient() {
  const router = useRouter();
  const { lines, giftBoxes, clear } = useCart();
  const scents = useCatalog();
  const offers = useOffers();
  const [mounted, setMounted] = useState(false);
  const [cart, setCart] = useState<MCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatal, setFatal] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [addr, setAddr] = useState<Address>(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [optionId, setOptionId] = useState<string | null>(null);
  const [promo, setPromo] = useState("");
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const addrSaved = useRef<string>("");

  useEffect(() => setMounted(true), []);

  // 1. make sure a server cart exists and holds exactly what's in the bag
  useEffect(() => {
    if (!mounted) return;
    if (!backendReady()) {
      setFatal("Checkout isn't connected to the shop backend yet. Set NEXT_PUBLIC_MEDUSA_BACKEND_URL and the publishable key.");
      setLoading(false);
      return;
    }
    if (!lines.length) {
      setLoading(false);
      return;
    }
    let live = true;
    (async () => {
      try {
        const c = await ensureCart();
        const mapped = lines
          .map((l) => ({ variant_id: scents.find((s) => s.slug === l.slug)?.variantId ?? "", quantity: l.qty }))
          .filter((l) => l.variant_id);
        const synced = await syncCart(c.id, mapped, giftBoxes);
        if (!live) return;
        setCart(synced);
        if (synced.email) setEmail(synced.email);
        const sa = synced.shipping_address;
        if (sa?.address_1) {
          const a = { ...EMPTY, ...Object.fromEntries(Object.entries(sa).filter(([k]) => k in EMPTY).map(([k, v]) => [k, v ?? ""])) } as Address;
          setAddr(a);
        }
        setProviders(await regionPaymentProviders());
      } catch (e) {
        if (live) setFatal(e instanceof Error ? e.message : "Something went wrong loading your bag.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [mounted, lines, giftBoxes, scents]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!EMAIL.test(email)) e.email = "Enter an email like name@example.com";
    if (!addr.first_name.trim()) e.first_name = "Enter your first name";
    if (!addr.last_name.trim()) e.last_name = "Enter your last name";
    if (!addr.address_1.trim()) e.address_1 = "Enter the first line of your address";
    if (!addr.city.trim()) e.city = "Enter your town or city";
    if (!UK_POSTCODE.test(addr.postal_code.trim())) e.postal_code = "Enter a UK postcode, like SW1A 1AA";
    if (addr.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a phone number so the courier can reach you";
    return e;
  }, [email, addr]);
  const addressOk = !Object.keys(errors).length;
  const showErr = (k: string) => (touched[k] ? errors[k] : undefined);

  // 2. save contact + address once valid, then load delivery options
  useEffect(() => {
    if (!cart || !addressOk) return;
    const payload = JSON.stringify({ email, addr, marketing });
    if (payload === addrSaved.current) return;
    const t = setTimeout(async () => {
      try {
        addrSaved.current = payload;
        const shipping_address = { ...addr, postal_code: addr.postal_code.toUpperCase().trim(), country_code: "gb" };
        const c = await updateCart(cart.id, {
          email,
          shipping_address,
          billing_address: shipping_address,
          metadata: { marketing_opt_in: marketing },
        });
        setCart(c);
        const opts = await shippingOptions(cart.id);
        setOptions(opts);
        const chosen = c.shipping_methods?.[0]?.shipping_option_id ?? opts[0]?.id;
        if (chosen && !c.shipping_methods?.length) {
          setCart(await setShipping(cart.id, chosen));
        }
        setOptionId(chosen ?? null);
      } catch (e) {
        addrSaved.current = "";
        setPayError(e instanceof Error ? e.message : "Couldn't save your address.");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [cart, addressOk, email, addr, marketing]);

  const stripeOn = !!STRIPE_KEY && providers.includes("pp_stripe_stripe");
  const readyToPay = !!cart && addressOk && !!optionId && !!cart.shipping_methods?.length;

  // 3. (re)start the payment session whenever the amount changes
  const total = cart?.total;
  useEffect(() => {
    if (!readyToPay || !cart || !stripeOn) return;
    let live = true;
    startPayment(cart.id, "pp_stripe_stripe")
      .then((s) => live && setClientSecret((s?.data?.client_secret as string) ?? null))
      .catch((e) => live && setPayError(e.message));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToPay, stripeOn, total]);

  const chooseOption = async (id: string) => {
    if (!cart) return;
    setOptionId(id);
    try {
      setCart(await setShipping(cart.id, id));
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Couldn't set delivery.");
    }
  };

  const applyPromo = async () => {
    if (!cart || !promo.trim()) return;
    setPromoMsg(null);
    try {
      const c = await addPromo(cart.id, promo.trim().toUpperCase());
      if (!c.promotions?.some((p) => p.code.toUpperCase() === promo.trim().toUpperCase())) {
        setPromoMsg("That code isn't valid for this order.");
      } else {
        setPromo("");
      }
      setCart(c);
    } catch (e) {
      setPromoMsg(e instanceof Error ? e.message : "That code isn't valid.");
    }
  };

  const finish = useCallback(
    async (cartId: string) => {
      const order = await completeCart(cartId);
      clear();
      router.push(`/order/${order.id}`);
    },
    [clear, router]
  );

  const placeTestOrder = async () => {
    if (!cart) return;
    setPlacing(true);
    setPayError(null);
    try {
      await startPayment(cart.id, "pp_system_default");
      await finish(cart.id);
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Couldn't place the order.");
      setPlacing(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="wrap py-24 text-center text-ink-soft" role="status">
        Getting your bag ready…
      </div>
    );
  }

  if (fatal) {
    return (
      <div className="wrap max-w-xl py-24">
        <h1 className="display-l text-ink">Checkout</h1>
        <p className="mt-4 text-ink-soft">{fatal}</p>
        <Link href="/shop" className="btn btn-ink mt-8">Back to the shop</Link>
      </div>
    );
  }

  if (!lines.length || !cart || !cart.items?.length) {
    return (
      <div className="wrap max-w-xl py-24">
        <h1 className="display-l text-ink">Your bag is empty</h1>
        <p className="mt-4 text-ink-soft">Add a scent — or any three for {formatPrice(offers.bundle.price)} — and come back here to pay.</p>
        <Link href="/shop" className="btn btn-ink mt-8">Shop all scents</Link>
      </div>
    );
  }

  const bundleSaving = cart.items.reduce((a, i) => {
    if (!i.metadata?.gk_bundle) return a;
    const s = scents.find((x) => x.variantId === i.variant_id);
    return a + (s ? (s.price - pence(i.unit_price)) * i.quantity : 0);
  }, 0);

  const summary = (
    <div>
      <ul className="space-y-4">
        {cart.items.map((i) => {
          const s = scents.find((x) => x.variantId === i.variant_id);
          return (
            <li key={i.id} className="flex items-center gap-4">
              <div className="relative flex h-16 w-14 shrink-0 items-center justify-center rounded-[8px] border border-[var(--paper-line)] bg-ink">
                {s ? <ProductVisual s={s} className="h-14 w-auto max-w-[48px]" /> : <span className="font-display text-champagne">GK</span>}
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-soft px-1 text-[0.72rem] text-paper">{i.quantity}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-ink">{i.product_title}</p>
                <p className="text-[0.85rem] text-ink-soft">
                  {i.metadata?.gk_bundle ? String(i.metadata.gk_bundle) : i.metadata?.gk_gift_box ? "Gift box" : "100 ml"}
                </p>
              </div>
              <p className="text-ink">{formatPrice(pence(i.unit_price) * i.quantity)}</p>
            </li>
          );
        })}
      </ul>

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
        <button type="button" onClick={applyPromo} disabled={!promo.trim()} className="h-12 rounded-[10px] bg-ink-soft px-5 text-paper disabled:opacity-40">
          Apply
        </button>
      </div>
      {promoMsg && <p className="mt-2 text-[0.85rem] text-[#b4432f]">{promoMsg}</p>}
      {cart.promotions?.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {cart.promotions.map((p) => (
            <li key={p.code} className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[0.85rem] text-ink">
              {p.code}
              <button type="button" aria-label={`Remove ${p.code}`} className="text-ink-soft hover:text-ink" onClick={async () => setCart(await removePromo(cart.id, p.code))}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-6 space-y-2 border-t border-[var(--paper-line)] pt-5 text-[0.98rem]">
        <div className="flex justify-between text-ink-soft"><dt>Subtotal</dt><dd>{formatPrice(pence(cart.item_subtotal) + bundleSaving)}</dd></div>
        {bundleSaving > 0 && (
          <div className="flex justify-between text-[#6d5a2b]"><dt>{offers.bundle.label}</dt><dd>−{formatPrice(bundleSaving)}</dd></div>
        )}
        {pence(cart.discount_total) > 0 && (
          <div className="flex justify-between text-[#6d5a2b]"><dt>Discount</dt><dd>−{formatPrice(pence(cart.discount_total))}</dd></div>
        )}
        <div className="flex justify-between text-ink-soft">
          <dt>Delivery</dt>
          <dd>{cart.shipping_methods?.length ? (pence(cart.shipping_total) === 0 ? "Free" : formatPrice(pence(cart.shipping_total))) : "Add your address"}</dd>
        </div>
        <div className="flex items-baseline justify-between pt-2 text-ink">
          <dt className="text-[1.15rem]">Total</dt>
          <dd className="font-display text-[2rem] leading-none">{formatPrice(pence(cart.total))}</dd>
        </div>
        <p className="text-[0.82rem] text-ink-soft">Prices include VAT where applicable.</p>
      </dl>
    </div>
  );

  return (
    <div className="grid min-h-[calc(100dvh-100px)] lg:grid-cols-[1.15fr_.85fr]">
      {/* mobile summary toggle */}
      <div className="border-b border-[var(--paper-line)] bg-[#e8dfcc] lg:hidden">
        <button type="button" className="wrap flex h-14 w-full items-center justify-between text-ink" onClick={() => setSummaryOpen((v) => !v)} aria-expanded={summaryOpen}>
          <span>{summaryOpen ? "Hide" : "Show"} order summary</span>
          <span className="font-display text-[1.3rem]">{formatPrice(pence(cart.total))}</span>
        </button>
        {summaryOpen && <div className="wrap pb-6">{summary}</div>}
      </div>

      <div className="wrap max-w-[680px] py-10 lg:ml-auto lg:mr-0 lg:py-14 lg:pr-14">
        <h1 className="sr-only">Checkout</h1>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(Object.fromEntries(Object.keys(EMPTY).concat("email").map((k) => [k, true])));
          }}
        >
          <Section n={1} title="Your email">
            <Field label="Email" id="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} error={showErr("email")} placeholder="name@example.com" />
            <label className="mt-3 flex cursor-pointer items-center gap-3 text-[0.95rem] text-ink-soft">
              <input type="checkbox" className="h-5 w-5 accent-[var(--ink)]" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
              Email me new scents and offers
            </label>
          </Section>

          <Section n={2} title="Where should we send it?">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name" id="first_name" autoComplete="given-name" value={addr.first_name} onChange={(e) => setAddr({ ...addr, first_name: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, first_name: true }))} error={showErr("first_name")} />
              <Field label="Last name" id="last_name" autoComplete="family-name" value={addr.last_name} onChange={(e) => setAddr({ ...addr, last_name: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, last_name: true }))} error={showErr("last_name")} />
              <Field className="col-span-2" label="Address" id="address_1" autoComplete="address-line1" value={addr.address_1} onChange={(e) => setAddr({ ...addr, address_1: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, address_1: true }))} error={showErr("address_1")} placeholder="House number and street" />
              <Field className="col-span-2" label="Flat, suite, etc. (optional)" id="address_2" autoComplete="address-line2" value={addr.address_2} onChange={(e) => setAddr({ ...addr, address_2: e.target.value })} />
              <Field label="Town or city" id="city" autoComplete="address-level2" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, city: true }))} error={showErr("city")} />
              <Field label="Postcode" id="postal_code" autoComplete="postal-code" value={addr.postal_code} onChange={(e) => setAddr({ ...addr, postal_code: e.target.value.toUpperCase() })} onBlur={() => setTouched((t) => ({ ...t, postal_code: true }))} error={showErr("postal_code")} />
              <Field className="col-span-2" label="Phone" id="phone" type="tel" autoComplete="tel" inputMode="tel" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, phone: true }))} error={showErr("phone")} placeholder="For delivery updates only" />
            </div>
            <p className="mt-3 text-[0.85rem] text-ink-soft">We deliver to the United Kingdom.</p>
          </Section>

          <Section n={3} title="Delivery" muted={!addressOk}>
            {!addressOk ? (
              <p className="text-ink-soft">Fill in your address to see delivery options.</p>
            ) : !options.length ? (
              <p className="text-ink-soft" role="status">Finding delivery options…</p>
            ) : (
              <fieldset>
                <legend className="sr-only">Delivery method</legend>
                <div className="overflow-hidden rounded-[12px] border border-[var(--paper-line)] bg-white">
                  {options.map((o, i) => (
                    <label key={o.id} className={`flex cursor-pointer items-center gap-4 px-5 py-4 ${i ? "border-t border-[var(--paper-line)]" : ""} ${optionId === o.id ? "bg-[#f7f2e7]" : ""}`}>
                      <input type="radio" name="shipping" className="h-5 w-5 accent-[var(--ink)]" checked={optionId === o.id} onChange={() => chooseOption(o.id)} />
                      <span className="flex-1">
                        <span className="block text-ink">{o.name}</span>
                        <span className="text-[0.88rem] text-ink-soft">{o.type?.description}</span>
                      </span>
                      <span className="text-ink">{pence(o.amount) === 0 ? "Free" : formatPrice(pence(o.amount))}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </Section>

          <Section n={4} title="Payment" muted={!readyToPay}>
            {!readyToPay ? (
              <p className="text-ink-soft">Choose delivery first.</p>
            ) : stripeOn ? (
              clientSecret ? (
                <Elements
                  key={clientSecret}
                  stripe={getStripe()}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                      variables: { colorPrimary: "#1d1813", colorText: "#1d1813", fontFamily: "Jost, system-ui, sans-serif", borderRadius: "10px", colorBackground: "#ffffff" },
                    },
                  }}
                >
                  <StripePay cart={cart} onDone={finish} name={`${addr.first_name} ${addr.last_name}`} email={email} />
                </Elements>
              ) : (
                <p className="text-ink-soft" role="status">Loading secure payment…</p>
              )
            ) : (
              <div>
                <div className="rounded-[12px] border border-dashed border-[var(--paper-line)] bg-white p-5 text-[0.95rem] text-ink-soft">
                  Test mode: card payments switch on when the Stripe keys are added. Placing an order now records it in the admin without taking payment.
                </div>
                <button type="button" onClick={placeTestOrder} disabled={placing} className="btn btn-ink mt-6 w-full">
                  {placing ? "Placing order…" : `Place test order · ${formatPrice(pence(cart.total))}`}
                </button>
              </div>
            )}
            {payError && (
              <p className="mt-4 text-[0.92rem] text-[#b4432f]" role="alert">
                {payError}
              </p>
            )}
          </Section>
        </form>

        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--paper-line)] pt-6 text-[0.85rem] text-ink-soft">
          <li><Link href="/returns" className="underline-offset-4 hover:underline">Returns</Link></li>
          <li><Link href="/delivery" className="underline-offset-4 hover:underline">Delivery</Link></li>
          <li><Link href="/privacy" className="underline-offset-4 hover:underline">Privacy</Link></li>
          <li><Link href="/terms" className="underline-offset-4 hover:underline">Terms</Link></li>
        </ul>
      </div>

      <aside className="hidden border-l border-[var(--paper-line)] bg-[#e8dfcc] lg:block" aria-label="Order summary">
        <div className="sticky top-0 max-w-[480px] px-12 py-14">{summary}</div>
      </aside>
    </div>
  );
}

function StripePay({ cart, onDone, name, email }: { cart: MCart; onDone: (id: string) => Promise<void>; name: string; email: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pay = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setErr(null);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/checkout/return?cart=${cart.id}`,
        payment_method_data: { billing_details: { name, email } },
      },
    });
    if (error) {
      setErr(error.message ?? "Your payment didn't go through. Try another card.");
      setBusy(false);
      return;
    }
    if (paymentIntent && ["succeeded", "requires_capture", "processing"].includes(paymentIntent.status)) {
      try {
        await onDone(cart.id);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Payment taken but the order didn't save — contact us and we'll sort it.");
        setBusy(false);
      }
    }
  };

  return (
    <div>
      <PaymentElement options={{ layout: { type: "accordion", defaultCollapsed: false, radios: "always", spacedAccordionItems: true }, wallets: { applePay: "auto", googlePay: "auto" } }} />
      <button type="button" onClick={pay} disabled={!stripe || busy} className="btn btn-ink mt-6 w-full">
        {busy ? "Paying…" : `Pay ${formatPrice(Math.round(cart.total * 100))}`}
      </button>
      {err && <p className="mt-3 text-[0.92rem] text-[#b4432f]" role="alert">{err}</p>}
      <p className="mt-3 flex items-center justify-center gap-2 text-[0.82rem] text-ink-soft">
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden><path d="M6 10V8a6 6 0 1 1 12 0v2m-13 0h14v11H5V10Z" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
        Secure payment by Stripe. We never see your card details.
      </p>
    </div>
  );
}
