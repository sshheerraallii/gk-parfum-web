"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useOffers } from "@/lib/useOffers";
import { formatPrice } from "@/lib/catalog";

const NAV = [
  { href: "/shop/men", label: "Men" },
  { href: "/shop/women", label: "Women" },
  { href: "/shop/unisex", label: "Unisex" },
  { href: "/gift-box", label: "Gift box" },
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

export function Announcement() {
  const offers = useOffers();
  const items = [
    offers.bundle.enabled ? `${offers.bundle.label} — mix any scents` : null,
    offers.freeDelivery.enabled ? `Free UK delivery over ${formatPrice(offers.freeDelivery.threshold)}` : null,
    "Hand-poured in the UK",
  ].filter(Boolean) as string[];
  return (
    <div className="border-b border-[var(--line-soft)] bg-[#0f0d0b] text-center">
      <div className="wrap flex h-9 items-center justify-center gap-8 overflow-hidden text-[0.82rem] tracking-[0.02em] text-champagne">
        {items.map((t, i) => (
          <span key={t} className={i > 0 ? "hidden sm:inline" : ""}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Header() {
  const count = useCart((s) => s.lines.reduce((a, l) => a + l.qty, 0));
  const setOpen = useCart((s) => s.setOpen);
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
        background: scrolled ? "rgba(20,17,14,.86)" : "rgba(20,17,14,0)",
        backdropFilter: scrolled ? "blur(14px) saturate(1.2)" : "none",
        borderBottom: `1px solid ${scrolled ? "var(--line-soft)" : "transparent"}`,
      }}
    >
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <button
          type="button"
          className="-ml-2 flex h-11 w-11 items-center justify-center md:hidden"
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
          onClick={() => setMenu((v) => !v)}
        >
          <span className="relative block h-3 w-6">
            <span className={`absolute left-0 top-0 h-px w-6 bg-ivory transition-transform ${menu ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`absolute bottom-0 left-0 h-px w-6 bg-ivory transition-transform ${menu ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </span>
        </button>

        <Link href="/" aria-label="GK Parfum home" className="flex items-center">
          <img src="/brand/gk-lockup-foil-transparent.svg" alt="GK Parfum" className="h-10 w-auto md:h-11" width={185} height={44} />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-9 text-[0.98rem]">
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
            <li>
              <Link href="/shop" className={`py-2 transition-colors hover:text-champagne ${path === "/shop" ? "text-champagne" : "text-ivory"}`}>
                All scents
              </Link>
            </li>
          </ul>
        </nav>

        <div className="-mr-2 flex items-center">
          <Link href="/search" className="hidden h-11 w-11 items-center justify-center text-ivory hover:text-champagne sm:flex" aria-label="Search scents">
            <SearchIcon />
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
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gilt px-1.5 text-[0.72rem] font-semibold text-[#1a140c]">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      <div
        className={`overflow-hidden border-t border-[var(--line-soft)] bg-velvet transition-[max-height] duration-500 md:hidden ${menu ? "max-h-[420px]" : "max-h-0 border-transparent"}`}
      >
        <nav aria-label="Mobile" className="wrap py-4">
          <ul className="flex flex-col">
            {[...NAV, { href: "/shop", label: "All scents" }, { href: "/search", label: "Search" }].map((n) => (
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
