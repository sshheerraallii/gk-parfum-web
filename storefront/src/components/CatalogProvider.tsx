"use client";

import { createContext, useContext, useMemo } from "react";
import { scents as localScents, type Scent } from "@/lib/catalog";
import { defaultOffers, type Offers } from "@/lib/offers";

const Ctx = createContext<{ scents: Scent[]; offers: Offers }>({ scents: localScents, offers: defaultOffers });

export function CatalogProvider({ scents, offers, children }: { scents: Scent[]; offers: Offers; children: React.ReactNode }) {
  return <Ctx.Provider value={{ scents, offers }}>{children}</Ctx.Provider>;
}

export const useCatalog = () => useContext(Ctx).scents;
export const useOffersCtx = () => useContext(Ctx).offers;

/** Best sellers in the order chosen in Admin → Offers (the backend fills in best-stocked when none are chosen). */
export function useBestSellers(): Scent[] {
  const { scents, offers } = useContext(Ctx);
  return useMemo(() => {
    const picked = offers.bestSellers.map((h) => scents.find((s) => s.slug === h)).filter((s): s is Scent => !!s);
    return picked.length ? picked : scents.slice(0, 6);
  }, [scents, offers.bestSellers]);
}
