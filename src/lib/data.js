// Server-only data access. Reads the JSON emitted by scripts/build-data.mjs at
// build time. Imported only by server components (pages), which pass plain data
// to client components as props. Never touches the raw source CSVs at runtime.
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "public", "data");
const load = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));

export const outcomes = load("outcomes.json");
export const studies = load("studies.json");
export const figures = load("figures.json");
export const references = load("references.json");
export const summary = load("meta.json");
