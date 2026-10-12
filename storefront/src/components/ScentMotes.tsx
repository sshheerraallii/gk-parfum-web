"use client";

import { useEffect, useRef } from "react";

/**
 * Soft gold motes drifting upward behind a section, like scent hanging in warm air.
 * Cheap: a few dozen dots, one canvas, and it stops drawing when it's off screen.
 */
export function ScentMotes({ count = 32, className = "" }: { count?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const motes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.8,
      v: 6 + Math.random() * 14, // px per second upward
      sway: Math.random() * Math.PI * 2,
      a: 0.15 + Math.random() * 0.45,
    }));
    let raf = 0;
    let on = false;
    let prev = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.y -= m.v * dt;
        m.sway += dt * 0.6;
        if (m.y < -6) {
          m.y = h + 6;
          m.x = Math.random() * w;
        }
        const x = m.x + Math.sin(m.sway) * 10;
        const g = ctx.createRadialGradient(x, m.y, 0, x, m.y, m.r * 4);
        g.addColorStop(0, `rgba(240,214,160,${m.a})`);
        g.addColorStop(1, "rgba(240,214,160,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, m.y, m.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (on) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (on) {
        prev = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(c);
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    return () => {
      on = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [count]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
