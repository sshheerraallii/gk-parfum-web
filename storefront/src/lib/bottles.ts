import meta from "../../public/bottles/bottles.json";

/** Real bottle renders from the client (public/bottles, made by tools/cut_bottles.py + paint_scenes.py). */
export type BottlePhoto = {
  whole: string;
  body: string;
  cap: string;
  bg: string;
  scene: string;
  w: number;
  h: number;
  /** top of the neck ring, as a fraction of the height — the atomiser sits here when the cap is off */
  capBottom: number;
  neckX: number;
  neckW: number;
};

const M = meta as Record<string, { w: number; h: number; capBottom: number; neckX: number; neckW: number }>;

export function bottlePhoto(slug: string): BottlePhoto | null {
  const m = M[slug];
  if (!m) return null;
  const b = `/bottles/${slug}`;
  return { whole: `${b}.webp`, body: `${b}-body.webp`, cap: `${b}-cap.webp`, bg: `${b}-bg.webp`, scene: `${b}-scene.jpg`, ...m };
}

/** On a 4:5 backdrop the bottle stands on the ledge: these match tools/paint_scenes.py (LEDGE, BOTTLE_H). */
export const STAGE = { ledge: 0.8, bottleH: 0.62 };
