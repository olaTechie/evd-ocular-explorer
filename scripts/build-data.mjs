// ---------------------------------------------------------------------------
// build-data.mjs — transforms the corrected source CSVs into static JSON that
// the site reads at build time. Deterministic: no network, no runtime data.
// Source of truth: data-src/meta_clean_corrected.csv (+ appendix1/2, table1,
// pooled & subgroup estimates). The old meta_clean.csv is never read.
// ---------------------------------------------------------------------------
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "data-src");
const OUT = path.join(ROOT, "public", "data");
const FIG = path.join(ROOT, "public", "figures");
fs.mkdirSync(OUT, { recursive: true });

// --- RFC-4180-ish CSV parser (handles quoted fields, commas, escaped quotes) --
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", i = 0, inQ = false;
  text = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
}
function readTable(name) {
  const rows = parseCSV(fs.readFileSync(path.join(SRC, name), "utf8"));
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o = {};
    header.forEach((h, j) => (o[h] = (r[j] ?? "").trim()));
    return o;
  });
}
const NA = new Set(["", "None", "NA", "Not stated", "Not Stated", "not stated"]);
const clean = (v) => (NA.has((v ?? "").trim()) ? null : v.trim());
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };

// --- study-label tidy (mirrors the R forest scripts) ------------------------
function tidyAuthor(a) {
  a = (a || "").replace(/\.pdf$/i, "").trim();
  const map = { eghrari: "Eghrari", de: "de St Maurice", Group: "PREVAIL III", Van: "Van Nguyen" };
  return map[a] || a;
}
const idOf = (s) => (s.match(/S\d+/) || [""])[0];

// ---------------------------------------------------------------------------
// Load sources
// ---------------------------------------------------------------------------
let meta = readTable("meta_clean_corrected.csv");
meta = meta.filter((r) => !/^EXCLUDE/i.test((r.exclusion_note || "").trim()));
const appx1 = readTable("appendix1_study_characteristics.csv");
const rob = readTable("appendix2_rob.csv");
const t1 = readTable("table1_study_characteristics.csv");
const pooled = readTable("pooled_estimates_corrected.csv");
const subg = readTable("subgroup_results_corrected.csv");

const journalById = Object.fromEntries(t1.map((r) => [r.Study_ID, clean(r.Journal)]));
const TIER_OF = {};
for (const r of meta) if (!TIER_OF[r.outcome]) TIER_OF[r.outcome] = r.tier === "Tier1" ? 1 : 2;

// ---------------------------------------------------------------------------
// 1) outcomes.json — 13 pooled outcomes + contributing studies + subgroups
// ---------------------------------------------------------------------------
const contribByOutcome = {};
for (const r of meta) {
  const nc = num(r.n_cases), ne = num(r.n_examined);
  if (nc == null || ne == null || ne <= 0) continue;
  (contribByOutcome[r.outcome] ||= []).push({
    study_id: r.study_id,
    label: `${tidyAuthor(r.first_author)} (${r.year_published})`,
    n_cases: nc,
    n_examined: ne,
    prevalence: +(100 * nc / ne).toFixed(1),
    era: clean(r.outbreak_era),
    examiner: clean(r.examiner_type),
    species: clean(r.species),
    timing: clean(r.assessment_timing),
    rob: clean(r.rob_rating),
    denominator_note: clean(r.denominator_note),
  });
}
const SUBG_LABEL = {
  era_grp: "Outbreak era", examiner_bin: "Examiner", species_grp: "Species", timing_grp: "Assessment timing",
};
const subgByOutcome = {};
for (const r of subg) {
  (subgByOutcome[r.outcome] ||= []).push({
    var: r.subgroup_var, var_label: SUBG_LABEL[r.subgroup_var] || r.subgroup_var,
    group: r.group, k: num(r.k), pct: num(r.pool_pct),
    ci_lo: num(r.ci_lo), ci_hi: num(r.ci_hi), i2: num(r.I2),
  });
}
const FIG_ERA = {
  "Uveitis (any)": "uveitis_any_", "Cataract (any)": "cataract_any_", "Visual impairment": "visual_impairment",
  Blindness: "blindness", "Anterior uveitis": "anterior_uveitis", "Posterior uveitis": "posterior_uveitis",
  Panuveitis: "panuveitis", Chorioretinitis: "chorioretinitis", "GRD / Ebola retinal lesion": "grd_ebola_retinal_lesion",
  "Retinal detachment": "retinal_detachment", "Optic neuropathy": "optic_neuropathy",
  "Vitreous opacities": "vitreous_opacities", Glaucoma: "glaucoma",
};

