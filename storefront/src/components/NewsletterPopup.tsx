"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { backendReady, subscribe } from "@/lib/store-client";

const KEY = "gk-newsletter";
const SNOOZE_DAYS = 14;
const QUIET = ["/checkout", "/order", "/account"];

type Saved = { state: "joined" | "dismissed"; at: number };

const readSaved = (): Saved | null => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
};
const save = (v: Saved) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* storage blocked — the pop-up may show again next visit */
  }
};

/** "Win a free bottle" sign-up. Shows once after a short browse; never on checkout or account pages. */
export function NewsletterPopup() {
  const path = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const dialog = useRef<HTMLDivElement>(null);
  const quiet = QUIET.some((q) => path.startsWith(q));

  useEffect(() => {
    if (quiet) return;
    const s = readSaved();
    if (s?.state === "joined") return;
    if (s?.state === "dismissed" && Date.now() - s.at < SNOOZE_DAYS * 864e5) return;
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setOpen(true);
    };
    const t = setTimeout(show, 15000);
    const onScroll = () => {
      if (window.scrollY > document.body.scrollHeight * 0.45) show();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, [quiet]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    dialog.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    if (state !== "done") save({ state: "dismissed", at: Date.now() });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("Enter an email like name@example.com");
      return;
    }
    setErr("");
    setState("sending");
    try {
      if (backendReady()) await subscribe(email, phone || null, "popup");
      save({ state: "joined", at: Date.now() });
      setState("done");
    } catch {
      setState("error");
      setErr("That didn't go through. Check your email and try again.");
    }
  };

  if (!open || quiet) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-[#040b24]/75" onClick={close} aria-hidden />
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nl-title"
        className="relative grid w-full max-w-[820px] animate-[rise_.5s_cubic-bezier(.16,1,.3,1)_both] overflow-hidden rounded-t-[18px] border border-[var(--line)] bg-ebony shadow-2xl sm:grid-cols-[.9fr_1.1fr] sm:rounded-[18px]"
      >
        <button type="button" onClick={close} className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#081440]/70 text-ivory hover:text-champagne" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="1.8" /></svg>
        </button>
        <img src="/brand/mockup-box-800.webp" alt="A GK Parfum bottle in its blue signature box" className="hidden h-full w-full object-cover sm:block" width={800} height={994} />

        <div className="flex flex-col items-center px-6 pb-7 pt-8 text-center sm:px-10 sm:py-12">
          <img src="/brand/gk-crest-112.webp" alt="" aria-hidden className="h-16 w-auto" />
          {state === "done" ? (
            <>
              <h2 id="nl-title" className="display-m mt-5">You&apos;re in the draw</h2>
              <p className="mt-3 max-w-[30ch] text-smoke">We&apos;ll email you if you win, and you&apos;ll be first to hear about new scents and offers.</p>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-gold mt-7">Carry on shopping</button>
            </>
          ) : (
            <>
              <h2 id="nl-title" className="display-m mt-5">Win a free bottle</h2>
              <p className="mt-3 max-w-[32ch] text-smoke">
                Join the GK list for a chance to win a full-size bottle — plus first news on new scents and members-only offers.
              </p>
              <form onSubmit={submit} className="mt-6 w-full max-w-[340px] space-y-3" noValidate>
                <label htmlFor="nl-email" className="sr-only">Email</label>
                <input
                  id="nl-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  aria-invalid={!!err}
                  aria-describedby={err ? "nl-err" : undefined}
                  className="h-12 w-full rounded-full border border-[var(--line)] bg-[#081440]/60 px-5 text-ivory placeholder:text-[#8d98bb] focus:border-gilt focus:outline-none"
                />
                <label htmlFor="nl-phone" className="sr-only">Phone (optional)</label>
                <input
                  id="nl-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="h-12 w-full rounded-full border border-[var(--line)] bg-[#081440]/60 px-5 text-ivory placeholder:text-[#8d98bb] focus:border-gilt focus:outline-none"
                />
                {err && <p id="nl-err" className="text-[0.85rem] text-[#ffb4a6]">{err}</p>}
                <button type="submit" disabled={state === "sending"} className="btn btn-gold w-full">
                  {state === "sending" ? "Entering…" : "Enter the draw"}
                </button>
              </form>
              <button type="button" onClick={close} className="mt-4 text-[0.92rem] text-smoke underline-offset-4 hover:text-ivory hover:underline">
                No thanks, I&apos;ll buy my own
              </button>
              <p className="mt-5 text-[0.75rem] text-smoke/80">
                Unsubscribe any time. <Link href="/terms#prize-draw" className="underline underline-offset-2">Prize draw terms</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
