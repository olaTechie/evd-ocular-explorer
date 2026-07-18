"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { asset, fmtPct, fmtCI, tierColor, niceMax } from "@/lib/util";

/* A prevalence "lane": CI line + prediction interval + point marker, all
   absolutely positioned by percentage so markers never distort with width. */
function Lane({ xmax, lo, hi, value, pi_lo, pi_hi, color, kind = "diamond", size = 12, ticks, h = 30 }) {
  const pos = (v) => `${Math.max(0, Math.min(100, (v / xmax) * 100))}%`;
  const half = size / 2;
  return (
    <div className="lane" style={{ position: "relative", height: h }}>
      {ticks?.map((t) => (
        <div key={t} style={{ position: "absolute", left: pos(t), top: 0, bottom: 0, width: 1,
          background: "var(--border)", opacity: t === 0 ? 0.9 : 0.55 }} />
      ))}
      {pi_lo != null && pi_hi != null && pi_hi > pi_lo && (
        <div style={{ position: "absolute", top: "50%", left: pos(pi_lo), width: `calc(${pos(pi_hi)} - ${pos(pi_lo)})`,
          height: 2, transform: "translateY(-50%)", background: color, opacity: 0.28 }} />
      )}
      {lo != null && hi != null && (
        <>
          <div style={{ position: "absolute", top: "50%", left: pos(lo), width: `calc(${pos(hi)} - ${pos(lo)})`,
            height: 2, transform: "translateY(-50%)", background: color, opacity: 0.7 }} />
          {[lo, hi].map((c, i) => (
            <div key={i} style={{ position: "absolute", top: "50%", left: pos(c), width: 2, height: size * 0.7,
              transform: "translate(-50%,-50%)", background: color, opacity: 0.7 }} />
          ))}
        </>
      )}
      {value != null && (
        <div style={{ position: "absolute", top: "50%", left: pos(value), width: size, height: size,
          transform: `translate(-50%,-50%) rotate(${kind === "diamond" ? 45 : 0}deg)`,
          background: color, borderRadius: 2, boxShadow: "0 0 0 1px rgba(0,0,0,0.12)" }} />
      )}
    </div>
  );
}

const SUB_ORDER = ["era_grp", "examiner_bin", "species_grp", "timing_grp"];

