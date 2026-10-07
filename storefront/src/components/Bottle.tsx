import { useId } from "react";

/**
 * Drawn stand-in for the real bottle: black glass, faceted silver cap, gold crest plate.
 * Replaced by the product photo as soon as one is uploaded in the admin (see ProductVisual).
 */
export function Bottle({
  tint = "#C9A15B",
  name,
  cap = true,
  className,
  pressed = false,
}: {
  tint?: string;
  name?: string;
  cap?: boolean;
  className?: string;
  pressed?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 240 420" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`gold${id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#8A5A1F" />
          <stop offset=".3" stopColor="#E7C47D" />
          <stop offset=".55" stopColor="#B07E36" />
          <stop offset=".75" stopColor="#F4DCA0" />
          <stop offset="1" stopColor="#9C6A28" />
        </linearGradient>
        <linearGradient id={`silver${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#4a4d52" />
          <stop offset=".18" stopColor="#d9dde2" />
          <stop offset=".35" stopColor="#7d828a" />
          <stop offset=".55" stopColor="#f2f4f6" />
          <stop offset=".78" stopColor="#6c7178" />
          <stop offset="1" stopColor="#2f3236" />
        </linearGradient>
        <linearGradient id={`silverTop${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f6f8" />
          <stop offset="1" stopColor="#8b9097" />
        </linearGradient>
        <linearGradient id={`glass${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#1b1b1f" />
          <stop offset=".08" stopColor="#3a3a40" />
          <stop offset=".16" stopColor="#0d0d10" />
          <stop offset=".84" stopColor="#0a0a0c" />
          <stop offset=".93" stopColor="#2c2c32" />
          <stop offset="1" stopColor="#111114" />
        </linearGradient>
        <radialGradient id={`glow${id}`} cx=".5" cy=".6" r=".5">
          <stop offset="0" stopColor={tint} stopOpacity=".35" />
          <stop offset="1" stopColor={tint} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="120" cy="290" rx="120" ry="120" fill={`url(#glow${id})`} />

      {cap ? (
        /* faceted silver cap */
        <g>
          <path d="M66 52 L84 22 H156 L174 52 V100 Q174 112 162 112 H78 Q66 112 66 100 Z" fill={`url(#silver${id})`} />
          <path d="M84 22 H156 L174 52 H66 Z" fill={`url(#silverTop${id})`} opacity=".9" />
          <path d="M98 30 H142 L152 46 H88 Z" fill="#fff" opacity=".35" />
          <path d="M66 52 H174" stroke="#2b2e33" strokeOpacity=".5" />
          <rect x="84" y="112" width="72" height="16" fill="#0b0b0d" />
          <rect x="84" y="112" width="72" height="3" fill="#fff" opacity=".12" />
        </g>
      ) : (
        /* silver atomiser */
        <g style={{ transform: pressed ? "translateY(6px)" : "none", transition: "transform .12s ease" }}>
          <rect x="102" y="66" width="36" height="32" rx="5" fill={`url(#silver${id})`} />
          <rect x="111" y="54" width="18" height="16" rx="3" fill={`url(#silver${id})`} />
          <circle cx="102" cy="80" r="2.4" fill="#16181b" />
          <rect x="84" y="98" width="72" height="30" rx="3" fill={`url(#silver${id})`} />
          <path d="M84 104 H156" stroke="#fff" strokeOpacity=".35" />
        </g>
      )}

      {/* shoulders + body: square black glass */}
      <path d="M44 150 Q44 132 62 130 H178 Q196 132 196 150 V392 Q196 406 182 406 H58 Q44 406 44 392 Z" fill={`url(#glass${id})`} />
      <path d="M50 146 Q52 136 64 135" stroke="#fff" strokeOpacity=".22" strokeWidth="2" fill="none" />
      <rect x="52" y="150" width="5" height="244" rx="2.5" fill="#fff" opacity=".07" />
      <rect x="183" y="150" width="3" height="244" rx="1.5" fill="#fff" opacity=".05" />

      {/* gold crest plate */}
      <rect x="66" y="186" width="108" height="134" rx="2" fill="#070708" stroke={`url(#gold${id})`} strokeWidth="3" />
      <rect x="72" y="192" width="96" height="122" fill="none" stroke={`url(#gold${id})`} strokeWidth=".9" opacity=".75" />
      {[ [72, 192], [168, 192], [72, 314], [168, 314] ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="3.2" fill={`url(#gold${id})`} />
      ))}
      <image href="/brand/gk-emblem-foil-transparent.svg" x="88" y="198" width="64" height="72" preserveAspectRatio="xMidYMid meet" />
      <text x="120" y="286" textAnchor="middle" fill={`url(#gold${id})`} fontFamily="Georgia, 'Times New Roman', serif" fontSize="11" fontWeight="700" letterSpacing="1.6">GK PARFUM</text>
      <text x="120" y="295" textAnchor="middle" fill="#b9975a" fontFamily="Georgia, serif" fontSize="4.6" letterSpacing="1.2">EXTRAIT DE PARFUM</text>
      {name ? (
        <text x="120" y="308" textAnchor="middle" fill="#e9d5a5" fontFamily="Georgia, serif" fontSize={name.length > 18 ? 6.6 : 7.8} fontStyle="italic">
          {name}
        </text>
      ) : null}
      <text x="120" y="346" textAnchor="middle" fill={`url(#gold${id})`} fontFamily="Georgia, serif" fontSize="11">100ml</text>
    </svg>
  );
}
