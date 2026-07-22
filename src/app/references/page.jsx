import Link from "next/link";
import { references } from "@/lib/data";

export const metadata = { title: "References — EVD Ocular Explorer" };

// First three authors, then "et al" — keeps long consortium lists readable.
function authorsShort(s) {
  const all = String(s || "")
    .split(";")
    .map((a) => a.trim())
    .filter(Boolean);
  return all.length <= 3 ? all.join(", ") : `${all.slice(0, 3).join(", ")}, et al`;
}

export default function ReferencesPage() {
  const withPmid = references.filter((r) => r.pmid).length;

  return (
    <div className="container section">
      <p className="kicker">Included-study bibliography</p>
      <h1 style={{ marginTop: 0 }}>References</h1>
      <p className="muted" style={{ maxWidth: "72ch" }}>
        Full citations for the {references.length} studies included in the review, ordered by first author.{" "}
        {withPmid} carry a PubMed identifier; the rest are conference abstracts indexed without one. Each entry links
        back to its full record in the <Link href="/studies/">Study explorer</Link>.
      </p>
      <ul className="ref-list card" style={{ marginTop: 16, overflow: "hidden" }}>
        {references.map((r) => (
          <li key={r.id}>
            <Link href={`/studies/?study=${r.id}`} className="rid" style={{ textDecoration: "none" }}>
              {r.id}
            </Link>
            <span>
              {r.title ? (
                <>
                  {authorsShort(r.authors) || r.author}.{" "}
                  <Link href={`/studies/?study=${r.id}`} style={{ color: "inherit" }}>
                    <strong>{r.title}</strong>
                  </Link>
                  .{" "}
                  {r.journal ? (
                    <>
                      <em>{r.journal}</em>
                      {r.year ? ` ${r.year}` : ""}
                      {r.volume ? `;${r.volume}${r.issue ? `(${r.issue})` : ""}` : ""}
                      {r.pages ? `:${r.pages}` : ""}.{" "}
                    </>
                  ) : (
                    <span className="faint">Conference abstract. </span>
                  )}
                </>
              ) : (
                <>
                  <Link href={`/studies/?study=${r.id}`} style={{ color: "inherit" }}>
                    <strong>{r.author}</strong>
                  </Link>
                  {r.year ? ` (${r.year})` : ""}.{" "}
                </>
              )}
              {r.doi || r.pmid ? (
                <span className="ref-ids">
                  {r.doi ? (
                    <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noopener noreferrer">
                      doi:{r.doi}
                    </a>
                  ) : null}
                  {r.doi && r.pmid ? <span className="faint"> · </span> : null}
                  {r.pmid ? (
                    <a href={`https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`} target="_blank" rel="noopener noreferrer">
                      PMID {r.pmid}
                    </a>
                  ) : null}
                </span>
              ) : null}
              <span className="faint" style={{ display: "block", marginTop: 3 }}>
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