// Plain-language summary per outcome (casual-reader tier). %PCT%/%ONEIN%/%K% are
// filled from the pooled data so the words never drift from the numbers.
const PLAIN = {
  "Uveitis (any)":
    "Uveitis means inflammation inside the eye — it is the most frequently reported eye problem in Ebola survivors. Across %K% studies, about %PCT% of examined survivors (roughly 1 in %ONEIN%) had some form of uveitis, though estimates varied widely. Untreated uveitis can threaten sight, which is the main reason survivors are advised to have their eyes checked.",
  "Cataract (any)":
    "A cataract is a clouding of the eye's natural lens that blurs vision. About %PCT% of examined survivors (around 1 in %ONEIN%, from %K% studies) were found to have one. Some follow the inflammation that can occur after Ebola; cataracts are treatable with surgery once any active inflammation has settled.",
  "Visual impairment":
    "This is reduced vision that stops short of blindness. Roughly %PCT% of examined survivors were affected across %K% studies, but studies defined and measured it differently, so the figure is uncertain.",
  "Blindness":
    "Blindness here means severe, often irreversible vision loss in at least one eye, usually following severe intraocular inflammation. About %PCT% of examined survivors were affected across %K% studies. The number is sensitive to whether studies counted affected eyes or affected people — counting whole persons gives a lower figure (see the manuscript's sensitivity analysis).",
  "Anterior uveitis":
    "Anterior uveitis is inflammation at the front of the eye, and the commonest uveitis subtype after Ebola — seen in about %PCT% of examined survivors (%K% studies). It is often the most treatable form when caught early.",
  "Posterior uveitis":
    "Posterior uveitis affects the back of the eye, including the retina, and was reported in about %PCT% of examined survivors (%K% studies). Because it involves the retina, it carries a greater risk to vision than front-of-eye inflammation.",
  "Panuveitis":
    "Panuveitis is inflammation involving the whole eye. It was the least common uveitis subtype (about %PCT%, %K% studies) but tends to be the most severe.",
  "Chorioretinitis":
    "Chorioretinitis is inflammation of the retina and the layer beneath it. It was reported in about %PCT% of examined survivors, mostly in more recent, ophthalmologist-led studies (%K% in total).",
  "GRD / Ebola retinal lesion":
    "This is a distinctive retinal scar that follows the layout of the eye's nerve fibres — sometimes called the Ebola retinal lesion. Around %PCT% of survivors had it in the %K% studies that looked for it specifically. It appears characteristic of Ebola and usually spares central vision.",
  "Retinal detachment":
    "Retinal detachment, where the retina peels away and can cause sudden vision loss, was uncommon (about %PCT%, %K% studies) and usually a complication of severe inflammation.",
  "Optic neuropathy":
    "This is damage to the optic nerve, which carries signals from the eye to the brain. It was reported in about %PCT% of examined survivors (%K% studies) and can permanently reduce vision.",
  "Vitreous opacities":
    "These are floaters and haze in the eye's clear gel, often left behind by inflammation. About %PCT% of examined survivors were affected (%K% studies).",
  "Glaucoma":
    "Glaucoma involves raised pressure inside the eye that can damage the optic nerve. About %PCT% of survivors were affected, but from only %K% studies with very different results, so this estimate is highly uncertain.",
};
const plainFor = (outcome, pct, k) => {
  const t = PLAIN[outcome];
  if (!t) return null;
  const oneIn = pct > 0 ? Math.round(100 / pct) : null;
  return t.replace(/%PCT%/g, `${(+pct).toFixed(1)}%`).replace(/%ONEIN%/g, oneIn ?? "—").replace(/%K%/g, k);
};
const outcomes = pooled.map((r) => {
  const studies = (contribByOutcome[r.outcome] || []).sort((a, b) => b.prevalence - a.prevalence);
  const eraFig = FIG_ERA[r.outcome] ? `eFigure_forest_${FIG_ERA[r.outcome]}_by_era.png` : null;
  return {
    outcome: r.outcome, tier: TIER_OF[r.outcome] || 2,
    k: num(r.k), pct: num(r.pool_pct), ci_lo: num(r.ci_lo), ci_hi: num(r.ci_hi),
    pi_lo: num(r.pi_lo), pi_hi: num(r.pi_hi), i2: num(r.I2), tau2: num(r.tau2),
    n_total: studies.reduce((s, x) => s + x.n_examined, 0),
    plain: plainFor(r.outcome, num(r.pool_pct), num(r.k)),
    subgroups: subgByOutcome[r.outcome] || [],
    studies,
    era_figure: eraFig && fs.existsSync(path.join(FIG, eraFig)) ? eraFig : null,
  };
});

