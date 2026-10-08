import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Announcement, Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { SITE } from "@/lib/site";
import { CatalogProvider } from "@/components/CatalogProvider";
import { getOffers, getScents } from "@/lib/medusa";
import { AccountSync } from "@/components/AccountSync";
import { NewsletterPopup } from "@/components/NewsletterPopup";

const jost = localFont({
  src: "../fonts/jost.woff2",
  variable: "--font-jost",
  weight: "300 700",
  display: "swap",
});

const cormorant = localFont({
  src: [
    { path: "../fonts/cormorant.woff2", style: "normal" },
    { path: "../fonts/cormorant-italic.woff2", style: "italic" },
  ],
  variable: "--font-cormorant",
  weight: "300 700",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "GK Parfum — Wear Your Aura | Luxury Inspired Perfumes, Made in the UK",
    template: "%s | GK Parfum",
  },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE.url,
    title: "GK Parfum — Luxury Inspired Perfumes, Made in the UK",
    description: SITE.description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "GK Parfum" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/gk-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: { index: true, follow: true, "max-image-preview": "large" } as Metadata["robots"],
};

export const viewport: Viewport = {
  themeColor: "#0a1a48",
  colorScheme: "dark",
};

const orgLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#org`,
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/brand/gk-icon-512.png`,
      email: SITE.email,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      inLanguage: "en-GB",
      publisher: { "@id": `${SITE.url}/#org` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE.url}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [scents, offers] = await Promise.all([getScents(), getOffers()]);
  return (
    <html lang="en-GB" className={`${jost.variable} ${cormorant.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-gilt focus:px-4 focus:py-2 focus:text-[#0a1a48]">
          Skip to content
        </a>
        <CatalogProvider scents={scents} offers={offers}>
          <Announcement />
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer />
          <NewsletterPopup />
          <AccountSync />
        </CatalogProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      </body>
    </html>
  );
}
