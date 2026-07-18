# EVD Ocular Explorer

Interactive evidence companion to a systematic review and meta-analysis of **ocular complications in Ebola virus disease (EVD) survivors**. A static, multipage site — no server, no database, no runtime AI. Every number is generated at build time from the corrected, source-verified analysis dataset.

Built with Next.js (static export) for **GitHub Pages** at `https://olatechie.github.io/evd-ocular-explorer/`.

## What's inside

| Page | What it does |
|------|--------------|
| **Overview** | Headline Tier 1 estimates + an interactive forest of all 13 pooled outcomes. Click a row to reveal the contributing studies, subgroup estimates (era / examiner / species / timing), and the by-era forest plot. |
| **Studies** | Filterable, sortable table of all 53 included studies. Open any row for full characteristics and **item-level risk of bias** (JBI/appraisal items with Yes/No/Unclear). |
| **Figures** | The publication figures (forest, funnel, leave-one-out, meta-regression, PRISMA), filterable by category, zoomable, downloadable. |
| **References** | The included-study bibliography. |
| **About** | Methods, data provenance, limitations, and AI-assistance disclosure. |

Progressive disclosure throughout: a casual reader sees plain numbers; a researcher filters the table; a reviewer drills into per-study risk of bias.

## Data pipeline (single source of truth)

`scripts/build-data.mjs` reads the corrected CSVs in `data-src/` and emits static JSON to `public/data/`:

- `meta_clean_corrected.csv` → `outcomes.json`, contributes to `studies.json`
- `appendix1_study_characteristics.csv` + `appendix2_rob.csv` → `studies.json`
- `pooled_estimates_corrected.csv` + `subgroup_results_corrected.csv` → pooled/subgroup values
- `table1_study_characteristics.csv` → journal names for `references.json`

The old, superseded `meta_clean.csv` is **never** read. The site cannot show a number that isn't in these files, and it never generates free text — so nothing on the site can drift from, or hallucinate beyond, the analysis.

To refresh after the analysis changes: replace the files in `data-src/`, then `npm run data` (or just `npm run build`, which runs it first).

## Develop / build locally

```bash
npm install
npm run dev      # http://localhost:3000  (regenerates JSON first)
npm run build    # static export to ./out
npm run serve    # preview the exported ./out
```

Requires Node 18+ (CI uses Node 20).

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes `./out` to GitHub Pages. One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

The project is served under a base path (`/evd-ocular-explorer`) in production; `next.config.mjs` handles this automatically and `public/.nojekyll` keeps Pages from stripping the `_next` assets.

### Launch gating (important)

The companion is intended to go live **only after the parent article is accepted**, to avoid deanonymising a blinded submission and any prior-publication concerns. Until then:

- keep the repository **private**, and
- keep **GitHub Pages disabled** (Settings → Pages → None).

While Pages is disabled the deploy job fails harmlessly. When the paper is accepted, make the repo public, enable Pages (Source: GitHub Actions), re-run the workflow, and add the URL to the manuscript at proof stage.

## Disclosure

Code and the data-transformation pipeline were produced with AI coding assistance under author direction. No estimates are AI-generated; all values come from the published R analysis via a deterministic transform.
