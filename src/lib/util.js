// Client-safe helpers (no fs). Shared by client + server components.

export const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Prefix a public asset path with the GitHub Pages basePath. */
export const asset = (p) => `${BP}${p.startsWith("/") ? "" : "/"}${p}`;

export const tierColor = (t) => (t === 1 ? "var(--tier1)" : "var(--tier2)");
export const tierLabel = (t) =>
  t === 1 ? "Tier 1 · vision-threatening" : "Tier 2 · anatomically-defined";

/** Map a risk-of-bias rating to a CSS class token. */
export const robToken = (r) => {
  const s = (r || "").toLowerCase();
  if (s.includes("low") && s.includes("mod")) return "mod"; // "Low-Moderate" → amber, not green
  if (s.startsWith("low")) return "low";
  if (s.startsWith("mod")) return "mod";
  if (s.startsWith("high") || s.startsWith("serious") || s.startsWith("crit")) return "high";
  return "na";
};

/** Map a JBI item answer (Yes/No/Unclear) to a CSS class token. */
export const ansToken = (a) => {
  const s = (a || "").toLowerCase();
  if (s === "yes") return "yes";
  if (s === "no") return "no";
  return "unclear";
};

export const fmtPct = (n) => (n == null ? "—" : `${(+n).toFixed(1)}%`);
export const fmtCI = (lo, hi) =>
  lo == null || hi == null ? "" : `${(+lo).toFixed(1)}–${(+hi).toFixed(1)}`;

/** Nice ceiling for an axis domain, snapped to `step`. */
export const niceMax = (v, step = 10, min = step) =>
  Math.max(min, Math.ceil((v || 0) / step) * step);
