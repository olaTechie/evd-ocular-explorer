"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useInView } from "@/lib/useInView";

// Renders the real value on SSR + first paint (accessible, no-JS safe, no
// hydration mismatch). On the client, when scrolled into view and motion is
// allowed, animates 0 -> value. useLayoutEffect resets to 0 before paint so
// there is no flash of the final value.
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function CountUp({ value, decimals = 1, suffix = "%", duration = 520 }) {
  const [ref, inView] = useInView();
  const [display, setDisplay] = useState(value);
  const started = useRef(false);

  useIso(() => {
    if (!inView || started.current) return;
    started.current = true;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(value);
      return;
    }
    let raf, start;
    const tick = (t) => {
      start ??= t;
      const p = Math.min(1, (t - start) / duration);
      setDisplay(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setDisplay(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="countup">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
