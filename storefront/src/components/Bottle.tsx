import { useId } from "react";

/**
 * Placeholder bottle drawn in SVG until the real mockups arrive.
 * Swap for <Image> per product once photography exists (see ProductVisual).
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
        <linearGradient id={`g${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#8A5A1F" />
          <stop offset=".3" stopColor="#E7C47D" />
          <stop offset=".55" stopColor="#B07E36" />
          <stop offset=".75" stopColor="#F4DCA0" />
          <stop offset="1" stopColor="#9C6A28" />
        </linearGradient>
        <linearGradient id={`liq${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tint} stopOpacity=".55" />
          <stop offset="1" stopColor={tint} stopOpacity=".92" />
        </linearGradient>
        <linearGradient id={`glass${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".12" stopColor="#fff" stopOpacity=".04" />
          <stop offset=".8" stopColor="#fff" stopOpacity=".02" />
          <stop offset=".92" stopColor="#fff" stopOpacity=".14" />
          <stop offset="1" stopColor="#fff" stopOpacity=".05" />
        </linearGradient>
        <radialGradient id={`glow${id}`} cx=".5" cy=".55" r=".5">
          <stop offset="0" stopColor={tint} stopOpacity=".35" />
          <stop offset="1" stopColor={tint} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="120" cy="300" rx="120" ry="110" fill={`url(#glow${id})`} />

      {/* cap or atomiser */}
      {cap ? (
        <g>
          <rect x="72" y="18" width="96" height="96" rx="6" fill="#0f0d0b" stroke={`url(#g${id})`} strokeWidth="3" />
          <rect x="80" y="26" width="80" height="80" rx="3" fill="none" stroke={`url(#g${id})`} strokeWidth="1" opacity=".6" />
          <path d="M120 44 l10 22 -10 22 -10 -22z" fill={`url(#g${id})`} opacity=".9" />
        </g>
      ) : (
        <g style={{ transform: pressed ? "translateY(6px)" : "none", transition: "transform .12s ease" }}>
          <rect x="104" y="70" width="32" height="30" rx="4" fill={`url(#g${id})`} />
          <rect x="112" y="58" width="16" height="16" rx="3" fill={`url(#g${id})`} />
          <circle cx="104" cy="82" r="2.4" fill="#1a140c" />
        </g>
      )}
      {/* collar */}
      <rect x="92" y="112" width="56" height="20" rx="3" fill={`url(#g${id})`} />
      <rect x="98" y="128" width="44" height="10" fill="#3a2c18" opacity=".8" />

      {/* glass body */}
      <path d="M40 150 Q40 138 52 138 H188 Q200 138 200 150 V384 Q200 404 180 404 H60 Q40 404 40 384 Z" fill="#1a1612" fillOpacity=".55" stroke="rgba(243,236,223,.35)" strokeWidth="1.5" />
      {/* liquid */}
      <path d="M50 176 H190 V380 Q190 394 176 394 H64 Q50 394 50 380 Z" fill={`url(#liq${id})`} />
      <path d="M50 176 H190" stroke="#fff" strokeOpacity=".25" />
      {/* thick base */}
      <path d="M44 372 H196 V384 Q196 400 180 400 H60 Q44 400 44 384 Z" fill="#fff" fillOpacity=".06" />
      <path d="M40 150 Q40 138 52 138 H188 Q200 138 200 150 V384 Q200 404 180 404 H60 Q40 404 40 384 Z" fill={`url(#glass${id})`} />

      {/* label plate */}
      <rect x="68" y="214" width="104" height="124" rx="2" fill="#0f0d0b" stroke={`url(#g${id})`} strokeWidth="2" />
      <rect x="74" y="220" width="92" height="112" fill="none" stroke={`url(#g${id})`} strokeWidth=".8" opacity=".7" />
      <text x="120" y="262" textAnchor="middle" fill={`url(#g${id})`} fontFamily="var(--font-cormorant), Georgia, serif" fontSize="30" fontWeight="600">GK</text>
      <text x="120" y="284" textAnchor="middle" fill={`url(#g${id})`} fontFamily="var(--font-jost), sans-serif" fontSize="7.5" letterSpacing="2.4">GK PARFUM</text>
      {name ? (
        <text x="120" y="310" textAnchor="middle" fill="#e9d5a5" fontFamily="var(--font-cormorant), Georgia, serif" fontSize={name.length > 18 ? 8.5 : 10.5} fontStyle="italic">
          {name}
        </text>
      ) : null}
      <text x="120" y="324" textAnchor="middle" fill="#a39a8c" fontFamily="var(--font-jost), sans-serif" fontSize="4.6" letterSpacing="0.9">EXTRAIT DE PARFUM · 100 ML</text>
    </svg>
  );
}