// ---------------------------------------------------------------------------
// 2) studies.json — 53 studies (appendix1) + RoB detail + outcomes contributed
// ---------------------------------------------------------------------------
const robById = Object.fromEntries(rob.map((r) => [r.Study_ID, r]));
const outcomesByStudy = {};
for (const r of meta) {
  const nc = num(r.n_cases), ne = num(r.n_examined);
  (outcomesByStudy[r.study_id] ||= []).push({
    outcome: r.outcome, tier: r.tier === "Tier1" ? 1 : 2,
    n_cases: nc, n_examined: ne,
    prevalence: nc != null && ne ? +(100 * nc / ne).toFixed(1) : null,
  });
}
const ROB_Q = [
  ["Q1: Sample frame", "Sample frame appropriate"], ["Q2: Sampling method", "Sampling method"],
  ["Q3: Sample size", "Adequate sample size"], ["Q4: Subjects described", "Subjects & setting described"],
  ["Q5: Data analysis", "Coverage of data analysis"], ["Q6: Standard criteria", "Valid condition measurement"],
  ["Q7: Reliable measurement", "Reliable condition measurement"], ["Q8: Statistical analysis", "Appropriate statistics"],
  ["Q9: Response rate", "Adequate response rate"],
];
const studies = appx1.map((s) => {
  const id = idOf(s.Study);
  const rb = robById[id];
  const nExam = num(s.N_eye_exam);
  return {
    id, label: s.Study, country: clean(s.Country), outbreak: clean(s.Outbreak),
    species: clean(s.Species), design: clean(s.Design),
    n_enrolled: num(s.N_enrolled), n_eye_exam: nExam,
    timing: clean(s.Timing), examiner: clean(s.Examiner), ocular_exam: clean(s.Ocular_exam),
    rob: clean(s.RoB), pooled: clean(s.Pooled), verified: clean(s.Verified),
    caveat: clean(s.Key_caveat), journal: journalById[id] || null,
    year: (s.Study.match(/(19|20)\d{2}/) || [null])[0],
    author: tidyAuthor((s.Study.split("·")[1] || "").trim().replace(/\s*(19|20)\d{2}.*$/, "")),
    outcomes: outcomesByStudy[id] || [],
    rob_detail: rb
      ? {
          tool: rb.RoB_Tool, total: rb["JBI Total Score"], overall: rb["Overall RoB"],
          notes: clean(rb.Notes),
          items: ROB_Q.map(([k, lbl]) => ({ q: lbl, ans: (rb[k] || "").trim() })),
        }
      : null,
  };
});

// ---------------------------------------------------------------------------
// 3) figures.json — catalogue of the PNGs shipped in public/figures
// ---------------------------------------------------------------------------
const figFiles = fs.readdirSync(FIG).filter((f) => f.endsWith(".png"));
const PRETTY = (k) =>
  ({
    uveitis_any: "Uveitis (any)", cataract_any: "Cataract (any)", visual_impairment: "Visual impairment",
    blindness: "Blindness", anterior_uveitis: "Anterior uveitis", posterior_uveitis: "Posterior uveitis",
    panuveitis: "Panuveitis", chorioretinitis: "Chorioretinitis", grd_ebola_retinal_lesion: "GRD / Ebola retinal lesion",
    retinal_detachment: "Retinal detachment", optic_neuropathy: "Optic neuropathy",
    vitreous_opacities: "Vitreous opacities", glaucoma: "Glaucoma",
  }[k] || k);
