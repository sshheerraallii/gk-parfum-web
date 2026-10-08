/**
 * Local catalogue — mirrors the shape the storefront reads from the Medusa backend.
 * The backend seed script (backend/src/scripts/seed-gk.ts) imports the same data,
 * so this file is the single source of truth until products are edited in the admin.
 */

export type Gender = "men" | "women" | "unisex";
export type Mood = "fresh" | "sweet" | "warm" | "dark";
export type Occasion =
  | "Office"
  | "Daily wear"
  | "Date night"
  | "Evening out"
  | "Special occasion"
  | "Smart casual"
  | "Sport";

export interface Scent {
  sku: string;
  slug: string;
  name: string;
  /** The original it is inspired by. null for house originals. */
  inspiredBy: { brand: string; name: string } | null;
  gender: Gender;
  families: string[];
  mood: Mood;
  time: "day" | "night" | "any";
  notes: { top: string[]; heart: string[]; base: string[] };
  description: string;
  longevityHours: [number, number];
  occasions: Occasion[];
  /** Pence, GBP */
  price: number;
  /** Accent used for mist tint and card glow */
  tint: string;
  /** Short line for cards — plain words */
  oneLiner: string;
  /** Set when loaded from the backend */
  variantId?: string;
  /** Product photos uploaded in the admin (first one is the hero) */
  images?: string[];
  /** Free-form tags set in Admin → Products → Tags (a scent can have many) */
  tags?: string[];
}

export const SIZE_ML = 100;
export const CONCENTRATION = "Extrait de Parfum";
export const OIL_PERCENT = 40;

