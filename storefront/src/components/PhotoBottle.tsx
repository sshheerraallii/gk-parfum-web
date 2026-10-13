import { useId } from "react";
import type { BottlePhoto } from "@/lib/bottles";

// mist particles (in units of the bottle's own width) — they bloom up and to the left of the nozzle
const MIST = [
  { r: 0.03, dx: -0.19, dy: -0.08, d: 0.32 },
  { r: 0.042, dx: -0.3, dy: -0.14, d: 0.38 },
  { r: 0.025, dx: -0.24, dy: 0.03, d: 0.42 },
  { r: 0.05, dx: -0.4, dy: -0.22, d: 0.46 },
  { r: 0.034, dx: -0.35, dy: -0.03, d: 0.5 },
  { r: 0.058, dx: -0.5, dy: -0.13, d: 0.56 },
  { r: 0.038, dx: -0.17, dy: -0.19, d: 0.6 },
  { r: 0.046, dx: -0.46, dy: -0.29, d: 0.66 },
];

/**
 * The client's real bottle, in layers: glass body, a silver atomiser on the neck, and the cap on top.
 * .gk-open (or hovering a .gk-uncap parent) lifts the cap and puffs a cloud of scent from the nozzle.
 * capOff shows the atomiser ready to spray (the hero).
 */
export function PhotoBottle({
  p,
  tint = "#c9a15b",
  capOff = false,
  pressed = false,
  priority = false,
  alt = "",
  className = "",
}: {
  p: BottlePhoto;
  tint?: string;
  capOff?: boolean;
  pressed?: boolean;
  priority?: boolean;
  alt?: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const { w, h } = p;
  // atomiser geometry, in the image's own pixels
  const cx = p.neckX * w;
  const collar = p.capBottom * h;
  const aw = p.neckW * w * 0.5; // actuator width
  const ah = h * 0.05;
  const stemH = h * 0.025;
  const ay = collar - stemH - ah;
  const nozzle = { x: cx - aw / 2 - 1, y: ay + ah * 0.45 };
  const img = { loading: priority ? ("eager" as const) : ("lazy" as const), decoding: "async" as const, draggable: false };

  return (
    <div className={`gk-pb relative ${className}`} style={{ aspectRatio: `${w} / ${h}` }} data-fly-src={p.whole}>
      <img src={p.body} alt={alt} className="absolute inset-0 h-full w-full select-none object-contain" {...img} />
      {/* silver atomiser — hidden under the cap until it lifts */}
      <svg viewBox={`0 0 ${w} ${h}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={`s${id}`} x1="0" x2="1">
            <stop offset="0" stopColor="#4a4d52" />
            <stop offset=".2" stopColor="#dde1e6" />
            <stop offset=".4" stopColor="#80858c" />
            <stop offset=".6" stopColor="#f3f5f7" />
            <stop offset=".82" stopColor="#6c7178" />
            <stop offset="1" stopColor="#2f3236" />
          </linearGradient>
        </defs>
        <g className="gk-pump" style={{ transform: pressed ? `translateY(${h * 0.012}px)` : "none", transition: "transform .12s ease" }}>
          <rect x={cx - aw * 0.16} y={collar - stemH - 2} width={aw * 0.32} height={stemH + 4} fill={`url(#s${id})`} />
          <rect x={cx - aw / 2} y={ay} width={aw} height={ah} rx={aw * 0.14} fill={`url(#s${id})`} />
          <rect x={cx - aw / 2} y={ay + ah * 0.18} width={aw} height={ah * 0.08} fill="#fff" opacity=".35" />
          <circle cx={nozzle.x + 3} cy={nozzle.y} r={Math.max(2, aw * 0.05)} fill="#16181b" />
        </g>
        <circle data-nozzle cx={nozzle.x} cy={nozzle.y} r="0.5" fill="none" />
      </svg>
      {!capOff && <img src={p.cap} alt="" aria-hidden className="gk-cap-photo absolute inset-0 h-full w-full select-none object-contain" {...img} />}
      {/* the puff of scent */}
      <svg viewBox={`0 0 ${w} ${h}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <filter id={`m${id}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={w * 0.022} />
          </filter>
        </defs>
        <g className="gk-mist" filter={`url(#m${id})`}>
          {MIST.map((m, i) => (
            <circle
              key={i}
              cx={nozzle.x}
              cy={nozzle.y}
              r={m.r * w}
              fill={i % 2 ? "#f3ecdf" : tint}
              style={{ ["--dx" as string]: `${m.dx * w}px`, ["--dy" as string]: `${m.dy * w}px`, ["--d" as string]: `${m.d}s` }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
