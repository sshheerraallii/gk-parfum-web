/**
 * The hero's moving set: black-and-gold marble, slow drifting pools of amber, copper and rose light,
 * ribbons of light running across it, and a fine film grain. All CSS/SVG — no video to download.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="gk-hero-bg pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="gk-hero-stone absolute inset-[-6%]" />
      <div className="gk-hero-glow gk-hero-glow-a" />
      <div className="gk-hero-glow gk-hero-glow-b" />
      <div className="gk-hero-glow gk-hero-glow-c" />
      <svg className="gk-hero-ribbons absolute inset-0 h-full w-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="gkr1" x1="0" x2="1">
            <stop offset="0" stopColor="#c9a15b" stopOpacity="0" />
            <stop offset=".5" stopColor="#f3d9a0" />
            <stop offset="1" stopColor="#c9a15b" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gkr2" x1="0" x2="1">
            <stop offset="0" stopColor="#d2694a" stopOpacity="0" />
            <stop offset=".5" stopColor="#f0a070" />
            <stop offset="1" stopColor="#d2694a" stopOpacity="0" />
          </linearGradient>
        </defs>
        {RIBBONS.map((r, i) => (
          <g key={i} className="gk-ribbon" style={{ ["--rd" as string]: `${r.delay}s`, ["--rt" as string]: `${r.dur}s` }}>
            {/* soft halo built from wide, faint strokes — no blur filter, so it stays smooth on phones */}
            <path d={r.d} fill="none" stroke={`url(#${r.g})`} strokeWidth={r.w * 9} strokeLinecap="round" opacity=".08" pathLength={100} />
            <path d={r.d} fill="none" stroke={`url(#${r.g})`} strokeWidth={r.w * 4} strokeLinecap="round" opacity=".18" pathLength={100} />
            <path d={r.d} fill="none" stroke={`url(#${r.g})`} strokeWidth={r.w} strokeLinecap="round" pathLength={100} />
          </g>
        ))}
      </svg>
      <div className="gk-hero-grain absolute inset-[-50%]" />
      <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_45%,transparent,rgba(10,8,6,.75))]" />
    </div>
  );
}

const RIBBONS = [
  { d: "M-100 760 C 300 560, 520 900, 900 640 S 1450 380, 1720 520", g: "gkr1", w: 2.2, delay: 0, dur: 9 },
  { d: "M-120 300 C 260 420, 620 160, 980 330 S 1500 560, 1720 360", g: "gkr2", w: 1.6, delay: 2.5, dur: 11 },
  { d: "M-80 560 C 380 420, 700 760, 1060 520 S 1480 240, 1700 300", g: "gkr1", w: 1.2, delay: 5, dur: 13 },
  { d: "M-140 880 C 240 780, 760 980, 1120 820 S 1520 700, 1740 760", g: "gkr2", w: 1.4, delay: 1.2, dur: 10 },
];