export const scents: Scent[] = [
  {
    sku: "GKP-001M",
    slug: "royal-adventure",
    name: "Royal Adventure",
    inspiredBy: { brand: "Creed", name: "Aventus" },
    gender: "men",
    families: ["Fruity", "Fresh", "Woody"],
    mood: "fresh",
    time: "any",
    notes: {
      top: ["Pineapple", "Bergamot", "Lemon", "Blackcurrant"],
      heart: ["Ambroxan", "Jasmine", "Ambrette seed", "Geranium"],
      base: ["Oakmoss", "Cedarwood", "Musk", "Ambroxan"],
    },
    description:
      "A bright, fruity opening that settles into a balanced, woody dry-down. Fresh, crisp and commanding — the scent of someone who has already closed the deal.",
    longevityHours: [12, 24],
    occasions: ["Office", "Daily wear", "Special occasion"],
    price: 1799,
    tint: "#B9C79A",
    oneLiner: "Pineapple, oakmoss and confidence.",
  },
  {
    sku: "GKP-002M",
    slug: "imagination-elegance",
    name: "Imagination Elegance",
    inspiredBy: { brand: "Louis Vuitton", name: "Imagination" },
    gender: "men",
    families: ["Citrus", "Floral", "Woody"],
    mood: "fresh",
    time: "day",
    notes: {
      top: ["Bergamot", "Lemon", "Pink pepper", "Grapefruit"],
      heart: ["Iris", "Violet", "Jasmine", "Nutmeg"],
      base: ["Sandalwood", "Musk", "Vetiver", "Amber"],
    },
    description:
      "Citrus brightness blended with floral sophistication. A spicy-floral heart gives it a quiet, refined elegance for the man who notices details.",
    longevityHours: [12, 24],
    occasions: ["Smart casual", "Daily wear", "Date night"],
    price: 1799,
    tint: "#E6D58A",
    oneLiner: "Sunlit citrus with a soft iris heart.",
  },
  {
    sku: "GKP-003M",
    slug: "kings-code",
    name: "King's Code",
    inspiredBy: { brand: "Dolce & Gabbana", name: "K" },
    gender: "men",
    families: ["Aromatic", "Spicy", "Leather"],
    mood: "warm",
    time: "any",
    notes: {
      top: ["Cardamom", "Ginger", "Lemon", "Pink pepper"],
      heart: ["Juniper", "Lavender", "Aromatic herbs", "Cedar"],
      base: ["Leather", "Sandalwood", "Oakmoss", "Amber musk"],
    },
    description:
      "An aromatic, spicy powerhouse. Sharp cardamom up top, a herbal heart, and a leather-and-wood base that gives real presence.",
    longevityHours: [12, 24],
    occasions: ["Office", "Daily wear", "Evening out"],
    price: 1699,
    tint: "#B88A5A",
    oneLiner: "Cardamom, cedar and quiet authority.",
  },
  {
    sku: "GKP-004M",
    slug: "desert-nectar-elixir",
    name: "Desert Nectar Elixir",
    inspiredBy: { brand: "Dior", name: "Sauvage Elixir" },
    gender: "men",
    families: ["Spicy", "Amber", "Sweet"],
    mood: "warm",
    time: "night",
    notes: {
      top: ["Cardamom", "Nutmeg", "Black pepper", "Cinnamon"],
      heart: ["Ambrette seed", "Spices", "Tonka bean", "Vanilla"],
      base: ["Ambroxan", "Musk", "Cedarwood", "Amber", "Tobacco"],
    },
    description:
      "A warm, spicy amber with a rich, almost intoxicating sweetness. Built on spice and warmth rather than freshness — sensual and deeply masculine.",
    longevityHours: [12, 24],
    occasions: ["Evening out", "Date night", "Special occasion"],
    price: 1699,
    tint: "#C7743E",
    oneLiner: "Spice, tobacco and a long evening.",
  },
  {
    sku: "GKP-005U",
    slug: "angels-cognac",
    name: "Angel's Cognac",
    inspiredBy: { brand: "Kilian", name: "Angels' Share" },
    gender: "unisex",
    families: ["Gourmand", "Boozy", "Spicy"],
    mood: "sweet",
    time: "night",
    notes: {
      top: ["Almond", "Cinnamon", "Clove", "Ginger"],
      heart: ["Cognac accord", "Vanilla", "Caramel", "Tonka bean"],
      base: ["Oak", "Cedarwood", "Sandalwood", "Ambroxan", "Musk"],
    },
    description:
      "Built around a warm cognac accord with creamy vanilla and caramel. Like an aged liqueur with a touch of almond — slightly intoxicating and completely addictive.",
    longevityHours: [12, 24],
    occasions: ["Evening out", "Special occasion", "Date night"],
    price: 1799,
    tint: "#B5652B",
    oneLiner: "Cognac, caramel and warm oak.",
  },
  {
    sku: "GKP-006M",
    slug: "altair-mystique",
    name: "Altair Mystique",
    inspiredBy: { brand: "Parfums de Marly", name: "Althaïr" },
    gender: "men",
    families: ["Aromatic", "Woody", "Citrus"],
    mood: "fresh",
    time: "any",
    notes: {
      top: ["Bergamot", "Petitgrain", "Cardamom", "Pink pepper"],
      heart: ["Iris", "Geranium", "Cinnamon", "Nutmeg"],
      base: ["Vetiver", "Cedarwood", "Patchouli", "Amber musk"],
    },
    description:
      "Citrus freshness with aromatic spice and woody depth. Iris adds elegance, the woods give it staying power. Balanced and timeless.",
    longevityHours: [12, 24],
    occasions: ["Office", "Daily wear", "Smart casual"],
    price: 1799,
    tint: "#C9B48A",
    oneLiner: "Bergamot and iris in a tailored suit.",
  },
  {
    sku: "GKP-007U",
    slug: "crimson-luxe",
    name: "Crimson Luxe",
    inspiredBy: { brand: "Maison Francis Kurkdjian", name: "Baccarat Rouge 540" },
    gender: "unisex",
    families: ["Amber", "Woody", "Sweet"],
    mood: "sweet",
    time: "any",
    notes: {
      top: ["Jasmine", "Ambroxan", "Lemon", "Caraway"],
      heart: ["Ambroxan", "Fir balsam", "Cedar", "Saffron"],
      base: ["Amber", "Sandalwood", "Cedarwood", "Musk", "Oud"],
    },
    description:
      "Rich, complex and unmistakably expensive. Saffron and ambroxan give it that airy, almost burnt-sugar glow; the amber base keeps it warm for hours.",
    longevityHours: [12, 24],
    occasions: ["Special occasion", "Evening out", "Date night"],
    price: 1799,
    tint: "#C23B3B",
    oneLiner: "Saffron, amber and burnt sugar.",
  },
  {
    sku: "GKP-008M",
    slug: "shadow-in-silk",
    name: "Shadow in Silk",
    inspiredBy: { brand: "Louis Vuitton", name: "Ombre Nomade" },
    gender: "men",
    families: ["Citrus", "Floral", "Woody"],
    mood: "fresh",
    time: "day",
    notes: {
      top: ["Bergamot", "Grapefruit", "Lime", "Petitgrain"],
      heart: ["Iris", "Geranium", "Jasmine", "Lavender"],
      base: ["Cedarwood", "Vetiver", "Sandalwood", "Musk"],
    },
    description:
      "Fresh and sophisticated — bright citrus, a delicate floral heart, and a woody base that adds depth without weight. For people who prefer subtlety.",
    longevityHours: [12, 24],
    occasions: ["Office", "Daily wear", "Smart casual"],
    price: 1799,
    tint: "#9FB7B5",
    oneLiner: "Grapefruit and lavender, pressed and clean.",
  },
  {
    sku: "GKP-009U",
    slug: "midnight-orchid",
    name: "Midnight Orchid",
    inspiredBy: { brand: "Tom Ford", name: "Black Orchid" },
    gender: "unisex",
    families: ["Floral", "Dark", "Spicy"],
    mood: "dark",
    time: "night",
    notes: {
      top: ["Black truffle", "Ylang-ylang", "Bergamot", "Black orchid"],
      heart: ["Black orchid", "Spices", "Dark woods", "Rum"],
      base: ["Black orchid", "Sandalwood", "Musk", "Amber", "Oud"],
    },
    description:
      "Dark, sensual and mysterious, centred on black orchid. Rich spice and dark woods create an intoxicating aura. Not for the faint-hearted.",
    longevityHours: [12, 24],
    occasions: ["Evening out", "Date night", "Special occasion"],
    price: 1699,
    tint: "#6B3E6E",
    oneLiner: "Black orchid, truffle and velvet.",
  },
  {
    sku: "GKP-010M",
    slug: "oud-heritage",
    name: "Oud Heritage",
    inspiredBy: { brand: "Tom Ford", name: "Oud Wood" },
    gender: "men",
    families: ["Oud", "Woody", "Spicy"],
    mood: "dark",
    time: "any",
    notes: {
      top: ["Cardamom", "Spices", "Cinnamon", "Black pepper"],
      heart: ["Oud", "Agarwood", "Sandalwood", "Cypress", "Geranium"],
      base: ["Oud", "Agarwood", "Vetiver", "Cedar", "Amber", "Musk"],
    },
    description:
      "A premium woody scent built around prized oud. A spiced opening gives way to rich oud and sandalwood — warm, earthy and commanding.",
    longevityHours: [12, 24],
    occasions: ["Office", "Evening out", "Special occasion"],
    price: 1799,
    tint: "#7A5532",
    oneLiner: "Smoked oud and sandalwood.",
  },
  {
    sku: "GKP-011U",
    slug: "lost-cherry-dream",
    name: "Lost Cherry Dream",
    inspiredBy: { brand: "Tom Ford", name: "Lost Cherry" },
    gender: "unisex",
    families: ["Gourmand", "Fruity", "Sweet"],
    mood: "sweet",
    time: "any",
    notes: {
      top: ["Black cherry", "Rum", "Vanilla", "Almond"],
      heart: ["Maraschino", "Cherry liqueur", "Almond", "Tonka bean"],
      base: ["Vanilla", "Almond", "Sandalwood", "Tobacco", "Musk"],
    },
    description:
      "Cherry liqueur and almond sweetness — playful, slightly boozy and utterly delicious. The smooth vanilla base keeps it wearable all day.",
    longevityHours: [12, 24],
    occasions: ["Smart casual", "Daily wear", "Date night"],
    price: 1799,
    tint: "#9E1F33",
    oneLiner: "Black cherry, almond and a little rum.",
  },
  {
    sku: "GKP-012F",
    slug: "symphony-of-florals",
    name: "Symphony of Florals",
    inspiredBy: { brand: "Louis Vuitton", name: "Symphony" },
    gender: "women",
    families: ["Floral", "Citrus", "Fresh"],
    mood: "fresh",
    time: "day",
    notes: {
      top: ["Lemon", "Grapefruit", "Rose", "Freesia"],
      heart: ["Rose", "Jasmine", "Peony", "Iris", "Geranium"],
      base: ["Cedarwood", "Sandalwood", "Musk", "Amber", "Patchouli"],
    },
    description:
      "Opens with citrus and blooms into a bouquet of rose, jasmine and peony. A woody base adds warmth and lasting power. Timeless and refined.",
    longevityHours: [12, 24],
    occasions: ["Office", "Daily wear", "Smart casual"],
    price: 1799,
    tint: "#E3B5A4",
    oneLiner: "Rose and peony in morning light.",
  },
  {
    sku: "GKP-013U",
    slug: "amber-levant-luxe",
    name: "Amber Levant Luxe",
    inspiredBy: { brand: "Louis Vuitton", name: "Ambre Levant" },
    gender: "unisex",
    families: ["Amber", "Spicy", "Smoky"],
    mood: "warm",
    time: "night",
    notes: {
      top: ["Ginger", "Pepper", "Cinnamon", "Cardamom"],
      heart: ["Amber", "Incense", "Clove", "Myrrh", "Tobacco"],
      base: ["Amber", "Vetiver", "Cedarwood", "Sandalwood", "Musk"],
    },
    description:
      "A warm, spiced amber with a Middle Eastern soul. A sharp, spicy opening, a smoky heart of tobacco and incense, and a deep amber base.",
    longevityHours: [12, 24],
    occasions: ["Evening out", "Special occasion", "Date night"],
    price: 1799,
    tint: "#C08A3E",
    oneLiner: "Incense, myrrh and golden amber.",
  },
  {
    sku: "GKP-014F",
    slug: "delina-exclusive",
    name: "Delina Exclusive",
    inspiredBy: { brand: "Parfums de Marly", name: "Delina" },
    gender: "women",
    families: ["Floral", "Fruity", "Sweet"],
    mood: "sweet",
    time: "day",
    notes: {
      top: ["Pink pepper", "Apple", "Pear", "Bergamot"],
      heart: ["Rose", "Peony", "Orchid", "Strawberry", "Almond"],
      base: ["Musk", "Sandalwood", "Vanilla", "Tonka bean", "Amber"],
    },
    description:
      "Delicate and feminine — a fruity opening, a rose-and-peony heart with a hint of strawberry, and a creamy vanilla base. Soft, romantic, everyday elegance.",
    longevityHours: [12, 24],
    occasions: ["Daily wear", "Smart casual", "Date night"],
    price: 1799,
    tint: "#E7A3B6",
    oneLiner: "Rose, peony and a little strawberry.",
  },
  {
    sku: "GKP-015F",
    slug: "royal-adventure-for-her",
    name: "Royal Adventure for Her",
    inspiredBy: { brand: "Creed", name: "Aventus for Her" },
    gender: "women",
    families: ["Fruity", "Floral", "Fresh"],
    mood: "fresh",
    time: "any",
    notes: {
      top: ["Pineapple", "Bergamot", "Blackcurrant", "Lemon"],
      heart: ["Rose", "Jasmine", "Lily of the valley", "Peony", "Magnolia"],
      base: ["Oakmoss", "Cedarwood", "Ambroxan", "Musk", "Woody notes"],
    },
    description:
      "The feminine counterpart to Royal Adventure. Fresh, energetic fruit up top, a romantic floral heart, and a woody base. Powerful and feminine.",
    longevityHours: [12, 24],
    occasions: ["Office", "Daily wear", "Special occasion"],
    price: 1799,
    tint: "#D7C27A",
    oneLiner: "Blackcurrant and magnolia, confidently worn.",
  },
  {
    sku: "GKP-016U",
    slug: "signature-green-musk",
    name: "Signature Green Musk",
    inspiredBy: null,
    gender: "unisex",
    families: ["Green", "Fresh", "Musky"],
    mood: "fresh",
    time: "day",
    notes: {
      top: ["Galbanum", "Green leaf accord", "Bergamot", "Lemon"],
      heart: ["Green notes", "Calone", "Lily of the valley", "Jasmine", "Iris"],
      base: ["Musk", "Ambroxan", "Sandalwood", "Vetiver", "Cedarwood"],
    },
    description:
      "Our own creation. A clean, green scent of newly cut grass and leaves, a watery floral heart, and a soft musk that sits close to the skin.",
    longevityHours: [12, 24],
    occasions: ["Sport", "Daily wear", "Smart casual"],
    price: 1699,
    tint: "#7FA36A",
    oneLiner: "Cut grass, green leaves, clean skin.",
  },
];

