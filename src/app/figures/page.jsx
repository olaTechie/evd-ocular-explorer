import FigureGallery from "@/components/FigureGallery";
import { figures } from "@/lib/data";

export const metadata = { title: "Figures — EVD Ocular Explorer" };

export default function FiguresPage() {
  return (
    <div className="container section">
      <p className="kicker">Figure gallery</p>
      <h1 style={{ marginTop: 0 }}>Figures</h1>
      <p className="muted" style={{ maxWidth: "72ch" }}>
        The publication figures from the corrected analysis — forest plots by outcome and by outbreak era, funnel and
        leave-one-out diagnostics, the examiner meta-regression, and the PRISMA flow. Filter by category; click any
        figure to enlarge and download.
      </p>
      <FigureGallery figures={figures} />
    </div>
  );
}
