"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bottle } from "./Bottle";

/**
 * The hero: an atomiser fires, the mist billows across the room and gathers into the
 * GK PARFUM wordmark, holds, then lets go and drifts as ambient motes.
 * Tap the bottle to spray again. Reduced-motion users get the finished frame.
 */

type P = {
  x: number; y: number; vx: number; vy: number;
  tx: number; ty: number; hasT: boolean;
  age: number; fly: number; life: number;
  size: number; hue: number; a: number; ambient: boolean;
};

const WORDMARK_SRC = "/brand/gk-wordmark-main-foil.svg";
// nozzle tip in Bottle viewBox (240 × 420)
const NOZZLE = { x: 103, y: 82, vbW: 240, vbH: 420 };
// timeline (seconds from press)
const T_HOLD = 1.85;
const T_RELEASE = 3.0;

export function SprayHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const bottleRef = useRef<HTMLButtonElement>(null);
  const [pressed, setPressed] = useState(false);
  const [crisp, setCrisp] = useState(false);
  const [reduced, setReduced] = useState(false);

  const sim = useRef({
    parts: [] as P[],
    targets: [] as { x: number; y: number }[],
    pressAt: -1,
    t: 0,
    dpr: 1,
    w: 0,
    h: 0,
    sprite: null as HTMLCanvasElement | null,
    img: null as HTMLImageElement | null,
    running: true,
    holdFired: false,
    released: false,
  });

  // ── target sampling: rasterise the wordmark into the slot and pick lit pixels ──
  const sampleTargets = useCallback(() => {
    const s = sim.current;
    const slot = slotRef.current;
    const sec = sectionRef.current;
    if (!slot || !sec || !s.img) return;
    const sr = slot.getBoundingClientRect();
    const hr = sec.getBoundingClientRect();
    const w = Math.max(1, Math.round(sr.width));
    const h = Math.max(1, Math.round(sr.height));
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const ctx = off.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(s.img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    const step = w > 520 ? 3 : 2;
    const pts: { x: number; y: number }[] = [];
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (data[(y * w + x) * 4 + 3] > 140) pts.push({ x: x + sr.left - hr.left, y: y + sr.top - hr.top });
      }
    }
    // shuffle so particles don't fill letters left-to-right
    for (let i = pts.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [pts[i], pts[j]] = [pts[j], pts[i]];
    }
    const weak = (navigator.hardwareConcurrency || 8) <= 4;
    const cap = window.innerWidth < 720 ? (weak ? 900 : 1200) : weak ? 1800 : 2600;
    s.targets = pts.slice(0, cap);
  }, []);

  const nozzlePoint = useCallback(() => {
    const b = bottleRef.current?.querySelector("svg");
    const sec = sectionRef.current;
    if (!b || !sec) return { x: 0, y: 0 };
    const br = b.getBoundingClientRect();
    const hr = sec.getBoundingClientRect();
    // SVG uses preserveAspectRatio meet — compute the drawn box
    const scale = Math.min(br.width / NOZZLE.vbW, br.height / NOZZLE.vbH);
    const ox = br.left + (br.width - NOZZLE.vbW * scale) / 2;
    const oy = br.top + (br.height - NOZZLE.vbH * scale) / 2;
    return { x: ox + NOZZLE.x * scale - hr.left, y: oy + NOZZLE.y * scale - hr.top };
  }, []);

  const spray = useCallback(() => {
    const s = sim.current;
    sampleTargets();
    const n = nozzlePoint();
    setPressed(true);
    setCrisp(false);
    window.setTimeout(() => setPressed(false), 160);
    s.pressAt = s.t;
    s.holdFired = false;
    s.released = false;
    const slot = slotRef.current!.getBoundingClientRect();
    const hr = sectionRef.current!.getBoundingClientRect();
    const aimX = slot.left + slot.width * 0.55 - hr.left;
    const aimY = slot.top + slot.height * 0.5 - hr.top;
    const baseAng = Math.atan2(aimY - n.y, aimX - n.x);
    const mobile = window.innerWidth < 720;
    const extra = mobile ? 320 : 800;
    const total = s.targets.length + extra;
    // keep ambient motes, replace everything else
    s.parts = s.parts.filter((p) => p.ambient).slice(0, 80);
    for (let i = 0; i < total; i++) {
      const hasT = i < s.targets.length;
      const spread = (Math.random() - 0.5) * (hasT ? 0.55 : 0.9);
      const ang = baseAng + spread;
      const sp = (mobile ? 380 : 620) + Math.random() * (mobile ? 520 : 900);
      const t = hasT ? s.targets[i] : { x: 0, y: 0 };
      s.parts.push({
        x: n.x + (Math.random() - 0.5) * 3,
        y: n.y + (Math.random() - 0.5) * 3,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        tx: t.x, ty: t.y, hasT,
        age: -Math.random() * 0.38, // staggered emission
        fly: 0.55 + Math.random() * 0.45,
        life: hasT ? 999 : 1.6 + Math.random() * 1.6,
        size: (hasT ? 0.9 : 0.7) + Math.random() * (hasT ? 1.1 : 1.8),
        hue: Math.random(),
        a: 0,
        ambient: false,
      });
    }
  }, [nozzlePoint, sampleTargets]);

  // ── setup ──
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) {
      setCrisp(true);
      return;
    }
    const s = sim.current;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // soft dot sprite
    const sp = document.createElement("canvas");
    sp.width = sp.height = 32;
    const sctx = sp.getContext("2d")!;
    const g = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,240,205,1)");
    g.addColorStop(0.25, "rgba(236,206,140,.85)");
    g.addColorStop(0.6, "rgba(201,161,91,.25)");
    g.addColorStop(1, "rgba(201,161,91,0)");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 32, 32);
    s.sprite = sp;

    const resize = () => {
      const r = sectionRef.current!.getBoundingClientRect();
      s.dpr = Math.min(window.devicePixelRatio || 1, 2);
      s.w = r.width;
      s.h = r.height;
      canvas.width = Math.round(r.width * s.dpr);
      canvas.height = Math.round(r.height * s.dpr);
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      if (s.img) sampleTargets();
      // re-point living particles at the new targets
      let k = 0;
      for (const p of s.parts) if (p.hasT && !s.released) {
        const t = s.targets[k++ % Math.max(1, s.targets.length)];
        if (t) { p.tx = t.x; p.ty = t.y; }
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(sectionRef.current!);

    const img = new Image();
    img.decoding = "async";
    img.src = WORDMARK_SRC;
    let startTimer = 0;
    const start = () => {
      const go = () => (startTimer = window.setTimeout(() => spray(), 250));
      if (document.readyState === "complete") go();
      else window.addEventListener("load", go, { once: true });
    };
    img.onload = () => {
      s.img = img;
      sampleTargets();
      start();
    };

    const io = new IntersectionObserver(([e]) => { s.running = e.isIntersecting; }, { threshold: 0.01 });
    io.observe(sectionRef.current!);

    let raf = 0;
    let slow = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (!s.running) return;
      s.t += dt;
      const since = s.pressAt >= 0 ? s.t - s.pressAt : -1;

      if (since > T_HOLD && !s.holdFired) {
        s.holdFired = true;
        setCrisp(true);
      }
      if (since > T_RELEASE && !s.released) {
        s.released = true;
        for (const p of s.parts) {
          if (p.hasT) {
            p.hasT = false;
            p.life = p.age + 1.4 + Math.random() * 2.2;
            p.vx = (Math.random() - 0.5) * 30;
            p.vy = -12 - Math.random() * 28;
            // a few stay on as ambient motes
            if (Math.random() < 0.035) { p.ambient = true; p.life = 1e9; }
          }
        }
      }

      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      ctx.clearRect(0, 0, s.w, s.h);
      ctx.globalCompositeOperation = "lighter";
      const T = s.t;
      const alive: P[] = [];
      for (const p of s.parts) {
        p.age += dt;
        if (p.age < 0) { alive.push(p); continue; }
        // turbulence: cheap divergence-free-ish field
        const nx = Math.sin(p.y * 0.011 + T * 0.9) + Math.sin((p.x + p.y) * 0.005 - T * 0.6);
        const ny = Math.cos(p.x * 0.009 - T * 0.7) + Math.cos((p.x - p.y) * 0.006 + T * 0.5);

        if (p.hasT && p.age > p.fly) {
          const k = Math.min(1, (p.age - p.fly) / 0.55);
          const K = 34 * k * k;
          const C = 2 * Math.sqrt(K + 0.0001) * 0.92 + 1.5;
          p.vx += ((p.tx - p.x) * K - p.vx * C) * dt;
          p.vy += ((p.ty - p.y) * K - p.vy * C) * dt;
          const jitter = (1 - k) * 60;
          p.vx += nx * jitter * dt;
          p.vy += ny * jitter * dt;
        } else {
          const drag = p.ambient ? 0.6 : 2.4;
          p.vx *= Math.exp(-drag * dt);
          p.vy *= Math.exp(-drag * dt);
          const turb = p.ambient ? 10 : 70;
          p.vx += nx * turb * dt;
          p.vy += ny * turb * dt - (p.ambient ? 4 : 10) * dt; // mist rises a touch
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // fade in quickly, fade out over the last second of life
        const fadeIn = Math.min(1, p.age / 0.12);
        const fadeOut = p.life > 1e8 ? 1 : Math.max(0, Math.min(1, (p.life - p.age) / 1.0));
        const settled = p.hasT && p.age > p.fly + 0.6;
        const base = p.ambient ? 0.35 : settled ? 0.95 : 0.65;
        p.a = fadeIn * fadeOut * base;
        if (p.age > p.life) continue;
        if (p.ambient) {
          if (p.x < -20) p.x = s.w + 10;
          if (p.x > s.w + 20) p.x = -10;
          if (p.y < -20) p.y = s.h + 10;
          if (p.y > s.h + 20) p.y = -10;
        }
        alive.push(p);

        const sz = p.size * (settled ? 2.6 : 3.4);
        ctx.globalAlpha = p.a * (p.hue > 0.85 ? 0.7 : 1);
        ctx.drawImage(s.sprite!, p.x - sz, p.y - sz, sz * 2, sz * 2);
      }
      s.parts = alive;
      slow = slow * 0.9 + (dt > 0.024 ? 1 : 0) * 0.1;
      if (slow > 0.6) {
        s.parts = s.parts.filter((p) => p.hasT || p.ambient || Math.random() > 0.35);
        slow = 0;
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(startTimer);
      ro.disconnect();
      io.disconnect();
    };
  }, [sampleTargets, spray]);

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden"
      style={{ minHeight: "max(640px, calc(100svh - 64px))" }}
      aria-labelledby="hero-title"
    >
      {/* room light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 74% 62%, rgba(201,161,91,.16), transparent 70%), radial-gradient(40% 40% at 20% 30%, rgba(233,213,165,.05), transparent 70%)",
        }}
      />
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 z-10" />

      <div className="wrap relative grid min-h-[inherit] grid-cols-1 items-center gap-6 pb-10 pt-8 md:grid-cols-[1.15fr_.85fr] md:pb-16 md:pt-10">
        <div className="relative z-20 order-2 md:order-1">
          {/* wordmark slot — the mist gathers here */}
          <div
            ref={slotRef}
            className="relative w-full max-w-[640px]"
            style={{ aspectRatio: "389.784 / 62" }}
          >
            <img
              src={WORDMARK_SRC}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full"
              style={{
                opacity: crisp ? 1 : 0,
                transition: reduced ? "none" : "opacity .9s cubic-bezier(.16,1,.3,1)",
                filter: "drop-shadow(0 0 24px rgba(201,161,91,.25))",
              }}
            />
          </div>

          <h1 id="hero-title" className="display-xl hero-reveal mt-10 max-w-[13ch] text-ivory" style={{ ["--d" as string]: "1.1s" }}>
            Luxury perfume, made in the UK
          </h1>
          <p className="lede hero-reveal mt-6" style={{ ["--d" as string]: "1.3s" }}>
            100&nbsp;ml of 40% extrait for £17.99. The scents you already know, built to last all day.
          </p>
          <div className="hero-reveal mt-9 flex flex-wrap gap-3" style={{ ["--d" as string]: "1.5s" }}>
            <Link href="/shop" className="btn btn-gold">Shop all 16 scents</Link>
            <Link href="#find" className="btn btn-ghost">Find my scent</Link>
          </div>
        </div>

        <div className="relative z-0 order-1 flex justify-center md:order-2 md:justify-end">
          <button
            ref={bottleRef}
            type="button"
            onClick={() => !reduced && spray()}
            aria-label="Spray the bottle"
            className="group relative block h-[34svh] max-h-[560px] min-h-[240px] w-auto cursor-pointer md:h-[64svh] md:min-h-[420px]"
          >
            <Bottle cap={false} pressed={pressed} tint="#C9A15B" name="Crimson Luxe" className="h-full w-auto drop-shadow-[0_40px_60px_rgba(0,0,0,.6)]" />
            {!reduced && (
              <span className="hero-reveal small absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-smoke transition-colors group-hover:text-champagne" style={{ ["--d" as string]: "3.2s" }}>
                Tap the bottle
              </span>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
