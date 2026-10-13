/** The site's public address. Falls back safely if the variable is missing, empty or not a full URL. */
function siteUrl(): string {
  const v = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  try {
    return new URL(v).origin;
  } catch {
    return process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://gkparfum.co.uk";
  }
}

export const SITE = {
  name: "GK Parfum",
  url: siteUrl(),
  description:
    "Wear your aura. Luxury inspired perfumes made in the UK: 100ml extrait de parfum, 40% oil, lasting 12–24 hours, from £16.99. Vegan friendly, with a free gift box on every order.",
  locale: "en_GB",
  email: "hello@gkparfum.co.uk",
  instagram: "",
  tiktok: "",
};
