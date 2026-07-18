"use client";
import { useEffect, useMemo, useState } from "react";
import { asset } from "@/lib/util";

const GROUP_ORDER = ["Overview", "By outcome", "By era", "Diagnostics", "Other"];

export default function FigureGallery({ figures }) {
  const [group, setGroup] = useState("All");
  const [box, setBox] = useState(null);

  const groups = useMemo(() => {
    const g = [...new Set(figures.map((f) => f.group))];
    return ["All", ...GROUP_ORDER.filter((x) => g.includes(x))];
  }, [figures]);

  const shown = useMemo(
    () => figures.filter((f) => group === "All" || f.group === group),
    [figures, group]
  );

  useEffect(() => {
    if (!box) return;
    const onKey = (e) => e.key === "Escape" && setBox(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [box]);

  return (
    <div>
      <div className="controls" style={{ marginBottom: 16 }}>
        <div className="seg">
          {groups.map((g) => (
            <button key={g} className={group === g ? "on" : ""} onClick={() => setGroup(g)}>{g}</button>
          ))}
        </div>
        <span className="faint" style={{ fontSize: "0.82rem" }}>{shown.length} figures</span>
      </div>

      <div className="gallery">
        {shown.map((f) => (
          <div key={f.file} className="card fig-card" onClick={() => setBox(f)}>
            <div className="thumb">
              <img src={asset(`/figures/${f.file}`)} alt={f.caption} loading="lazy" />
            </div>
            <div className="fig-meta">
              <div className="type">{f.type}</div>
              <div className="cap">{f.caption}</div>
            </div>
          </div>
        ))}
      </div>

      {box && (
        <div className="lightbox" onClick={() => setBox(null)}>
          <div className="box" onClick={(e) => e.stopPropagation()}>
            <img src={asset(`/figures/${box.file}`)} alt={box.caption} />
            <div className="cap">
              <div>
                <div style={{ fontWeight: 600 }}>{box.outcome}{box.tier ? ` · Tier ${box.tier}` : ""}</div>
                <div className="muted" style={{ fontSize: "0.88rem" }}>{box.caption}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a className="icon-btn" style={{ width: "auto", padding: "0 12px" }} href={asset(`/figures/${box.file}`)} download>Download</a>
                <button className="icon-btn" style={{ width: "auto", padding: "0 12px" }} onClick={() => setBox(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
