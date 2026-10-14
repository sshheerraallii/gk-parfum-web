import { bottlePhoto } from "@/lib/bottles";
import { firstImage, parseBody, type Post } from "@/lib/blog";

/** The picture for a post: its cover, else the first photo in it, else the scene of the first scent it features. */
export function coverOf(p: Post): string | null {
  if (p.cover_url) return p.cover_url;
  const img = firstImage(p.body);
  if (img) return img;
  const scents = parseBody(p.body ?? "").find((b) => b.t === "scents");
  const slug = scents && scents.t === "scents" ? scents.slugs.find((s) => bottlePhoto(s)) : null;
  return slug ? bottlePhoto(slug)!.scene : null;
}

export function PostCover({ post, className = "", priority = false }: { post: Post; className?: string; priority?: boolean }) {
  const src = coverOf(post);
  return (
    <div className={`relative overflow-hidden bg-[radial-gradient(120%_90%_at_30%_20%,#3a2c1c,#14110e_70%)] ${className}`}>
      {src ? (
        <img src={src} alt="" loading={priority ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
      ) : (
        <span aria-hidden className="absolute inset-0 grid place-items-center font-display text-[3rem] text-gilt/40">GK</span>
      )}
    </div>
  );
}
