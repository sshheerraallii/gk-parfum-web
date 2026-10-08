import Link from "next/link";

const cols = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All scents" },
      { href: "/shop/men", label: "For him" },
      { href: "/shop/women", label: "For her" },
      { href: "/shop/unisex", label: "Unisex" },
      { href: "/bundle", label: "Build your bundle" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/delivery", label: "Delivery" },
      { href: "/returns", label: "Returns" },
      { href: "/faq", label: "Questions" },
      { href: "/account", label: "My account" },
      { href: "/contact", label: "Contact us" },
      { href: "/track", label: "Track an order" },
    ],
  },
  {
    title: "Discover",
    links: [
      { href: "/inspired-by", label: "Inspired by…" },
      { href: "/reviews", label: "Reviews" },
      { href: "/guides", label: "Fragrance guides" },
      { href: "/about", label: "Our story" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--line-soft)] bg-[#081440]">
      <div className="wrap grid gap-12 py-16 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div>
          <img src="/brand/gk-crest-240.webp" alt="" aria-hidden className="h-32 w-auto" width={240} height={254} loading="lazy" />
          <p className="mt-5 max-w-[30ch] text-smoke">
            Wear your aura. Vegan-friendly extrait de parfum, inspired by the world&apos;s great houses and made in the UK.
          </p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="mb-4 font-display text-[1.3rem] text-champagne">{c.title}</h2>
            <ul className="space-y-2.5">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-smoke transition-colors hover:text-ivory">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-[var(--line-soft)]">
        <div className="wrap flex flex-col gap-4 py-8 text-[0.8rem] leading-relaxed text-smoke md:flex-row md:justify-between">
          <p className="max-w-[80ch]">
            GK Parfum creates original fragrances inspired by well-known scents. Brand names are used only to describe
            the scent style and remain the property of their trade mark owners. GK Parfum is not affiliated with,
            endorsed by or connected to any of these brands.
          </p>
          <p className="shrink-0">
            © {new Date().getFullYear()} GK Parfum ·{" "}
            <Link href="/privacy" className="hover:text-ivory">Privacy</Link> ·{" "}
            <Link href="/terms" className="hover:text-ivory">Terms</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
