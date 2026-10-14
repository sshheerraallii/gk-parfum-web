import { bottlePhoto } from "@/lib/bottles";
import type { MetadataRoute } from "next";
import { getPosts, getScents } from "@/lib/medusa";
import { SITE } from "@/lib/site";

export const revalidate = 3600;
export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [scents, posts] = await Promise.all([getScents(), getPosts()]);
  const fixed = ["", "/shop", "/shop/men", "/shop/women", "/shop/unisex", "/bundle", "/inspired-by", "/reviews", "/blog", "/about", "/faq", "/delivery", "/returns", "/contact"];
  return [
    ...fixed.map((p) => ({ url: `${SITE.url}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...scents.map((s) => ({
      url: `${SITE.url}/perfume/${s.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: s.images?.length ? s.images.slice(0, 3) : bottlePhoto(s.slug) ? [`${SITE.url}${bottlePhoto(s.slug)!.scene}`] : undefined,
    })),
    ...posts.map((p) => ({ url: `${SITE.url}/blog/${p.slug}`, lastModified: new Date(p.updated_at || p.published_at), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
