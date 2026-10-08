"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useOffers } from "@/lib/useOffers";
import { useAccount } from "@/lib/account";
import { formatPrice } from "@/lib/catalog";

const NAV = [
  { href: "/shop/men", label: "For him" },
  { href: "/shop/women", label: "For her" },
  { href: "/shop/unisex", label: "Unisex" },
  { href: "/bundle", label: "Build your bundle" },
  { href: "/reviews", label: "Reviews" },
];

function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 8h14l-1 12H6L5 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8.5" r="3.8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Announcement() {
  const offers = useOffers();
  const items = [
    offers.giftBox.enabled ? "Free signature gift box with every order" : null,
    offers.freeDelivery.enabled ? `Free UK delivery over ${formatPrice(offers.freeDelivery.threshold)}` : null,
    offers.tiers.enabled ? `Save ${offers.tiers.discountPct}% on ${offers.tiers.discountQty}+ bottles` : null,
    "Vegan friendly · Made in the UK",
  ].filter(Boolean) as string[];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 3800);
    return () => clearInterval(t);
  }, [items.length]);
  return (
    <div className="border-b border-[var(--line-soft)] bg-[#081440] text-center">
      {/* phones: one message at a time; wider screens: all of them */}
      <div className="wrap flex h-9 items-center justify-center text-[0.82rem] tracking-[0.02em] text-champagne md:hidden" aria-live="off">
        <span key={i} className="animate-[rise_.5s_ease_both]">{items[i]}</span>
      </div>
      <ul className="wrap hidden h-9 items-center justify-center gap-10 text-[0.82rem] tracking-[0.02em] text-champagne md:flex">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

export function Header() {
  const count = useCart((s) => s.lines.reduce((a, l) => a + l.qty, 0));
  const setOpen = useCart((s) => s.setOpen);
  const account = useAccount((s) => s.account);
  const [menu, setMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 transition-[background-color,border-color] duration-300"
      style={{
        background: scrolled ? "rgba(10,26,72,.9)" : "rgba(10,26,72,0)",
        backdropFilter: scrolled ? "blur(14px) saturate(1.2)" : "none",
        borderBottom: `1px solid ${scrolled ? "var(--line-soft)" : "transparent"}`,
      }}
    >
      <div className="wrap flex h-[72px] items-center justify-between gap-4">
        <button
          type="button"
          className="-ml-2 flex h-11 w-11 items-center justify-center lg:hidden"
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
          onClick={() => setMenu((v) => !v)}
        >
          <span className="relative block h-3 w-6">
            <span className={`absolute left-0 top-0 h-px w-6 bg-ivory transition-transform ${menu ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`absolute bottom-0 left-0 h-px w-6 bg-ivory transition-transform ${menu ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </span>
        </button>

        <Link href="/" aria-label="GK Parfum home" className="flex items-center gap-3">
          <img src="/brand/gk-crest-112.webp" alt="" aria-hidden className="h-[54px] w-auto" width={112} height={118} />
          <img src="/brand/gk-wordmark-foil-transparent.svg" alt="GK Parfum" className="hidden h-[34px] w-auto sm:block" width={134} height={34} />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-8 text-[0.98rem]">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className={`relative py-2 transition-colors hover:text-champagne ${path?.startsWith(n.href) ? "text-champagne" : "text-ivory"}`}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="-mr-2 flex items-center">
          <Link href="/search" className="hidden h-11 w-11 items-center justify-center text-ivory hover:text-champagne sm:flex" aria-label="Search scents">
            <SearchIcon />
          </Link>
          <Link
            href="/account"
            className="flex h-11 w-11 items-center justify-center text-ivory hover:text-champagne"
            aria-label={mounted && account ? `Your account, ${account.first_name || account.email}` : "Sign in or create an account"}
          >
            <PersonIcon />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative flex h-11 items-center gap-2 rounded-full px-3 text-ivory hover:text-champagne"
            aria-label={`Open bag, ${mounted ? count : 0} items`}
          >
            <BagIcon />
            <span className="hidden text-[0.95rem] sm:inline">Bag</span>
            {mounted && count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gilt px-1.5 text-[0.72rem] font-semibold text-[#0a1a48]">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      <div
        className={`overflow-hidden border-t border-[var(--line-soft)] bg-velvet transition-[max-height] duration-500 lg:hidden ${menu ? "max-h-[520px]" : "max-h-0 border-transparent"}`}
      >
        <nav aria-label="Mobile" className="wrap py-4">
          <ul className="flex flex-col">
            {[...NAV, { href: "/shop", label: "All scents" }, { href: "/account", label: "My account" }, { href: "/search", label: "Search" }].map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="display-m block border-b border-[var(--line-soft)] py-3 text-ivory">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
