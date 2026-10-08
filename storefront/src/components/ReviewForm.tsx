"use client";

import { useState } from "react";
import { backendReady, submitReview } from "@/lib/store-client";
import { useAccount } from "@/lib/account";

const input =
  "h-12 w-full rounded-[10px] border border-[var(--line)] bg-[#081440]/50 px-4 text-ivory placeholder:text-[#8d98bb] focus:border-gilt focus:outline-none";

/** Customers write reviews; they go to Admin → Reviews and appear only once approved. */
export function ReviewForm({ productHandle, productName, scents }: { productHandle?: string; productName?: string; scents?: { slug: string; name: string }[] }) {
  const account = useAccount((s) => s.account);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [product, setProduct] = useState(productHandle ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState("");

  const theName = name || (account ? `${account.first_name} ${account.last_name}`.trim() : "");
  const theEmail = email || account?.email || "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp) return;
    if (!rating) return setErr("Choose a star rating.");
    if (!theName.trim()) return setErr("Add your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(theEmail)) return setErr("Enter your email — we use it to check you've ordered, and never show it.");
    if (body.trim().length < 10) return setErr("Tell us a little more — at least a sentence.");
    setErr("");
    setState("sending");
    try {
      if (backendReady()) {
        await submitReview({ product_handle: product || null, name: theName, email: theEmail, rating, title: title || undefined, body });
      }
      setState("done");
    } catch {
      setState("idle");
      setErr("That didn't send. Please try again.");
    }
  };

  if (state === "done") {
    return (
      <div className="rounded-[var(--radius-m)] border border-[var(--line)] bg-ebony p-6" role="status">
        <p className="display-m">Thank you</p>
        <p className="mt-2 text-smoke">Your review is with us and will appear once it&apos;s been checked — usually within a day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <fieldset>
        <legend className="mb-2 text-ivory">Your rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i} ${i === 1 ? "star" : "stars"}`}
              aria-pressed={rating === i}
              onMouseEnter={() => setHover(i)}
              onClick={() => setRating(i)}
              className="p-1 text-gilt"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden fill={i <= (hover || rating) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4">
                <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
      </fieldset>
      {scents && (
        <div>
          <label htmlFor="rv-product" className="mb-1.5 block text-[0.9rem] text-smoke">Which scent?</label>
          <select id="rv-product" value={product} onChange={(e) => setProduct(e.target.value)} className={input}>
            <option value="">GK Parfum in general</option>
            {scents.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </div>
      )}
      {!account && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rv-name" className="mb-1.5 block text-[0.9rem] text-smoke">Name</label>
            <input id="rv-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="rv-email" className="mb-1.5 block text-[0.9rem] text-smoke">Email (not shown)</label>
            <input id="rv-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </div>
        </div>
      )}
      <div>
        <label htmlFor="rv-title" className="mb-1.5 block text-[0.9rem] text-smoke">Headline (optional)</label>
        <input id="rv-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className={input} placeholder={productName ? `e.g. ${productName} lasts all day` : ""} />
      </div>
      <div>
        <label htmlFor="rv-body" className="mb-1.5 block text-[0.9rem] text-smoke">Your review</label>
        <textarea id="rv-body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={3000} className={`${input} h-auto py-3`} placeholder="How does it smell, how long does it last, how close is it to the original?" />
      </div>
      <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} className="hidden" aria-hidden name="website" />
      {err && <p className="text-[0.9rem] text-[#ffb4a6]" role="alert">{err}</p>}
      <button type="submit" disabled={state === "sending"} className="btn btn-gold">{state === "sending" ? "Sending…" : "Send review"}</button>
      {!backendReady() && <p className="small text-smoke">Preview site: reviews aren&apos;t saved here.</p>}
    </form>
  );
}
