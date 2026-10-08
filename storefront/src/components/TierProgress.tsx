"use client";

import type { Offers } from "@/lib/offers";

/** Three-step bundle meter: 1 bottle → 2 save 10% → 3 free delivery. */
export function TierProgress({ count, offers, tone = "dark" }: { count: number; offers: Offers; tone?: "dark" | "light" }) {
  const t = offers.tiers;
  if (!t.enabled) return null;
  const steps = [
    { at: 1, label: "1 bottle", reward: "Full price" },
    { at: t.discountQty, label: `${t.discountQty} bottles`, reward: `Save ${t.discountPct}%` },
    { at: t.freeShipQty, label: `${t.freeShipQty} bottles`, reward: `${t.discountPct}% off + free delivery` },
  ];
  const max = steps[steps.length - 1].at;
  const pct = Math.min(100, ((Math.min(count, max) - 1) / (max - 1)) * 100);
  const light = tone === "light";
  return (
    <div>
      <div className="relative mx-3 h-1.5 rounded-full" style={{ background: light ? "rgba(13,28,71,.12)" : "rgba(8,20,64,.6)" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#b88c45] to-[#ecd6a2] transition-[width] duration-700"
          style={{ width: `${count < 1 ? 0 : pct}%` }}
        />
        {steps.map((s, i) => {
          const done = count >= s.at;
          return (
            <span
              key={i}
              aria-hidden
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-colors"
              style={{
                left: `${(i / (steps.length - 1)) * 100}%`,
                background: done ? "#c9a15b" : light ? "#fff" : "#11286a",
                borderColor: done ? "#ecd6a2" : light ? "rgba(13,28,71,.25)" : "rgba(214,224,255,.3)",
              }}
            />
          );
        })}
      </div>
      <ol className="mt-3 grid grid-cols-3 text-center text-[0.8rem] leading-tight">
        {steps.map((s, i) => (
          <li key={i} className={i === 0 ? "text-left" : i === 2 ? "text-right" : ""}>
            <span className={`block ${light ? "text-ink" : "text-ivory"} ${count >= s.at ? "font-medium" : ""}`}>{s.label}</span>
            <span className={light ? "text-ink-soft" : "text-smoke"}>{s.reward}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
