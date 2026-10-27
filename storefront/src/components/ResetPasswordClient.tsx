"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { resetPassword } from "@/lib/store-client";
import { useAccount } from "@/lib/account";

/** Landing page for the link in the "reset your password" email. */
export function ResetPasswordClient() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const login = useAccount((s) => s.login);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (pw.length < 8) return setErr("Use at least 8 characters.");
    if (pw !== pw2) return setErr("The two passwords don't match.");
    setBusy(true);
    try {
      await resetPassword(token, pw);
      setDone(true);
      if (email) await login(email, pw).catch(() => {});
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const input = "h-12 w-full rounded-[10px] border border-[var(--line)] bg-[#0f0c0a]/60 px-4 text-ivory focus:border-gilt focus:outline-none";

  return (
    <section className="wrap max-w-lg py-16 md:py-24">
      <h1 className="display-l">Choose a new password</h1>
      {!token ? (
        <p className="lede mt-5">
          This link isn&apos;t complete. <Link href="/account" className="text-champagne underline underline-offset-4">Ask for a new one</Link>.
        </p>
      ) : done ? (
        <>
          <p className="lede mt-5">Your password is changed{email ? " and you're signed in" : ""}.</p>
          <Link href="/account" className="btn btn-gold mt-8">Go to your account</Link>
        </>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-[var(--radius-m)] border border-[var(--line)] bg-ebony/60 p-6 md:p-8" noValidate>
          {email && <p className="small text-smoke">For {email}</p>}
          <label className="block">
            <span className="small mb-1.5 block text-smoke">New password (8+ characters)</span>
            <input type="password" autoComplete="new-password" className={input} value={pw} onChange={(e) => setPw(e.target.value)} />
          </label>
          <label className="block">
            <span className="small mb-1.5 block text-smoke">Type it again</span>
            <input type="password" autoComplete="new-password" className={input} value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </label>
          {err && <p className="text-[0.9rem] text-[#ffb4a6]" role="alert">{err} {err.includes("expired") && <Link href="/account" className="underline">Send a new link</Link>}</p>}
          <button type="submit" disabled={busy} className="btn btn-gold w-full">{busy ? "One moment…" : "Save new password"}</button>
        </form>
      )}
    </section>
  );
}