function describeFigure(f) {
  const base = f.replace(/\.png$/, "");
  let m;
  if ((m = base.match(/^eFigure_forest_(.+)_by_era$/))) {
    const key = m[1].replace(/_$/, "");
    const outcome = PRETTY(key);
    const tier = [1, 2].includes(outcomes.find((o) => o.outcome === outcome)?.tier) ? outcomes.find((o) => o.outcome === outcome)?.tier : null;
    return { file: f, type: "Forest — by outbreak era", group: "By era", outcome, tier, caption: `${outcome}: prevalence (%) by outbreak era, random-effects (Freeman–Tukey).` };
  }
  const STATIC = {
    "eFigure_forest_tier1_by_outcome": { type: "Forest — Tier 1 by outcome", group: "By outcome", outcome: "Tier 1 (all)", tier: 1, caption: "Tier 1 vision-threatening outcomes: study-level prevalence with pooled diamond per outcome." },
    "eFigure_forest_tier2_by_outcome": { type: "Forest — Tier 2 by outcome", group: "By outcome", outcome: "Tier 2 (all)", tier: 2, caption: "Tier 2 anatomically-defined outcomes: study-level prevalence with pooled diamond per outcome." },
    "forest_pooled_summary": { type: "Summary forest", group: "Overview", outcome: "All outcomes", tier: null, caption: "Pooled prevalence for all outcomes." },
    "forest_uveitis_subgroup": { type: "Subgroup forest", group: "Overview", outcome: "Uveitis (any)", tier: 1, caption: "Uveitis (any) by subgroup." },
    "funnel_plots": { type: "Funnel plot", group: "Diagnostics", outcome: "Publication bias", tier: null, caption: "Funnel plots for small-study effects." },
    "leaveoneout_plots": { type: "Leave-one-out", group: "Diagnostics", outcome: "Influence", tier: null, caption: "Leave-one-out sensitivity." },
    "reml_metaregression_figure": { type: "Meta-regression", group: "Diagnostics", outcome: "Examiner gradient", tier: null, caption: "REML meta-regression of uveitis prevalence on examiner type." },
    "prisma_flow_figure": { type: "PRISMA flow", group: "Overview", outcome: "Study selection", tier: null, caption: "PRISMA 2020 flow diagram: 53 included studies." },
  };
  return { file: f, ...(STATIC[base] || { type: "Figure", group: "Other", outcome: base, tier: null, caption: base }) };
}
const figures = figFiles.map(describeFigure);

// ---------------------------------------------------------------------------
// 4) references.json — bibliography of the 53 included studies
// ---------------------------------------------------------------------------
// Full bibliographic records resolved from the screening library (potentially_relevant.ris)
// and keyed by study id. See data/included_53_citations.csv for the audit trail.
const citeRows = readTable("included_53_citations.csv");
const citeById = new Map(citeRows.map((c) => [c.study_id, c]));

// "Surname AB; Surname CD; ..." -> Vancouver-style display list (first 3 + et al)
function authorList(s) {
  const all = (s || "").split(";").map((a) => a.trim()).filter(Boolean);
  if (!all.length) return "";
  return all.length <= 3 ? all.join(", ") : `${all.slice(0, 3).join(", ")}, et al`;
}

const references = studies
  .map((s) => {
    const c = citeById.get(s.id) || {};
    const vol = c.volume ? `;${c.volume}${c.issue ? `(${c.issue})` : ""}${c.pages ? `:${c.pages}` : ""}` : "";
    const citation = c.title
      ? `${authorList(c.authors)}. ${c.title}.${c.journal ? ` ${c.journal}.` : ""}${c.year ? ` ${c.year}` : ""}${vol}.`
      : null;
    return {
      id: s.id, author: s.author, year: c.year || s.year,
      journal: c.journal || s.journal || null,
      country: s.country, species: s.species, design: s.design, pooled: s.pooled,
      authors: c.authors || null, title: c.title || null,
      volume: c.volume || null, issue: c.issue || null, pages: c.pages || null,
      doi: c.doi || null, pmid: c.pmid || null,
      record_type: c.record_type || null,
      citation,
    };
  })
  .sort((a, b) => (a.author || "").localeCompare(b.author || ""));

// ---------------------------------------------------------------------------
// 5) meta.json — headline counts
// ---------------------------------------------------------------------------
const t1c = outcomes.filter((o) => o.tier === 1);
const meta_summary = {
  n_studies: studies.length,
  n_outcomes: outcomes.length,
  n_tier1: t1c.length,
  n_tier2: outcomes.length - t1c.length,
  n_survivors_examined: Math.max(...studies.map((s) => s.n_eye_exam || 0)),
  headline: t1c.map((o) => ({ outcome: o.outcome, pct: o.pct, ci_lo: o.ci_lo, ci_hi: o.ci_hi, k: o.k })),
  generated_from: "meta_clean_corrected.csv (86 rows) · appendix1 (53) · appendix2 (53) · pooled/subgroup corrected",
};

// ---------------------------------------------------------------------------
const write = (name, obj) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(obj, null, 0));
write("outcomes.json", outcomes);
write("studies.json", studies);
write("figures.json", figures);
write("references.json", references);
write("meta.json", meta_summary);

console.log(`✓ outcomes.json   ${outcomes.length} outcomes (${outcomes.reduce((s, o) => s + o.studies.length, 0)} study-rows)`);
console.log(`✓ studies.json    ${studies.length} studies (${studies.filter((s) => s.rob_detail).length} with RoB detail)`);
console.log(`✓ figures.json    ${figures.length} figures`);
console.log(`✓ references.json ${references.length} references`);
console.log(`✓ meta.json       ${meta_summary.n_studies} studies · ${meta_summary.n_outcomes} outcomes`);
