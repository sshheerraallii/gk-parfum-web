// Copies the storefront catalogue (and the starter blog posts) into the backend seed data.  Run: npx tsx scripts/export-scents.ts
import { writeFileSync } from "node:fs";
import { scents, RENAMED_SLUGS } from "../src/lib/catalog";
import { starterPosts } from "../src/lib/blog";

const out = "../backend/apps/backend/src/data";
writeFileSync(`${out}/scents.json`, JSON.stringify(scents.map((s) => { const c: Partial<typeof s> = { ...s }; delete c.variantId; delete c.images; delete c.compareAt; return c; }), null, 2) + "\n");
writeFileSync(`${out}/renamed-slugs.json`, JSON.stringify(RENAMED_SLUGS, null, 2) + "\n");
writeFileSync(`${out}/blog-seed.json`, JSON.stringify(starterPosts, null, 2) + "\n");
console.log(`exported ${scents.length} scents and ${starterPosts.length} starter blog posts`);
