"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAccount, type DemoOrder } from "@/lib/account";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";
import { requestPasswordReset, type OrderSummary } from "@/lib/store-client";
import { useCatalog } from "./CatalogProvider";
import { ScentCard } from "./ScentCard";
import { ProductVisual } from "./ProductVisual";

const input =
  "h-12 w-full rounded-[10px] border border-[var(--line)] bg-[#081440]/50 px-4 text-ivory placeholder:text-[#8d98bb] focus:border-gilt focus:outline-none";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field(p: React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  const { label, id, ...rest } = p;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.9rem] text-smoke">{label}</label>
      <input id={id} className={input} {...rest} />
    </div>
  );
}

function SignIn() {
  const { login, register, demo } = useAccount();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [f, setF] = useState({ email: "", password: "", first_name: "", last_name: "", marketing: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  const go = () => router.push(next && next.startsWith("/") ? next : "/account");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!EMAIL.test(f.email)) return setErr("Enter an email like name@example.com");
    if (mode === "reset") {
      setBusy(true);
      await requestPasswordReset(f.email).catch(() => {});
      setBusy(false);
      setNote("If there's an account for that email, we've sent a link to reset the password.");
      return;
    }
    if (f.password.length < 8) return setErr("Passwords are at least 8 characters.");
    if (mode === "up" && (!f.first_name.trim() || !f.last_name.trim())) return setErr("Add your first and last name.");
    setBusy(true);
    try {
      if (mode === "in") await login(f.email, f.password);
      else await register(f);
      go();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="wrap grid gap-14 py-16 md:py-24 lg:grid-cols-[1fr_1fr]">
      <div>
        <h1 className="display-xl">{mode === "up" ? "Create your account" : mode === "reset" ? "Reset your password" : "Sign in"}</h1>
        <p className="lede mt-5">
          {mode === "up"
            ? "Save your bag across devices, keep a wishlist, reorder in two taps and track every order."
            : "Welcome back. Your saved bag and wishlist are waiting."}
        </p>
        <ul className="mt-8 space-y-3 text-smoke">
          {["Your bag is saved — pick up on any device", "Wishlist your favourites with one tap", "See every order and reorder fast", "Addresses saved for quicker checkout"].map((t) => (
            <li key={t} className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rotate-45 bg-gilt" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
        {demo && (
          <p className="small mt-8 max-w-[46ch] rounded-[10px] bg-[#081440]/50 p-4 text-champagne">
            Preview site: accounts here are saved in this browser only, so you can try every screen. On the live shop they&apos;re real accounts.
          </p>
        )}
      </div>

      <div className="rounded-[var(--radius-m)] border border-[var(--line)] bg-ebony/60 p-6 md:p-8">
        {mode !== "reset" && (
          <div role="tablist" className="mb-6 grid grid-cols-2 rounded-full bg-[#081440]/60 p-1">
            {(["in", "up"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                type="button"
                aria-selected={mode === m}
                onClick={() => { setMode(m); setErr(""); }}
                className={`h-10 rounded-full transition-colors ${mode === m ? "bg-ivory text-velvet" : "text-smoke hover:text-ivory"}`}
              >
                {m === "in" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4" noValidate>
          {mode === "up" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="fn" label="First name" autoComplete="given-name" value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} />
              <Field id="ln" label="Last name" autoComplete="family-name" value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} />
            </div>
          )}
          <Field id="em" label="Email" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          {mode !== "reset" && (
            <Field
              id="pw"
              label={mode === "up" ? "Password (8+ characters)" : "Password"}
              type="password"
              autoComplete={mode === "up" ? "new-password" : "current-password"}
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
            />
          )}
          {mode === "up" && (
            <label className="flex cursor-pointer items-center gap-3 text-[0.95rem] text-smoke">
              <input type="checkbox" className="h-5 w-5 accent-[var(--gilt)]" checked={f.marketing} onChange={(e) => setF({ ...f, marketing: e.target.checked })} />
              Email me new scents and offers
            </label>
          )}
          {err && <p className="text-[0.9rem] text-[#ffb4a6]" role="alert">{err}</p>}
          {note && <p className="text-[0.9rem] text-champagne" role="status">{note}</p>}
          <button type="submit" disabled={busy} className="btn btn-gold w-full">
            {busy ? "One moment…" : mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}
          </button>
        </form>
        <div className="mt-5 text-center text-[0.92rem] text-smoke">
          {mode === "in" && !demo && (
            <button type="button" onClick={() => setMode("reset")} className="underline-offset-4 hover:text-ivory hover:underline">Forgot your password?</button>
          )}
          {mode === "reset" && (
            <button type="button" onClick={() => { setMode("in"); setNote(""); }} className="underline-offset-4 hover:text-ivory hover:underline">Back to sign in</button>
          )}
        </div>
      </div>
    </section>
  );
}

type Tab = "orders" | "wishlist" | "bag" | "addresses" | "details";

function Dashboard() {
  const acc = useAccount();
  const a = acc.account!;
  const scents = useCatalog();
  const { lines, setOpen, add } = useCart();
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<(OrderSummary | DemoOrder)[] | null>(null);
  const [addr, setAddr] = useState({ first_name: a.first_name, last_name: a.last_name, address_1: "", address_2: "", city: "", postal_code: "", phone: a.phone });
  const [showAddr, setShowAddr] = useState(false);
  const [details, setDetails] = useState({ first_name: a.first_name, last_name: a.last_name, phone: a.phone, marketing: a.marketing });
  const [saved, setSaved] = useState("");

  useEffect(() => {
    acc.orders().then(setOrders).catch(() => setOrders([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wish = a.wishlist.map((slug) => scents.find((s) => s.slug === slug)).filter((s): s is NonNullable<typeof s> => !!s);
  const TABS: { id: Tab; label: string }[] = [
    { id: "orders", label: "Orders" },
    { id: "wishlist", label: `Wishlist (${wish.length})` },
    { id: "bag", label: `Saved bag (${lines.reduce((x, l) => x + l.qty, 0)})` },
    { id: "addresses", label: "Addresses" },
    { id: "details", label: "Your details" },
  ];

  return (
    <section className="wrap py-14 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-smoke">Your account</p>
          <h1 className="display-xl mt-1">Hello{a.first_name ? `, ${a.first_name}` : ""}</h1>
        </div>
        <button type="button" onClick={acc.logout} className="btn btn-ghost">Sign out</button>
      </div>
      {acc.demo && <p className="small mt-4 text-champagne">Preview account — saved in this browser only.</p>}

      <div role="tablist" className="no-scrollbar -mx-[var(--gutter)] mt-10 flex gap-2 overflow-x-auto px-[var(--gutter)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`h-11 shrink-0 rounded-full px-5 transition-colors ${tab === t.id ? "bg-ivory text-velvet" : "border border-[var(--line)] text-ivory hover:border-gilt"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {tab === "orders" &&
          (orders === null ? (
            <p className="text-smoke" role="status">Loading your orders…</p>
          ) : orders.length === 0 ? (
            <div className="rounded-[var(--radius-m)] border border-dashed border-[var(--line)] p-10">
              <p className="display-m">No orders yet</p>
              <p className="mt-2 text-smoke">When you order, it&apos;ll appear here with its status.</p>
              <Link href="/bundle" className="btn btn-gold mt-6">Build your bundle</Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--line-soft)] rounded-[var(--radius-m)] border border-[var(--line)]">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-ivory">Order #{o.display_id}</p>
                    <p className="small text-smoke">
                      {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
                      {o.items.map((i) => `${i.quantity} × ${i.product_title}`).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-ivory">{formatPrice(Math.round(Number(o.total) * 100))}</p>
                    {"fulfillment_status" in o && <p className="small capitalize text-champagne">{String(o.fulfillment_status).replace(/_/g, " ")}</p>}
                  </div>
                </li>
              ))}
            </ul>
          ))}

        {tab === "wishlist" &&
          (wish.length === 0 ? (
            <div className="rounded-[var(--radius-m)] border border-dashed border-[var(--line)] p-10">
              <p className="display-m">Nothing saved yet</p>
              <p className="mt-2 text-smoke">Tap the heart on any scent to keep it here.</p>
              <Link href="/shop" className="btn btn-ghost mt-6">Browse scents</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
              {wish.map((s) => <ScentCard key={s.slug} s={s} />)}
            </div>
          ))}

        {tab === "bag" && (
          <div className="max-w-2xl">
            <p className="text-smoke">Your bag is saved to your account, so it&apos;s here on any device you sign in on.</p>
            {lines.length === 0 ? (
              <Link href="/bundle" className="btn btn-gold mt-6">Build your bundle</Link>
            ) : (
              <>
                <ul className="mt-6 divide-y divide-[var(--line-soft)] rounded-[var(--radius-m)] border border-[var(--line)]">
                  {lines.map((l) => {
                    const s = scents.find((x) => x.slug === l.slug);
                    if (!s) return null;
                    return (
                      <li key={l.key} className="flex items-center gap-4 p-4">
                        <ProductVisual s={s} className="h-14 w-auto max-w-[40px]" />
                        <p className="flex-1 text-ivory">{s.name}{l.sub && <span className="small ml-2 text-champagne">every 4 weeks</span>}</p>
                        <p className="text-smoke">× {l.qty}</p>
                      </li>
                    );
                  })}
                </ul>
                <button type="button" onClick={() => setOpen(true)} className="btn btn-gold mt-6">Open bag</button>
              </>
            )}
          </div>
        )}

        {tab === "addresses" && (
          <div className="max-w-2xl space-y-4">
            {a.addresses.length === 0 && !showAddr && <p className="text-smoke">No saved addresses yet.</p>}
            {a.addresses.map((x) => (
              <div key={x.id} className="flex items-start justify-between gap-4 rounded-[var(--radius-m)] border border-[var(--line)] p-5">
                <address className="not-italic text-ivory">
                  {x.first_name} {x.last_name}<br />{x.address_1}{x.address_2 ? `, ${x.address_2}` : ""}<br />{x.city} {x.postal_code}
                </address>
                <button type="button" onClick={() => acc.removeAddress(x.id)} className="small text-smoke underline-offset-4 hover:text-ivory hover:underline">Remove</button>
              </div>
            ))}
            {showAddr ? (
              <form
                className="grid gap-4 rounded-[var(--radius-m)] border border-[var(--line)] p-5 sm:grid-cols-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!addr.address_1 || !addr.city || !addr.postal_code) return;
                  await acc.addAddress(addr);
                  setShowAddr(false);
                }}
              >
                <Field id="a-fn" label="First name" value={addr.first_name} onChange={(e) => setAddr({ ...addr, first_name: e.target.value })} />
                <Field id="a-ln" label="Last name" value={addr.last_name} onChange={(e) => setAddr({ ...addr, last_name: e.target.value })} />
                <div className="sm:col-span-2"><Field id="a-1" label="Address" autoComplete="address-line1" value={addr.address_1} onChange={(e) => setAddr({ ...addr, address_1: e.target.value })} /></div>
                <div className="sm:col-span-2"><Field id="a-2" label="Flat, suite, etc. (optional)" autoComplete="address-line2" value={addr.address_2} onChange={(e) => setAddr({ ...addr, address_2: e.target.value })} /></div>
                <Field id="a-c" label="Town or city" autoComplete="address-level2" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
                <Field id="a-p" label="Postcode" autoComplete="postal-code" value={addr.postal_code} onChange={(e) => setAddr({ ...addr, postal_code: e.target.value.toUpperCase() })} />
                <div className="flex gap-3 sm:col-span-2">
                  <button type="submit" className="btn btn-gold">Save address</button>
                  <button type="button" onClick={() => setShowAddr(false)} className="btn btn-ghost">Cancel</button>
                </div>
              </form>
            ) : (
              <button type="button" onClick={() => setShowAddr(true)} className="btn btn-ghost">Add an address</button>
            )}
          </div>
        )}

        {tab === "details" && (
          <form
            className="grid max-w-2xl gap-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await acc.saveProfile(details);
              setSaved("Saved.");
              setTimeout(() => setSaved(""), 2500);
            }}
          >
            <Field id="d-fn" label="First name" value={details.first_name} onChange={(e) => setDetails({ ...details, first_name: e.target.value })} />
            <Field id="d-ln" label="Last name" value={details.last_name} onChange={(e) => setDetails({ ...details, last_name: e.target.value })} />
            <Field id="d-em" label="Email" value={a.email} disabled />
            <Field id="d-ph" label="Phone" type="tel" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} />
            <label className="flex cursor-pointer items-center gap-3 text-smoke sm:col-span-2">
              <input type="checkbox" className="h-5 w-5 accent-[var(--gilt)]" checked={details.marketing} onChange={(e) => setDetails({ ...details, marketing: e.target.checked })} />
              Email me new scents and offers
            </label>
            <div className="flex items-center gap-4 sm:col-span-2">
              <button type="submit" className="btn btn-gold">Save details</button>
              {saved && <span className="text-champagne" role="status">{saved}</span>}
            </div>
          </form>
        )}
      </div>

      {/* quick reorder from wishlist when the bag is empty */}
      {lines.length === 0 && wish.length > 0 && tab !== "wishlist" && (
        <div className="mt-16 rounded-[var(--radius-m)] border border-[var(--line)] p-6">
          <p className="text-ivory">From your wishlist</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {wish.slice(0, 4).map((s) => (
              <button key={s.slug} type="button" onClick={() => add(s.slug)} className="small h-9 rounded-full border border-[var(--line)] px-4 text-ivory hover:border-gilt">
                Add {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Inner() {
  const { account, ready } = useAccount();
  if (!ready) return <p className="wrap py-24 text-smoke" role="status">Loading…</p>;
  return account ? <Dashboard /> : <SignIn />;
}

export function AccountClient() {
  return (
    <Suspense fallback={<p className="wrap py-24 text-smoke">Loading…</p>}>
      <Inner />
    </Suspense>
  );
}
