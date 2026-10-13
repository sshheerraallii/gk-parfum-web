"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Site-wide motion, mounted once in the layout:
 *  - scroll reveals for anything marked data-reveal / data-inview
 *  - the bottle that flies from where you tapped "Add to bag" into the bag, which then opens
 */
export function Motion() {
  useReveal();
  useBagFlight();
  return null;
}

function useReveal() {
  useEffect(() => {
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    const scan = () => {
      document.querySelectorAll("[data-reveal], [data-inview]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    };
    scan();
    // pages change without a reload, so watch for new sections
    let t = 0;
    const mo = new MutationObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(scan, 60);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      window.clearTimeout(t);
    };
  }, []);
}

function useBagFlight() {
  useEffect(() => {
    let last: { x: number; y: number; t: number; el: Element | null } | null = null;
    const onDown = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY, t: Date.now(), el: e.target instanceof Element ? e.target : null };
    };
    document.addEventListener("pointerdown", onDown, true);

    const unsub = useCart.subscribe((state, prev) => {
      if (state.addedAt === prev.addedAt || !state.addedAt) return;
      if (state.open) return; // already looking at the bag
      const open = () => useCart.getState().setOpen(true);
      const bag = document.getElementById("gk-bag");
      const recent = last && Date.now() - last.t < 2000;
      if (reduced() || !bag || !recent) return open();
      fly(last!, bag).then(() => {
        bag.classList.remove("gk-bag-bump");
        void bag.offsetWidth; // restart the bounce
        bag.classList.add("gk-bag-bump");
        window.setTimeout(open, 260);
      });
    });

    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      unsub();
    };
  }, []);
}

/** Clones the bottle nearest the tap and arcs it into the bag icon. */
function fly(from: { x: number; y: number; el: Element | null }, bag: HTMLElement): Promise<void> {
  const card = from.el?.closest("[data-fly]");
  const src = card?.querySelector("[data-fly-src], svg.gk-bottle, img") as HTMLElement | SVGElement | null;
  const r = src?.getBoundingClientRect();
  const start = r && r.width > 0 && r.bottom > 0 && r.top < innerHeight
    ? { x: r.left + r.width / 2, y: r.top + r.height / 2, h: Math.min(r.height, 160) }
    : { x: from.x, y: from.y, h: 90 };
  const b = bag.getBoundingClientRect();
  const end = { x: b.left + b.width / 2, y: b.top + b.height / 2 };

  const node = document.createElement("div");
  node.setAttribute("aria-hidden", "true");
  const h = start.h;
  Object.assign(node.style, {
    position: "fixed",
    left: `${start.x - h * 0.29}px`,
    top: `${start.y - h / 2}px`,
    width: `${h * 0.58}px`,
    height: `${h}px`,
    zIndex: "80",
    pointerEvents: "none",
    filter: "drop-shadow(0 12px 20px rgba(10, 8, 6,.55))",
  });
  const photo = src?.getAttribute("data-fly-src");
  if (photo) {
    const im = document.createElement("img");
    im.src = photo;
    im.setAttribute("style", "width:100%;height:100%;object-fit:contain");
    node.appendChild(im);
  } else if (src) {
    const clone = src.cloneNode(true) as HTMLElement;
    clone.removeAttribute("class");
    clone.setAttribute("style", "width:100%;height:100%;object-fit:contain;overflow:visible");
    node.appendChild(clone);
  } else {
    node.style.borderRadius = "8px";
    node.style.background = "linear-gradient(#2a2a2f,#0a0a0c)";
  }
  document.body.appendChild(node);

  // an arc: up and over, then down into the bag
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lift = Math.min(160, Math.abs(dx) * 0.35 + 80);
  const frames: Keyframe[] = [];
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const p = i / N;
    const x = dx * p;
    const y = dy * p - lift * 4 * p * (1 - p);
    const sc = 1 - 0.78 * p;
    frames.push({ transform: `translate(${x}px, ${y}px) scale(${sc}) rotate(${-14 * Math.sin(p * Math.PI)}deg)`, opacity: p > 0.92 ? 0.4 : 1 });
  }
  const anim = node.animate(frames, { duration: 780, easing: "cubic-bezier(.45,.05,.35,1)", fill: "forwards" });
  return anim.finished.then(
    () => node.remove(),
    () => node.remove(),
  );
}