export const bySlug = (slug: string, list: Scent[] = scents) => list.find((s) => s.slug === slug);

export const genderLabel: Record<Gender, string> = {
  men: "For him",
  women: "For her",
  unisex: "For anyone",
};

export const formatPrice = (pence: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);

export const inspiredLabel = (s: Scent) =>
  s.inspiredBy ? `${s.inspiredBy.brand} ${s.inspiredBy.name}` : "A GK original";

/* ── Search: understands perfume names *and* plain-English likes ("woody, ouds, something sweet") ── */

const STOP = new Set(
  "i im i'm me my we a an the and or but with without of for to in on at it its is are be really very quite so some something anything kind sort like likes love loves loving want wants looking look smell smells smelling scent scents perfume perfumes fragrance fragrances note notes that this those these please more most bit little lot lots strong light ones one type types prefer into enjoy".split(" ")
);

/** A word someone types → the notes/families/tags it should match. */
const SYN: Record<string, string[]> = {
  wood: ["wood", "woody", "cedar", "cedarwood", "sandalwood", "vetiver", "oak", "oakmoss", "cypress", "birch"],
  fresh: ["fresh", "citrus", "bergamot", "lemon", "lime", "grapefruit", "green", "calone", "aquatic", "petitgrain"],
  clean: ["fresh", "musk", "musky", "calone", "green", "clean"],
  citrus: ["citrus", "bergamot", "lemon", "lime", "grapefruit", "petitgrain"],
  sweet: ["sweet", "vanilla", "caramel", "tonka", "gourmand", "cherry", "almond", "maraschino"],
  gourmand: ["gourmand", "vanilla", "caramel", "tonka", "almond", "cherry"],
  vanilla: ["vanilla", "tonka"],
  floral: ["floral", "rose", "jasmine", "peony", "iris", "orchid", "lily", "freesia", "magnolia", "violet", "geranium", "ylang"],
  flower: ["floral", "rose", "jasmine", "peony", "iris", "orchid", "lily", "freesia", "magnolia"],
  rose: ["rose"],
  spice: ["spicy", "spice", "spices", "cardamom", "pepper", "cinnamon", "clove", "nutmeg", "ginger", "saffron", "caraway"],
  spicy: ["spicy", "spice", "spices", "cardamom", "pepper", "cinnamon", "clove", "nutmeg", "ginger", "saffron"],
  fruit: ["fruity", "pineapple", "apple", "pear", "cherry", "blackcurrant", "strawberry"],
  fruity: ["fruity", "pineapple", "apple", "pear", "cherry", "blackcurrant", "strawberry"],
  oud: ["oud", "agarwood"],
  agarwood: ["oud", "agarwood"],
  musk: ["musk", "musky"],
  smoky: ["smoky", "incense", "tobacco", "oud", "myrrh"],
  smoke: ["smoky", "incense", "tobacco"],
  tobacco: ["tobacco"],
  leather: ["leather"],
  amber: ["amber", "ambroxan"],
  boozy: ["boozy", "cognac", "rum", "liqueur"],
  cognac: ["cognac"],
  warm: ["amber", "vanilla", "tonka", "cinnamon", "spicy", "tobacco"],
  cosy: ["amber", "vanilla", "tonka", "cinnamon"],
  cozy: ["amber", "vanilla", "tonka", "cinnamon"],
  dark: ["dark", "oud", "leather", "tobacco", "truffle", "patchouli"],
  green: ["green", "galbanum", "leaf", "grass"],
  aquatic: ["aquatic", "calone"],
  powdery: ["iris", "violet", "musk"],
  cherry: ["cherry", "maraschino"],
  coffee: ["coffee"],
  aromatic: ["aromatic", "lavender", "juniper", "herbs", "geranium"],
  lavender: ["lavender"],
};

