"use client";
import { useOffersCtx } from "@/components/CatalogProvider";
import type { Offers } from "./offers";

/** Offers are loaded on the server (Admin → Offers) and handed down through CatalogProvider. */
export function useOffers(): Offers {
  return useOffersCtx();
}
