import type { MetadataRoute } from "next";
import { getScents } from "@/lib/medusa";
import { guides } from "@/lib/guides";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const scents = await getScents();
  const fixed = ["", "/shop", "/shop/men", "/shop/women", "/shop/unisex", "/gift-box", "/smells-like", "/guides", "/about", "/faq", "/delivery", "/returns", "/contact"];
  return [
    ...fixed.map((p) => ({ url: `${SITE.url}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...scents.map((s) => ({
      url: `${SITE.url}/perfume/${s.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: s.images?.length ? s.images.slice(0, 3) : undefined,
    })),
    ...guides.map((g) => ({ url: `${SITE.url}/guides/${g.slug}`, lastModified: new Date(g.published), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