const GENDER_WORDS: Record<string, Gender> = {
  men: "men", man: "men", male: "men", him: "men", his: "men", masculine: "men", guy: "men", husband: "men", boyfriend: "men", dad: "men",
  women: "women", woman: "women", female: "women", her: "women", feminine: "women", ladies: "women", wife: "women", girlfriend: "women", mum: "women",
  unisex: "unisex", anyone: "unisex", everyone: "unisex",
};

const TIME_WORDS: Record<string, { mood?: Mood[]; time?: Scent["time"]; occasion?: Occasion[] }> = {
  summer: { mood: ["fresh"] },
  spring: { mood: ["fresh"] },
  winter: { mood: ["warm", "dark", "sweet"] },
  autumn: { mood: ["warm", "dark"] },
  night: { time: "night", occasion: ["Evening out", "Date night"] },
  evening: { time: "night", occasion: ["Evening out"] },
  date: { occasion: ["Date night"] },
  office: { occasion: ["Office"] },
  work: { occasion: ["Office"] },
  day: { time: "day", occasion: ["Daily wear"] },
  daily: { occasion: ["Daily wear"] },
  everyday: { occasion: ["Daily wear"] },
  gym: { occasion: ["Sport"] },
  sport: { occasion: ["Sport"] },
  wedding: { occasion: ["Special occasion"] },
  party: { occasion: ["Evening out"] },
};

