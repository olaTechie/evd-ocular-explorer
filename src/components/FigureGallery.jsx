"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { asset } from "@/lib/util";

const GROUP_ORDER = ["Overview", "By outcome", "By era", "Diagnostics", "Other"];
const thumb = (file) => asset(`/figures/thumbs/${file.replace(/\.png$/, ".webp")}`);

export default function FigureGallery({ figures }) {
  const [group, setGroup] = useState("All");
  const [idx, setIdx] = useState(-1); // index into `shown`; -1 = closed
  const dialogRef = useRef(null);
  const lastFocus = useRef(null);

  const groups = useMemo(() => {
    const g = [...new Set(figures.map((f) => f.group))];
    return ["All", ...GROUP_ORDER.filter((x) => g.includes(x))];
  }, [figures]);

  const shown = useMemo(
    () => figures.filter((f) => group === "All" || f.group === group),
    [figures, group]
  );

  const box = idx >= 0 && idx < shown.length ? shown[idx] : null;
  const openAt = (i) => { lastFocus.current = document.activeElement; setIdx(i); };
  const close = useCallback(() => setIdx(-1), []);
  const step = useCallback(
    (d) => setIdx((i) => (i < 0 ? i : (i + d + shown.length) % shown.length)),
    [shown.length]
  );

  // Changing the filter while open would leave a stale index — close.
  useEffect(() => { setIdx(-1); }, [group]);

  // Focus management + keyboard (Esc / arrows / Tab trap).
  useEffect(() => {
    if (!box) { lastFocus.current?.focus?.(); return; }
    dialogRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "Tab") {
        const els = dialogRef.current?.querySelectorAll('button, a[href]');
        if (!els?.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [box, close, step]);

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
        {shown.map((f, i) => (
          <div
            key={f.file}
            className="card fig-card"
            onClick={() => openAt(i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openAt(i); } }}
          >
            <div className="thumb">
              <img src={thumb(f.file)} alt={f.caption} loading="lazy" />
            </div>
            <div className="fig-meta">
              <div className="type">{f.type}</div>
              <div className="cap">{f.caption}</div>
            </div>
          </div>
        ))}
      </div>

      {box && (
        <div className="lightbox" onClick={close}>
          <div
            className="box"
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Figure: ${box.outcome}`}
            onClick={(e) => e.stopPropagation()}
          >
            {shown.length > 1 && (
              <>
                <button className="lb-nav prev" aria-label="Previous figure" onClick={() => step(-1)}>‹</button>
                <button className="lb-nav next" aria-label="Next figure" onClick={() => step(1)}>›</button>
              </>
            )}
            <img src={asset(`/figures/${box.file}`)} alt={box.caption} />
            <div className="cap">
              <div>
                <div style={{ fontWeight: 600 }}>
                  {box.outcome}{box.tier ? ` · Tier ${box.tier}` : ""}{" "}
                  <span className="faint" style={{ fontWeight: 400 }}>· {idx + 1} / {shown.length}</span>
                </div>
                <div className="muted" style={{ fontSize: "0.88rem" }}>{box.caption}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a className="icon-btn" style={{ width: "auto", padding: "0 12px" }} href={asset(`/figures/${box.file}`)} download>Download</a>
                <button className="icon-btn" style={{ width: "auto", padding: "0 12px" }} onClick={close}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
