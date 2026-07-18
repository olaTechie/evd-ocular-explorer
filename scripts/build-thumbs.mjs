// Generate ~600px WebP thumbnails for the figure gallery grid. The lightbox and
// download still use the full-resolution PNGs. Run in prebuild/predev.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const dir = "public/figures";
const out = path.join(dir, "thumbs");
fs.mkdirSync(out, { recursive: true });

const pngs = fs.readdirSync(dir).filter((f) => f.endsWith(".png"));
let n = 0;
for (const f of pngs) {
  const dest = path.join(out, f.replace(/\.png$/, ".webp"));
  await sharp(path.join(dir, f)).resize({ width: 600, withoutEnlargement: true }).webp({ quality: 78 }).toFile(dest);
  n++;
}
console.log(`✓ built ${n} thumbnails → ${out}`);
