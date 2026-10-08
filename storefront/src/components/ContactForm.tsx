"use client";

import { useState } from "react";
import { backendReady, sendContact } from "@/lib/store-client";
import { useAccount } from "@/lib/account";

const input =
  "h-12 w-full rounded-[10px] border border-[var(--line)] bg-[#081440]/50 px-4 text-ivory placeholder:text-[#8d98bb] focus:border-gilt focus:outline-none";

export function ContactForm() {
  const account = useAccount((s) => s.account);
  const [f, setF] = useState({ name: "", email: "", order_ref: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState("");
  const name = f.name || (account ? `${account.first_name} ${account.last_name}`.trim() : "");
  const email = f.email || account?.email || "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.website) return;
    if (!name.trim()) return setErr("Add your name so we know who we're talking to.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("Enter an email we can reply to.");
    if (f.message.trim().length < 5) return setErr("Write your message — a sentence is plenty.");
    setErr("");
    setState("sending");
    try {
      if (backendReady()) await sendContact({ name, email, order_ref: f.order_ref || undefined, message: f.message });
      setState("done");
    } catch {
      setState("idle");
      setErr("That didn't send. Please try again, or email us directly.");
    }
  };

  if (state === "done") {
    return (
      <div className="rounded-[var(--radius-m)] border border-[var(--line)] bg-ebony p-8" role="status">
        <p className="display-m">Message sent</p>
        <p className="mt-2 text-smoke">Thanks{name ? `, ${name.split(" ")[0]}` : ""}. We&apos;ll reply to {email} within one working day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1.5 block text-[0.9rem] text-smoke">Name</label>
          <input id="c-name" autoComplete="name" value={f.name || name} onChange={(e) => setF({ ...f, name: e.target.value })} className={input} />
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1.5 block text-[0.9rem] text-smoke">Email</label>
          <input id="c-email" type="email" autoComplete="email" value={f.email || email} onChange={(e) => setF({ ...f, email: e.target.value })} className={input} />
        </div>
      </div>
      <div>
        <label htmlFor="c-order" className="mb-1.5 block text-[0.9rem] text-smoke">Order number (if it&apos;s about an order)</label>
        <input id="c-order" value={f.order_ref} onChange={(e) => setF({ ...f, order_ref: e.target.value })} className={`${input} sm:max-w-[240px]`} placeholder="e.g. 1042" />
      </div>
      <div>
        <label htmlFor="c-msg" className="mb-1.5 block text-[0.9rem] text-smoke">How can we help?</label>
        <textarea id="c-msg" rows={6} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} maxLength={4000} className={`${input} h-auto py-3`} />
      </div>
      <input tabIndex={-1} autoComplete="off" name="website" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} className="hidden" aria-hidden />
      {err && <p className="text-[0.9rem] text-[#ffb4a6]" role="alert">{err}</p>}
      <button type="submit" disabled={state === "sending"} className="btn btn-gold">{state === "sending" ? "Sending…" : "Send message"}</button>
      {!backendReady() && <p className="small text-smoke">Preview site: messages aren&apos;t delivered here.</p>}
    </form>
  );
}
