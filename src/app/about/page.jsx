import { summary } from "@/lib/data";

export const metadata = { title: "About & methods — EVD Ocular Explorer" };

export default function AboutPage() {
  return (
    <div className="container section prose">
      <p className="kicker">About &amp; methods</p>
      <h1 style={{ marginTop: 0 }}>About this explorer</h1>
      <p>
        This is the interactive companion to a systematic review and meta-analysis of ocular complications in survivors
        of Ebola virus disease (EVD). It presents {summary.n_studies} included studies and {summary.n_outcomes} pooled
        outcomes so readers can move from a headline prevalence to the individual studies and their risk of bias in a
        couple of clicks.
      </p>

      <h2>How outcomes are organised</h2>
      <p>
        Outcomes are grouped into two clinical tiers. <strong>Tier 1</strong> captures vision-threatening endpoints
        (uveitis, cataract, visual impairment, blindness). <strong>Tier 2</strong> captures anatomically-defined
        complications (uveitis subtypes, chorioretinitis, retinal detachment, optic neuropathy, vitreous opacities,
        glaucoma, and Ebola-associated retinal lesions). A separate narrative tier of descriptive and emerging findings
        is discussed in the manuscript.
      </p>

      <h2>How the numbers are computed</h2>
      <p>
        Prevalence is pooled with the Freeman–Tukey double-arcsine transformation and a DerSimonian–Laird
        random-effects model, back-transformed at the harmonic-mean sample size. Estimates are proportions of{" "}
        <em>examined survivors</em>. Reported intervals are 95% confidence intervals; the faint bars in the forest view
        are 95% prediction intervals. Heterogeneity (I², τ²) is generally high — these are descriptive syntheses of a
        clinically diverse literature, and the confidence and prediction intervals should be read alongside every point
        estimate.
      </p>

      <h2>Data provenance</h2>
      <p>
        Every value shown is generated at build time from the source-verified analysis dataset and the appraisal
        appendices — the same data behind the manuscript tables. The site performs no live queries and contains no
        free-text generation: the search and filters only ever
        surface rows that exist in that dataset, so nothing displayed here can drift from the underlying data.
      </p>

      <h2>Limitations</h2>
      <ul>
        <li>Estimates carry substantial between-study heterogeneity; several outcomes rest on very few studies.</li>
        <li>Some studies report per-eye rather than per-survivor denominators; where this matters (notably blindness) it is flagged in the study record and examined in a sensitivity analysis in the manuscript.</li>
        <li>Subgroup strata (outbreak era, species, examiner, timing) are often small and should be read as descriptive, not as formal comparisons.</li>
      </ul>

      <h2>Citing this tool</h2>
      <p className="muted">
        A permanent citation and DOI will be added on publication of the parent article. Until then, please cite the
        manuscript; this companion is provided for exploration and reproducibility.
      </p>
    </div>
  );
}
