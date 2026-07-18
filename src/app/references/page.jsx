import { references } from "@/lib/data";

export const metadata = { title: "References — EVD Ocular Explorer" };

export default function ReferencesPage() {
  return (
    <div className="container section">
      <p className="kicker">Included-study bibliography</p>
      <h1 style={{ marginTop: 0 }}>References</h1>
      <p className="muted" style={{ maxWidth: "72ch" }}>
        The {references.length} studies included in the review, ordered by first author. Each entry links back to its
        full record in the <a href="/studies/">Study explorer</a>. Fields reflect what was extracted; full citations
        appear in the manuscript reference list.
      </p>
      <ul className="ref-list card" style={{ marginTop: 16, overflow: "hidden" }}>
        {references.map((r) => (
          <li key={r.id}>
            <span className="rid">{r.id}</span>
            <span>
              <strong>{r.author}</strong>{r.year ? ` (${r.year})` : ""}.
              {r.journal ? <> <em>{r.journal}</em>.</> : null}
              {" "}
              <span className="faint">
                {[r.country, r.species, r.design].filter(Boolean).join(" · ")}
                {r.pooled ? ` · pooled: ${r.pooled}` : ""}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
