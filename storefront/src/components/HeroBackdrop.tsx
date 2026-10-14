/**
 * The hero's set: cool, deep water lit by electric filaments bursting from behind the bottle. Light dances across it, drops fall and ripple out,
 * mint leaves drift on the surface, and condensation beads on the glass in front, a few drops
 * slowly running down. All CSS/SVG over three small textures (tools/hero_water.py) — no video.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="gk-water pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="gk-water-base absolute inset-[-4%]" />
      {/* colour: electric light bursting from behind the bottle — cyan, blue, violet, a touch of amber */}
      <div className="gk-energy gk-energy-a absolute inset-0" />
      <div className="gk-energy gk-energy-b absolute inset-0" />
      {/* two layers of moving light, at different sizes and speeds, so the pattern never visibly repeats */}
      <div className="gk-caustic gk-caustic-a" />
      <div className="gk-caustic gk-caustic-b" />

      {/* drops falling into the water, each followed by ripples */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="gkdrop" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#e9fffb" stopOpacity="0" />
            <stop offset="1" stopColor="#e9fffb" stopOpacity=".9" />
          </linearGradient>
          <linearGradient id="gkleaf" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#7cc48a" />
            <stop offset=".55" stopColor="#3f8f5a" />
            <stop offset="1" stopColor="#24603d" />
          </linearGradient>
        </defs>
        {DRIPS.map((d, i) => (
          <g key={i} style={{ ["--dd" as string]: `${d.delay}s`, ["--dt" as string]: `${d.dur}s` }}>
            <ellipse className="gk-drip-fall" cx={d.x} cy={d.y} rx="3.2" ry="11" fill="url(#gkdrop)" style={{ ["--fall" as string]: `${d.y + 40}px` }} />
            {[0, 0.18, 0.36].map((lag, k) => (
              <ellipse
                key={k}
                className="gk-ripple"
                cx={d.x}
                cy={d.y}
                rx={d.r}
                ry={d.r * 0.32}
                fill="none"
                stroke="#dffaf3"
                strokeWidth={2.2 - k * 0.5}
                style={{ ["--lag" as string]: `${lag}s` }}
              />
            ))}
          </g>
        ))}
        {LEAVES.map((l, i) => (
          <g key={i} className="gk-leaf" style={{ ["--lx" as string]: `${l.dx}px`, ["--ly" as string]: `${l.dy}px`, ["--lt" as string]: `${l.dur}s`, ["--lr" as string]: `${l.rot}deg` }}>
            <g transform={`translate(${l.x} ${l.y}) rotate(${l.a}) scale(${l.s})`}>
              <ellipse cx="4" cy="16" rx="34" ry="9" fill="#021412" opacity=".35" />
              <path d="M-40 0 C -20 -22, 22 -24, 44 0 C 22 22, -20 20, -40 0 Z" fill="url(#gkleaf)" />
              <path d="M-40 0 C -10 -2, 20 -2, 44 0" stroke="#a8e2b3" strokeWidth="1.4" fill="none" opacity=".8" />
              {[-22, -8, 6, 20].map((x) => (
                <g key={x} stroke="#a8e2b3" strokeWidth=".8" opacity=".55" fill="none">
                  <path d={`M${x} 0 Q ${x + 8} -6 ${x + 12} -12`} />
                  <path d={`M${x} 0 Q ${x + 8} 6 ${x + 12} 12`} />
                </g>
              ))}
            </g>
          </g>
        ))}
      </svg>

      {/* condensation on the glass in front, with a few drops slowly running down */}
      <div className="gk-condensation absolute inset-0" />
      {RUNNERS.map((r, i) => (
        <span
          key={i}
          className="gk-runner"
          style={{ left: r.x, top: r.y, ["--rt" as string]: `${r.dur}s`, ["--rd" as string]: `${r.delay}s`, ["--rl" as string]: r.len, width: r.size, height: r.size * 1.25 }}
        />
      ))}

      {/* fade into the page below */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[var(--velvet)]" />
      <div className="absolute inset-0 bg-[radial-gradient(85%_75%_at_50%_45%,transparent,rgba(2,6,22,.45))]" />
    </div>
  );
}

const DRIPS = [
  { x: 1180, y: 760, r: 120, delay: 0.6, dur: 6.5 },
  { x: 420, y: 860, r: 90, delay: 2.8, dur: 7.5 },
  { x: 860, y: 640, r: 70, delay: 4.6, dur: 8.5 },
  { x: 1450, y: 520, r: 80, delay: 1.9, dur: 9 },
];

const LEAVES = [
  { x: 1260, y: 860, a: -18, s: 1.25, dx: -60, dy: -18, rot: 14, dur: 18 },
  { x: 230, y: 700, a: 32, s: 0.95, dx: 50, dy: 20, rot: -18, dur: 22 },
  { x: 960, y: 930, a: 160, s: 0.8, dx: 40, dy: -24, rot: 10, dur: 20 },
];

const RUNNERS = [
  { x: "8%", y: "14%", size: 14, len: "52vh", dur: 14, delay: 1 },
  { x: "91%", y: "8%", size: 18, len: "60vh", dur: 17, delay: 5 },
  { x: "79%", y: "62%", size: 11, len: "30vh", dur: 12, delay: 9 },
];
