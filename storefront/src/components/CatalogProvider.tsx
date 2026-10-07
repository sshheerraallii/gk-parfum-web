"use client";

import { createContext, useContext } from "react";
import { scents as localScents, type Scent } from "@/lib/catalog";
import { defaultOffers, type Offers } from "@/lib/offers";

const Ctx = createContext<{ scents: Scent[]; offers: Offers }>({ scents: localScents, offers: defaultOffers });

export function CatalogProvider({ scents, offers, children }: { scents: Scent[]; offers: Offers; children: React.ReactNode }) {
  return <Ctx.Provider value={{ scents, offers }}>{children}</Ctx.Provider>;
}

export const useCatalog = () => useContext(Ctx).scents;
export const useOffersCtx = () => useContext(Ctx).offers;
