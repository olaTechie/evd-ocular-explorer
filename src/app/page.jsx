import Link from "next/link";
import ForestExplorer from "@/components/ForestExplorer";
import { outcomes, summary } from "@/lib/data";
import { fmtPct, fmtCI } from "@/lib/util";

export default function Overview() {
  return (
    <div className="container">
      <section className="section hero">
        <p className="kicker">Systematic review &amp; meta-analysis · evidence companion</p>
        <h1>Ocular complications in Ebola&nbsp;virus&nbsp;disease survivors</h1>
        <p className="lede">
          A source-verified synthesis of <strong>{summary.n_studies} studies</strong> reporting eye findings in EVD
          survivors — {summary.n_outcomes} pooled outcomes across two clinical tiers, with every estimate traceable to
          the studies behind it and their risk of bias.
        </p>
      </section>

      <section style={{ paddingBottom: 8 }}>
        <div className="stat-grid">
          {summary.headline.map((h) => (
            <div key={h.outcome} className="card stat">
              <div className="big">{fmtPct(h.pct)}</div>
              <div className="lbl">{h.outcome}</div>
              <div className="ci">95% CI {fmtCI(h.ci_lo, h.ci_hi)} · {h.k} studies</div>
            </div>
          ))}
        </div>
        <p className="count-note">
          Tier 1 (vision-threatening) headline estimates. Roughly <strong>1 in 8</strong> examined survivors has
          uveitis; about <strong>1 in 9</strong> has cataract. Explore all {summary.n_outcomes} outcomes below.
        </p>
      </section>

      <section className="section">
        <h2 style={{ marginTop: 0 }}>Pooled prevalence — explore the evidence</h2>
        <p className="muted" style={{ maxWidth: "70ch", marginTop: 4 }}>
          Each row is a meta-analysed outcome. Open one to see the individual studies that contribute, how the estimate
          shifts by outbreak era, examiner type, species and assessment timing, and a link to the full by-era forest plot.
        </p>
        <ForestExplorer outcomes={outcomes} />
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="banner">
          Every figure here derives from the <strong>corrected, source-verified dataset</strong>. Estimates are pooled
          prevalence in <em>examined survivors</em> and carry substantial heterogeneity — read the CI and I², and use{" "}
          <Link href="/studies/">Studies</Link> to judge each contributing cohort&apos;s risk of bias. This tool
          summarises published research and is not a substitute for clinical assessment.
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="stat-grid">
          <Link href="/studies/" className="card stat" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="big">{summary.n_studies}</div>
            <div className="lbl">Included studies →</div>
            <div className="ci">filter by era, examiner, species, risk of bias</div>
          </Link>
          <Link href="/figures/" className="card stat" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="big">21</div>
            <div className="lbl">Figures →</div>
            <div className="ci">forest plots, funnels, meta-regression, PRISMA</div>
          </Link>
          <Link href="/references/" className="card stat" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="big">{summary.n_studies}</div>
            <div className="lbl">References →</div>
            <div className="ci">the full included-study bibliography</div>
          </Link>
        </div>
      </section>
    </div>
  );
}
