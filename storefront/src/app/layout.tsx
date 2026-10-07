import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Announcement, Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { SITE } from "@/lib/site";

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
    default: "GK Parfum — Luxury Inspired Perfumes, Made in the UK",
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
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [{ url: "/brand/gk-favicon-foil-transparent.svg", type: "image/svg+xml" }],
  },
  robots: { index: true, follow: true, "max-image-preview": "large" } as Metadata["robots"],
};

export const viewport: Viewport = {
  themeColor: "#14110e",
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
      logo: `${SITE.url}/brand/gk-logo-foil-transparent.svg`,
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${jost.variable} ${cormorant.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-gilt focus:px-4 focus:py-2 focus:text-[#1a140c]">
          Skip to content
        </a>
        <Announcement />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <CartDrawer />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      </body>
    </html>
  );
}
