/**
 * Fragrance guides — long-tail SEO content. Each body is a list of blocks so the page
 * can render headings, paragraphs and product links without a markdown dependency.
 */
export type Block = { h?: string; p?: string; list?: string[]; scents?: string[] };

export interface Guide {
  slug: string;
  title: string;
  description: string;
  published: string;
  blocks: Block[];
}

export const guides: Guide[] = [
  {
    slug: "extrait-vs-eau-de-parfum",
    title: "Extrait de parfum vs eau de parfum: what's the difference?",
    description:
      "Parfum, extrait, EDP, EDT — the names describe how much fragrance oil is in the bottle. Here's what each means for how long a scent lasts and how strong it smells.",
    published: "2026-10-07",
    blocks: [
      {
        p: "The words on a perfume bottle — extrait, eau de parfum, eau de toilette — describe one thing: how much fragrance oil is mixed into the alcohol. More oil generally means a scent that lasts longer and sits closer to the skin for more of the day.",
      },
      { h: "The usual strengths" },
      {
        list: [
          "Eau de cologne: roughly 2–5% oil. Fresh and light, often gone in two hours.",
          "Eau de toilette (EDT): roughly 5–15%. A day-time strength that fades by the afternoon.",
          "Eau de parfum (EDP): roughly 15–20%. The most common strength for designer perfume.",
          "Extrait de parfum: 20–40% oil. The richest form, made to last well into the evening.",
        ],
      },
      { h: "Why GK Parfum is extrait" },
      {
        p: "Every GK bottle is extrait de parfum with 40% fragrance oil — the top of the range. It's why most of our scents last 7 to 12 hours on skin, and why one or two sprays is usually enough.",
      },
      { h: "Does stronger mean louder?" },
      {
        p: "Not always. Concentration mostly affects how long a scent lasts. How far it projects depends on the notes: fresh citrus scents tend to stay closer to the skin, while amber, oud and spice carry further. If you're new to extrait, start with one spray on the neck and one on the wrist.",
      },
      { scents: ["crimson-luxe", "oud-heritage", "royal-adventure"] },
    ],
  },
  {
    slug: "make-perfume-last-longer",
    title: "How to make your perfume last longer: 7 habits that work",
    description:
      "Simple, practical ways to get more hours out of every spray — where to apply, what to put on first, and how to store your bottle.",
    published: "2026-10-07",
    blocks: [
      {
        p: "A scent's life on your skin depends on the formula, your skin and the weather — but a few habits make a real difference. Here are the ones that work, in the order you'd do them.",
      },
      {
        list: [
          "Moisturise first. Fragrance holds better on hydrated skin. An unscented lotion is ideal.",
          "Spray straight after a shower, when skin is warm and pores are open.",
          "Aim for pulse points: the neck, behind the ears, inner wrists and inner elbows.",
          "Don't rub your wrists together. It warms the top notes and makes them fade faster.",
          "Spray your clothes lightly too. Fabric holds scent for hours — test on a hidden spot first.",
          "Keep the bottle out of sunlight and away from the bathroom's heat and steam.",
          "Choose a stronger concentration. Extrait de parfum lasts far longer than eau de toilette.",
        ],
      },
      { h: "Which notes last longest?" },
      {
        p: "Base notes — woods, amber, musk, vanilla, oud — are the ones still on your skin at the end of the day. Scents built around them naturally last longer than bright citrus scents.",
      },
      { scents: ["angels-cognac", "amber-levant-luxe", "desert-nectar-elixir"] },
    ],
  },
  {
    slug: "best-inspired-perfumes-for-men-uk",
    title: "The best inspired perfumes for men in the UK (2026)",
    description:
      "Designer scents men love — Aventus, Sauvage Elixir, Oud Wood, Althaïr — and the GK Parfum versions that smell like them for £16.99–£17.99 per 100ml.",
    published: "2026-10-07",
    blocks: [
      {
        p: "Some men's fragrances become classics because they work almost everywhere: the office, a dinner, a wedding. These are the designer scents our customers ask about most, with the GK version of each and when to wear it.",
      },
      { h: "For the office and every day" },
      {
        p: "Royal Adventure is our take on Creed Aventus — pineapple and bergamot over oakmoss and woods. Altair Mystique, inspired by Parfums de Marly Althaïr, is a smoother, iris-and-bergamot option that suits a suit.",
      },
      { scents: ["royal-adventure", "altair-mystique"] },
      { h: "For evenings and cold weather" },
      {
        p: "Desert Nectar Elixir, inspired by Dior Sauvage Elixir, is spicy and warm with tobacco and amber. Oud Heritage, inspired by Tom Ford Oud Wood, is smoky oud and sandalwood — rich without being heavy.",
      },
      { scents: ["desert-nectar-elixir", "oud-heritage"] },
      { h: "Something different" },
      {
        p: "King's Code, inspired by Dolce & Gabbana K, opens with cardamom and ginger and dries down to leather and woods. It's bold, and it lasts.",
      },
      { scents: ["kings-code"] },
    ],
  },
];

export const guideBySlug = (slug: string) => guides.find((g) => g.slug === slug);
