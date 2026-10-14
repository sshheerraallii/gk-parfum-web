/**
 * The blog. Posts are written in Admin → Blog in a simple text format — the same one the
 * admin preview uses (backend/apps/backend/src/admin/lib/post-format.ts mirrors this parser):
 *
 *   ## Heading            ### Smaller heading
 *   **bold**  *italic*  [link text](https://… or /shop)
 *   - bullet              1. numbered
 *   > a quote
 *   ---                   a divider
 *   ![caption](https://…/photo.jpg)          an image (upload in the editor)
 *   https://www.youtube.com/watch?v=…        a video on its own line (YouTube, Vimeo, or an .mp4/.webm file)
 *   {{scents: eventus, nomad}}               scent cards with Add to bag
 *   {{button: Build your bundle | /bundle}}  a gold button
 *
 * Everything is rendered as React elements (never raw HTML), so nothing typed in a post can run code.
 */
import { guides, type Guide } from "./guides";

export interface Post {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  body?: string;
  author: string | null;
  tags: string[] | null;
  published_at: string;
  updated_at?: string;
  seo_title?: string | null;
  seo_description?: string | null;
}

export type Video = { kind: "youtube"; id: string } | { kind: "vimeo"; id: string } | { kind: "file"; src: string };

export type BodyBlock =
  | { t: "h2" | "h3" | "p" | "quote"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "hr" }
  | { t: "img"; src: string; alt: string }
  | { t: "video"; video: Video; url: string }
  | { t: "scents"; slugs: string[] }
  | { t: "button"; label: string; href: string };

/** Only web addresses and on-site paths — never javascript: or data: links. */
export function safeUrl(u: string): string | null {
  const v = u.trim();
  if (/^\/(?!\/)/.test(v)) return v;
  try {
    const url = new URL(v);
    return url.protocol === "https:" || url.protocol === "http:" || url.protocol === "mailto:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function videoOf(raw: string): Video | null {
  const u = safeUrl(raw);
  if (!u || u.startsWith("/") && !/\.(mp4|webm|mov)$/i.test(u)) return null;
  if (u.startsWith("/")) return { kind: "file", src: u };
  const url = new URL(u);
  const host = url.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const id = url.searchParams.get("v") || url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/)?.[1];
    return id && /^[\w-]{6,}$/.test(id) ? { kind: "youtube", id } : null;
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return /^[\w-]{6,}$/.test(id) ? { kind: "youtube", id } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.match(/(\d{6,})/)?.[1];
    return id ? { kind: "vimeo", id } : null;
  }
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(url.pathname)) return { kind: "file", src: u };
  return null;
}

export function parseBody(body: string): BodyBlock[] {
  const out: BodyBlock[] = [];
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  let para: string[] = [];
  let list: { t: "ul" | "ol"; items: string[] } | null = null;
  const flush = () => {
    if (para.length) out.push({ t: "p", text: para.join(" ") });
    para = [];
    if (list) out.push(list);
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{2,3})\s+(.+)$/))) {
      flush();
      out.push({ t: m[1].length === 2 ? "h2" : "h3", text: m[2] });
    } else if (/^#\s+/.test(line)) {
      flush();
      out.push({ t: "h2", text: line.replace(/^#\s+/, "") });
    } else if ((m = line.match(/^[-*•]\s+(.+)$/))) {
      if (para.length || list?.t === "ol") flush();
      list = list ?? { t: "ul", items: [] };
      list.items.push(m[1]);
    } else if ((m = line.match(/^\d+[.)]\s+(.+)$/))) {
      if (para.length || list?.t === "ul") flush();
      list = list ?? { t: "ol", items: [] };
      list.items.push(m[1]);
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      flush();
      const last = out[out.length - 1];
      if (last?.t === "quote") last.text += " " + m[1];
      else out.push({ t: "quote", text: m[1] });
    } else if (/^(-{3,}|\*{3,})$/.test(line)) {
      flush();
      out.push({ t: "hr" });
    } else if ((m = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) {
      flush();
      const src = safeUrl(m[2]);
      if (src) out.push({ t: "img", src, alt: m[1] });
    } else if ((m = line.match(/^\{\{\s*scents?\s*:\s*([^}]+)\}\}$/i))) {
      flush();
      out.push({ t: "scents", slugs: m[1].split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) });
    } else if ((m = line.match(/^\{\{\s*button\s*:\s*([^|}]+)\|\s*([^}]+)\}\}$/i))) {
      flush();
      const href = safeUrl(m[2]);
      if (href) out.push({ t: "button", label: m[1].trim(), href });
    } else if (/^https?:\/\/\S+$/.test(line) && videoOf(line)) {
      flush();
      out.push({ t: "video", video: videoOf(line)!, url: line });
    } else {
      if (list) flush();
      para.push(line);
    }
  }
  flush();
  return out;
}

/** Inline formatting: **bold**, *italic*, [text](url). Returns plain tokens for the renderer. */
export type Inline = { t: "text"; v: string } | { t: "b" | "i"; v: string } | { t: "a"; v: string; href: string };

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: "text", v: s.slice(last, m.index) });
    if (m[1]) out.push({ t: "b", v: m[1] });
    else if (m[2]) out.push({ t: "i", v: m[2] });
    else {
      const href = safeUrl(m[4]);
      out.push(href ? { t: "a", v: m[3], href } : { t: "text", v: m[3] });
    }
    last = re.lastIndex;
  }
  if (last < s.length) out.push({ t: "text", v: s.slice(last) });
  return out;
}

export const readingMinutes = (body = "") => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220));

/** First image in a post, for cards and social previews when no cover is set. */
export const firstImage = (body = "") => parseBody(body).find((b): b is Extract<BodyBlock, { t: "img" }> => b.t === "img")?.src ?? null;

/* ── built-in starter posts (the old fragrance guides) ────────────────────────
 * Used when the backend can't be reached (and on the static preview), and copied into
 * Admin → Blog on first run so the owner can edit them.
 */
export function guideToBody(g: Guide): string {
  return g.blocks
    .map((b) =>
      b.h ? `## ${b.h}` : b.p ? b.p : b.list ? b.list.map((l) => `- ${l}`).join("\n") : b.scents ? `{{scents: ${b.scents.join(", ")}}}` : ""
    )
    .filter(Boolean)
    .join("\n\n");
}

export const starterPosts: Post[] = guides.map((g, i) => ({
  slug: g.slug,
  title: g.title,
  excerpt: g.description,
  cover_url: null,
  body: guideToBody(g),
  author: "GK Parfum",
  tags: ["Guides"],
  // an hour apart, so the order is stable (the last guide shows first)
  published_at: new Date(Date.parse(g.published + "T09:00:00Z") + i * 3_600_000).toISOString(),
}));
