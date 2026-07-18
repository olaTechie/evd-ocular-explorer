"use client";
import { useEffect, useMemo, useState } from "react";
import { robToken, ansToken, fmtPct } from "@/lib/util";

const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();

function Select({ label, value, onChange, options }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">{label}: all</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

const COLS = [
  { k: "author", label: "Study", get: (s) => `${s.author} ${s.year || ""}` },
  { k: "country", label: "Country", get: (s) => s.country || "—" },
  { k: "outbreak", label: "Outbreak", get: (s) => s.outbreak || "—" },
  { k: "species", label: "Species", get: (s) => s.species || "—" },
  { k: "design", label: "Design", get: (s) => s.design || "—" },
  { k: "n_eye_exam", label: "N exam", get: (s) => s.n_eye_exam, num: true },
  { k: "examiner", label: "Examiner", get: (s) => s.examiner || "—" },
  { k: "rob", label: "RoB", get: (s) => s.rob || "—" },
  { k: "nout", label: "Outcomes", get: (s) => s.outcomes.length, num: true },
];

export default function StudyExplorer({ studies }) {
  const [q, setQ] = useState("");
  const [outcome, setOutcome] = useState("");
  const [species, setSpecies] = useState("");
  const [examiner, setExaminer] = useState("");
  const [rob, setRob] = useState("");
  const [pooled, setPooled] = useState("");
  const [sort, setSort] = useState({ k: "author", dir: 1 });
  const [openId, setOpenId] = useState(null);

  // Deep-link support: ?outcome=<name> (from the forest) and ?study=<id> (from References).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oc = params.get("outcome");
    if (oc) setOutcome(oc);
    const st = params.get("study");
    if (st) {
      setOpenId(st);
      requestAnimationFrame(() => {
        const el = document.getElementById(`study-${st}`);
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    }
  }, []);

  const opts = useMemo(
    () => ({
      outcome: uniq(studies.flatMap((s) => s.outcomes.map((o) => o.outcome))),
      species: uniq(studies.map((s) => s.species)),
      examiner: uniq(studies.map((s) => s.examiner)),
      rob: uniq(studies.map((s) => s.rob)),
      pooled: uniq(studies.map((s) => s.pooled)),
    }),
    [studies]
  );

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let r = studies.filter((s) => {
      if (outcome && !s.outcomes.some((o) => o.outcome === outcome)) return false;
      if (species && s.species !== species) return false;
      if (examiner && s.examiner !== examiner) return false;
      if (rob && s.rob !== rob) return false;
      if (pooled && s.pooled !== pooled) return false;
      if (ql) {
        const hay = `${s.label} ${s.author} ${s.country} ${s.journal || ""} ${s.species}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
    const col = COLS.find((c) => c.k === sort.k) || COLS[0];
    r = [...r].sort((a, b) => {
      const va = col.get(a), vb = col.get(b);
      if (col.num) return ((va || 0) - (vb || 0)) * sort.dir;
      return String(va).localeCompare(String(vb)) * sort.dir;
    });
    return r;
  }, [studies, q, outcome, species, examiner, rob, pooled, sort]);

  const toggleSort = (k) => setSort((s) => (s.k === k ? { k, dir: -s.dir } : { k, dir: 1 }));
  const reset = () => { setQ(""); setOutcome(""); setSpecies(""); setExaminer(""); setRob(""); setPooled(""); };

  return (
    <div>
      <div className="controls" style={{ marginBottom: 12 }}>
        <input className="search" placeholder="Search author, country, journal…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select label="Outcome" value={outcome} onChange={setOutcome} options={opts.outcome} />
        <Select label="Species" value={species} onChange={setSpecies} options={opts.species} />
        <Select label="Examiner" value={examiner} onChange={setExaminer} options={opts.examiner} />
        <Select label="RoB" value={rob} onChange={setRob} options={opts.rob} />
        <Select label="Pooled" value={pooled} onChange={setPooled} options={opts.pooled} />
        {(q || outcome || species || examiner || rob || pooled) && (
          <button className="icon-btn" style={{ width: "auto", padding: "0 12px" }} onClick={reset}>Clear</button>
        )}
      </div>
      {outcome && (
        <p style={{ marginTop: 0 }}>
          <span className="filter-note">
            Showing studies that reported <strong>&nbsp;{outcome}</strong>
            <button onClick={() => setOutcome("")} aria-label="Clear outcome filter">✕</button>
          </span>
        </p>
      )}
      <p className="count-note" style={{ marginTop: 0 }}>
        Showing <strong>{rows.length}</strong> of {studies.length} studies. Click any row for full characteristics and
        item-level risk of bias.
      </p>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th
                  key={c.k}
                  onClick={() => toggleSort(c.k)}
                  className={c.num ? "num" : ""}
                  tabIndex={0}
                  role="button"
                  aria-sort={sort.k === c.k ? (sort.dir > 0 ? "ascending" : "descending") : "none"}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSort(c.k); } }}
                >
                  {c.label} <span className="arrow">{sort.k === c.k ? (sort.dir > 0 ? "▲" : "▼") : "⇅"}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const open = openId === s.id;
              return (
                <FragmentRow key={s.id} s={s} open={open} onToggle={() => setOpenId(open ? null : s.id)} />
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={COLS.length} style={{ textAlign: "center", padding: 28 }} className="muted">No studies match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentRow({ s, open, onToggle }) {
  return (
    <>
      <tr
        id={`study-${s.id}`}
        className={open ? "open" : ""}
        onClick={onToggle}
        tabIndex={0}
        role="button"
        aria-expanded={open}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
      >
        <td data-label="Study"><strong>{s.author}</strong> {s.year} <span className="faint" style={{ fontFamily: "var(--mono)", fontSize: "0.75rem" }}>{s.id}</span></td>
        <td data-label="Country">{s.country || "—"}</td>
        <td data-label="Outbreak">{s.outbreak || "—"}</td>
        <td data-label="Species">{s.species || "—"}</td>
        <td data-label="Design">{s.design || "—"}</td>
        <td data-label="N exam" className="num">{s.n_eye_exam ?? "—"}</td>
        <td data-label="Examiner">{s.examiner || "—"}</td>
        <td data-label="RoB"><span className={`pill ${robToken(s.rob)}`}>{s.rob || "—"}</span></td>
        <td data-label="Outcomes" className="num">{s.outcomes.length}</td>
      </tr>
      {open && (
        <tr className="detail-cell">
          <td colSpan={9} className="detail-td">
            <div style={{ padding: "6px 4px 12px" }}>
              <div className="kv">
                {s.journal && <div><b>Journal:</b> {s.journal}</div>}
                <div><b>Enrolled:</b> {s.n_enrolled ?? "—"}</div>
                <div><b>Eye-examined:</b> {s.n_eye_exam ?? "—"}</div>
                <div><b>Timing:</b> {s.timing || "—"}</div>
                <div><b>Ocular exam:</b> {s.ocular_exam || "—"}</div>
                <div><b>Pooled:</b> {s.pooled || "—"}</div>
                <div><b>Source-verified:</b> {s.verified || "—"}</div>
              </div>
              {s.caveat && <p className="muted" style={{ margin: "6px 0 10px", fontSize: "0.88rem" }}><b style={{ color: "var(--text-soft)" }}>Caveat: </b>{s.caveat}</p>}

              {s.outcomes.length > 0 && (
                <>
                  <h5 style={{ margin: "8px 0 4px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-faint)" }}>Outcomes reported ({s.outcomes.length})</h5>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {s.outcomes.map((o, i) => (
                      <span key={i} className={`badge t${o.tier}`}>{o.outcome}: {o.prevalence != null ? fmtPct(o.prevalence) : "—"} ({o.n_cases}/{o.n_examined})</span>
                    ))}
                  </div>
                </>
              )}

              {s.rob_detail && (
                <>
                  <h5 style={{ margin: "8px 0 4px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-faint)" }}>
                    Risk of bias — {s.rob_detail.tool} · {s.rob_detail.total} · <span className={`pill ${robToken(s.rob_detail.overall)}`}>{s.rob_detail.overall}</span>
                  </h5>
                  <div className="rob-grid">
                    {s.rob_detail.items.map((it, i) => (
                      <div className="rob-item" key={i}>
                        <span>{it.q}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-soft)" }}>
                          <span className={`dot ${ansToken(it.ans)}`} /> {it.ans}
                        </span>
                      </div>
                    ))}
                  </div>
                  {s.rob_detail.notes && <p className="faint" style={{ margin: "6px 0 0", fontSize: "0.82rem" }}>{s.rob_detail.notes}</p>}
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
