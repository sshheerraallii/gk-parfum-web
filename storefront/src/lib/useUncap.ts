"use client";

import { useEffect, useRef } from "react";

/**
 * Phones have no hover, so the cap comes off on its own the first time the bottle is properly on screen:
 * lift, puff of scent, cap back on. Desktops get the same on hover (pure CSS, .gk-uncap:hover).
 */
export function useUncapOnView<T extends HTMLElement>(delay = 250) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(hover: hover)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timers: number[] = [];
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        timers = [
          window.setTimeout(() => el.classList.add("gk-open"), delay),
          window.setTimeout(() => el.classList.remove("gk-open"), delay + 2300),
        ];
      },
      { threshold: 0.7 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [delay]);
  return ref;
}

/** Desktop: the card tips toward the pointer and a glint follows it across the glass. */
export const tiltHandlers = {
  onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(px - 0.5) * 8}deg`);
    el.style.setProperty("--rx", `${(0.5 - py) * 8}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  },
  onPointerLeave(e: React.PointerEvent<HTMLElement>) {
    const el = e.currentTarget;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  },
};