function Detail({ o, xmax, ticks }) {
  const studyMax = niceMax(Math.max(...o.studies.map((s) => s.prevalence), o.ci_hi), 10);
  const sTicks = Array.from({ length: studyMax / 10 + 1 }, (_, i) => i * 10);
  const maxN = Math.max(...o.studies.map((s) => s.n_examined));
  const grouped = SUB_ORDER
    .map((v) => ({ v, label: o.subgroups.find((s) => s.var === v)?.var_label, rows: o.subgroups.filter((s) => s.var === v) }))
    .filter((g) => g.rows.length);

  return (
    <div className="detail">
      {o.plain && <p className="plain">{o.plain}</p>}
      <div className="detail-links">
        <Link href={`/studies/?outcome=${encodeURIComponent(o.outcome)}`}>
          See the {o.k} studies reporting this →
        </Link>
        {o.era_figure && (
          <a href={asset(`/figures/${o.era_figure}`)} target="_blank" rel="noreferrer">
            View by-era forest plot ↗
          </a>
        )}
      </div>
      <div style={{ margin: "10px 0 4px" }}>
        <h5 style={{ margin: 0, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-faint)" }}>
          Contributing studies (k = {o.k})
        </h5>
      </div>
      {o.studies.map((s, i) => (
        <div className="mini-row" key={i} title={s.denominator_note || ""}>
          <span className="mlbl">{s.label}{s.era ? ` · ${s.era}` : ""}</span>
          <Lane xmax={studyMax} value={s.prevalence} color={tierColor(o.tier)} kind="square"
            ticks={sTicks} h={18} size={Math.max(7, Math.min(15, 6 + 10 * Math.sqrt(s.n_examined / maxN)))} />
          <span className="mini-val">{fmtPct(s.prevalence)} · {s.n_cases}/{s.n_examined}</span>
        </div>
      ))}

      {grouped.length > 0 && (
        <div className="subgroup-block">
          <h5>Subgroup estimates (random-effects pooled)</h5>
          {grouped.map((g) => (
            <div key={g.v} style={{ marginBottom: 8 }}>
              <div className="faint" style={{ fontSize: "0.76rem", margin: "6px 0 2px" }}>{g.label}</div>
              {g.rows.map((r, i) => (
                <div className="mini-row" key={i}>
                  <span className="mlbl">{r.group} <span className="faint">(k={r.k})</span></span>
                  <Lane xmax={xmax} value={r.pct} lo={r.ci_lo} hi={r.ci_hi} color={tierColor(o.tier)} kind="diamond" ticks={ticks} h={18} size={11} />
                  <span className="mini-val">{fmtPct(r.pct)} <span className="faint">({fmtCI(r.ci_lo, r.ci_hi)})</span></span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ForestExplorer({ outcomes }) {
  const [tier, setTier] = useState(0); // 0 = all
  const [open, setOpen] = useState(null);

  const xmax = useMemo(() => niceMax(Math.max(...outcomes.map((o) => o.ci_hi)), 10), [outcomes]);
  const ticks = useMemo(() => Array.from({ length: xmax / 10 + 1 }, (_, i) => i * 10), [xmax]);
  const rows = useMemo(
    () => outcomes.filter((o) => tier === 0 || o.tier === tier).sort((a, b) => b.pct - a.pct),
    [outcomes, tier]
  );

  return (
    <div>
      <div className="controls" style={{ marginBottom: 14, justifyContent: "space-between" }}>
        <div className="seg" role="tablist" aria-label="Filter by tier">
          {[[0, "All outcomes"], [1, "Tier 1"], [2, "Tier 2"]].map(([v, l]) => (
            <button key={v} className={tier === v ? "on" : ""} onClick={() => setTier(v)}>{l}</button>
          ))}
        </div>
        <span className="faint" style={{ fontSize: "0.82rem" }}>Click a row for studies &amp; subgroups</span>
      </div>

      <div className="card pad">
        <div className="axis-strip">
          <div className="faint" style={{ fontSize: "0.76rem" }}>Outcome</div>
          <div style={{ position: "relative", height: 16 }}>
            {ticks.map((t) => (
              <span key={t} className="faint" style={{ position: "absolute", left: `${(t / xmax) * 100}%`,
                transform: "translateX(-50%)", fontSize: "0.72rem" }}>{t}</span>
            ))}
            <span className="faint" style={{ position: "absolute", right: 0, top: 18, fontSize: "0.7rem" }}>prevalence (%)</span>
          </div>
          <div className="faint" style={{ fontSize: "0.76rem", textAlign: "right" }}>Pooled (95% CI)</div>
        </div>

        {rows.map((o) => {
          const isOpen = open === o.outcome;
          return (
            <div key={o.outcome}>
              <div className={`forest-row${isOpen ? " open" : ""}`} onClick={() => setOpen(isOpen ? null : o.outcome)}
                role="button" tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpen(isOpen ? null : o.outcome))}>
                <div className="forest-label">
                  <span className="chev">▶</span>
                  <span>{o.outcome}</span>
                  <span className={`badge t${o.tier}`}>T{o.tier}</span>
                </div>
                <Lane xmax={xmax} value={o.pct} lo={o.ci_lo} hi={o.ci_hi} pi_lo={o.pi_lo} pi_hi={o.pi_hi}
                  color={tierColor(o.tier)} ticks={ticks} h={30} size={13} />
                <div className="forest-stat">
                  <div className="val">{fmtPct(o.pct)}</div>
                  <div className="sub">{fmtCI(o.ci_lo, o.ci_hi)} · k={o.k} · I²={Math.round(o.i2)}%</div>
                </div>
              </div>
              {isOpen && <Detail o={o} xmax={xmax} ticks={ticks} />}
            </div>
          );
        })}
      </div>
      <p className="count-note">
        Diamond = pooled prevalence; whisker = 95% CI; faint bar = 95% prediction interval. Squares in the expanded
        view are individual studies, sized by number examined. Prevalence via Freeman–Tukey / DerSimonian–Laird.
      </p>
    </div>
  );
}
