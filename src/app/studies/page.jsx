import StudyExplorer from "@/components/StudyExplorer";
import { studies } from "@/lib/data";

export const metadata = { title: "Studies — EVD Ocular Explorer" };

export default function StudiesPage() {
  return (
    <div className="container section">
      <p className="kicker">Included studies</p>
      <h1 style={{ marginTop: 0 }}>Study explorer</h1>
      <p className="muted" style={{ maxWidth: "72ch" }}>
        All {studies.length} studies in the review, with their characteristics and item-level risk of bias. Filter by
        species, examiner, or risk of bias; search by author, country, or journal; sort any column. Open a row to see the
        full record — including the JBI/appraisal items behind each rating and the outcomes that study contributed.
      </p>
      <StudyExplorer studies={studies} />
    </div>
  );
}
