"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A sideways-swipe row for phones: cards snap into place, the next card peeks in from the edge,
 * and a thin gold bar shows how far along you are.
 */
export function SwipeRow({ children, label, className = "", tone = "dark" }: { children: ReactNode; label: string; className?: string; tone?: "dark" | "light" }) {
  const ref = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ start: 0, size: 1 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth;
      setPos({ start: max ? el.scrollLeft / max : 0, size: max ? Math.min(1, el.clientWidth / max) : 1 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [children]);

  return (
    <div className={className}>
      <ul
        ref={ref}
        aria-label={label}
        className="no-scrollbar -mx-[var(--gutter)] flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-[var(--gutter)] px-[var(--gutter)] pb-2"
      >
        {children}
      </ul>
      {pos.size < 1 && (
        <div aria-hidden className={`relative mx-auto mt-5 h-[2px] w-24 overflow-hidden rounded-full ${tone === "dark" ? "bg-[var(--line)]" : "bg-[#d9cfbb]"}`}>
          <span
            className="absolute inset-y-0 rounded-full bg-gilt transition-[left] duration-150"
            style={{ left: `${pos.start * 100}%`, width: `${pos.size * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
