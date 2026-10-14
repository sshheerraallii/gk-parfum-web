import Link from "next/link";
import type { ReactNode } from "react";
import { parseBody, parseInline, type BodyBlock } from "@/lib/blog";
import type { Scent } from "@/lib/catalog";
import { ScentCard } from "./ScentCard";

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((n, i) =>
        n.t === "b" ? (
          <strong key={i} className="font-semibold text-ivory">{n.v}</strong>
        ) : n.t === "i" ? (
          <em key={i}>{n.v}</em>
        ) : n.t === "a" ? (
          n.href.startsWith("/") ? (
            <Link key={i} href={n.href}>{n.v}</Link>
          ) : (
            <a key={i} href={n.href} target="_blank" rel="noopener noreferrer nofollow">{n.v}</a>
          )
        ) : (
          n.v
        )
      )}
    </>
  );
}

function VideoBlock({ b }: { b: Extract<BodyBlock, { t: "video" }> }) {
  const v = b.video;
  const frame = (src: string, title: string) => (
    <iframe
      src={src}
      title={title}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      className="absolute inset-0 h-full w-full"
    />
  );
  return (
    <figure className="not-prose my-10 overflow-hidden rounded-[var(--radius-m)] border border-[var(--line-soft)] bg-black">
      <div className="relative aspect-video">
        {v.kind === "youtube"
          ? frame(`https://www.youtube-nocookie.com/embed/${v.id}?rel=0`, "YouTube video")
          : v.kind === "vimeo"
            ? frame(`https://player.vimeo.com/video/${v.id}?dnt=1`, "Vimeo video")
            : <video src={v.src} controls playsInline preload="metadata" className="absolute inset-0 h-full w-full" />}
      </div>
    </figure>
  );
}

/** Renders a post body. Server component; scent cards are client components inside it. */
export function PostBody({ body, scents }: { body: string; scents: Scent[] }) {
  const blocks = parseBody(body);
  const out: ReactNode[] = blocks.map((b, i) => {
    switch (b.t) {
      case "h2":
        return <h2 key={i}><Inline text={b.text} /></h2>;
      case "h3":
        return <h3 key={i}><Inline text={b.text} /></h3>;
      case "p":
        return <p key={i}><Inline text={b.text} /></p>;
      case "quote":
        return <blockquote key={i}><Inline text={b.text} /></blockquote>;
      case "ul":
        return <ul key={i}>{b.items.map((t, k) => <li key={k}><Inline text={t} /></li>)}</ul>;
      case "ol":
        return <ol key={i}>{b.items.map((t, k) => <li key={k}><Inline text={t} /></li>)}</ol>;
      case "hr":
        return <hr key={i} />;
      case "img":
        return (
          <figure key={i} className="not-prose my-10">
            <img src={b.src} alt={b.alt} loading="lazy" className="w-full rounded-[var(--radius-m)] border border-[var(--line-soft)]" />
            {b.alt && <figcaption className="small mt-2 text-center text-smoke">{b.alt}</figcaption>}
          </figure>
        );
      case "video":
        return <VideoBlock key={i} b={b} />;
      case "scents": {
        const list = b.slugs.map((s) => scents.find((x) => x.slug === s)).filter((s): s is Scent => !!s);
        return list.length ? (
          <div key={i} className="not-prose my-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3">
            {list.map((s) => <ScentCard key={s.slug} s={s} />)}
          </div>
        ) : null;
      }
      case "button":
        return (
          <p key={i} className="not-prose my-8">
            <Link href={b.href} className="btn btn-gold">{b.label}</Link>
          </p>
        );
    }
  });
  return <div className="prose-gk">{out}</div>;
}
