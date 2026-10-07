"use client";
import { useEffect, useState } from "react";
import { defaultOffers, type Offers } from "./offers";

let cache: Offers | null = null;
let inflight: Promise<Offers> | null = null;

/** Offers come from /api/offers (proxied to the backend). Defaults render instantly. */
export function useOffers(): Offers {
  const [o, setO] = useState<Offers>(cache ?? defaultOffers);
  useEffect(() => {
    if (cache) return;
    inflight ??= fetch("/api/offers")
      .then((r) => (r.ok ? r.json() : defaultOffers))
      .catch(() => defaultOffers);
    inflight.then((v: Offers) => {
      cache = v;
      setO(v);
    });
  }, []);
  return o;
}