const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function stem(w: string) {
  if (SYN[w] || GENDER_WORDS[w] || TIME_WORDS[w]) return w;
  if (w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.endsWith("es") && SYN[w.slice(0, -2)]) return w.slice(0, -2);
  if (w.endsWith("s") && w.length > 3) return w.slice(0, -1);
  if (w.endsWith("y") && SYN[w.slice(0, -1)]) return w.slice(0, -1); // woody -> wood, smoky -> smoke(ish)
  return w;
}

/** The meaningful words in a query — what we log for the shop owner. */
export function queryKeywords(q: string): string[] {
  return [
    ...new Set(
      norm(q)
        .replace(/[^a-z0-9' ]+/g, " ")
        .split(/\s+/)
        .filter((w) => w && !STOP.has(w))
        .map(stem)
        .filter((w) => w.length > 1)
    ),
  ];
}

export function searchScents(q: string, list: Scent[] = scents): Scent[] {
  const words = queryKeywords(q);
  if (!words.length) return [];
  const full = norm(q).trim();
  return list
    .map((s) => {
      const notes = {
        top: s.notes.top.map(norm),
        heart: s.notes.heart.map(norm),
        base: s.notes.base.map(norm),
      };
      const fam = [...s.families, ...(s.tags ?? [])].map(norm);
      const orig = norm(`${s.inspiredBy?.brand ?? ""} ${s.inspiredBy?.name ?? ""}`);
      const name = norm(s.name);
      let score = 0;
      if (full.length > 3 && (orig.includes(full) || name.includes(full))) score += 12;
      for (const w of words) {
        const g = GENDER_WORDS[w];
        if (g) {
          score += s.gender === g ? 4 : s.gender === "unisex" ? 2 : -3;
          continue;
        }
        const tw = TIME_WORDS[w];
        if (tw) {
          if (tw.mood?.includes(s.mood)) score += 2;
          if (tw.time && (s.time === tw.time || s.time === "any")) score += 1;
          if (tw.occasion?.some((o) => s.occasions.includes(o))) score += 2;
          continue;
        }
        if (orig.includes(w)) { score += 6; continue; }
        if (name.includes(w)) { score += 5; continue; }
        const terms = SYN[w] ?? [w];
        let hit = 0;
        for (const t of terms) {
          if (fam.some((f) => f.includes(t))) hit = Math.max(hit, 3);
          if (notes.base.some((n) => n.includes(t))) hit = Math.max(hit, 2.5);
          if (notes.heart.some((n) => n.includes(t))) hit = Math.max(hit, 2);
          if (notes.top.some((n) => n.includes(t))) hit = Math.max(hit, 1.5);
        }
        if (hit === 0 && norm(s.description).includes(w)) hit = 0.5;
        score += hit;
      }
      return { s, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.s);
}

/** Default tags for the launch catalogue (the admin can add as many as it likes per product). */
export function defaultTags(s: Scent): string[] {
  const season = s.mood === "fresh" ? "Summer" : s.mood === "sweet" ? "All year" : "Winter";
  const when = s.time === "night" ? "Night out" : s.time === "day" ? "Daytime" : "Day to night";
  return [...new Set([...s.families, season, when])];
}

for (const s of scents) s.tags ??= defaultTags(s);
