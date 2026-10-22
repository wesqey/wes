// Checks every full-resolution original against the site's five print
// sizes, and writes lib/print-sizes.json: a map of which sizes are safe
// to sell for each image, based on its actual pixel dimensions.
//
// USAGE:
//   node scripts/check-print-sizes.mjs "/path/to/your/full-res/originals"
//
// Point it at the SAME folder you used for scripts/upload-originals.mjs
// (the real full-resolution masters, not the compressed web previews).
// Safe to re-run any time you add or replace originals.

import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error('Usage: node scripts/check-print-sizes.mjs "/path/to/full-res/originals"');
  process.exit(1);
}

// Inches for each size key. Must match lib/products.ts SIZES.
const SIZES = [
  { key: "4x6", w: 4, h: 6 },
  { key: "8x12", w: 8, h: 12 },
  { key: "12x18", w: 12, h: 18 },
  { key: "16x24", w: 16, h: 24 },
  { key: "20x30", w: 20, h: 30 },
];

// Below this DPI, a size is hidden entirely (it would print visibly soft).
const HARD_FLOOR_DPI = 100;
// Between the floor and this value, the size is still offered but flagged
// as borderline in this script's printed report.
const COMFORTABLE_DPI = 150;

const VALID_EXT = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff"]);

function dpiFor(pxW, pxH, sizeW, sizeH) {
  const imgLong = Math.max(pxW, pxH);
  const imgShort = Math.min(pxW, pxH);
  const sizeLong = Math.max(sizeW, sizeH);
  const sizeShort = Math.min(sizeW, sizeH);
  return Math.min(imgLong / sizeLong, imgShort / sizeShort);
}

async function main() {
  const files = (await fs.readdir(sourceDir)).filter((f) =>
    VALID_EXT.has(path.extname(f).toLowerCase())
  );

  if (files.length === 0) {
    console.error(`No images found in ${sourceDir}`);
    process.exit(1);
  }

  const result = {};
  let anyBlocked = false;

  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    const meta = await sharp(filePath, { limitInputPixels: false }).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;

    const allowed = [];
    const notes = [];

    for (const size of SIZES) {
      const dpi = Math.round(dpiFor(w, h, size.w, size.h));
      if (dpi < HARD_FLOOR_DPI) {
        notes.push(`  ✗ ${size.key.padEnd(6)} blocked: only ${dpi} DPI`);
        anyBlocked = true;
      } else if (dpi < COMFORTABLE_DPI) {
        allowed.push(size.key);
        notes.push(`  ~ ${size.key.padEnd(6)} borderline: ${dpi} DPI`);
      } else {
        allowed.push(size.key);
      }
    }

    result[file] = allowed;

    if (notes.length > 0) {
      console.log(`${file} (${w}x${h})`);
      notes.forEach((n) => console.log(n));
    }
  }

  const outPath = path.join(projectRoot, "lib", "print-sizes.json");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(result, null, 2));

  console.log(`\nWrote lib/print-sizes.json for ${files.length} images.`);
  if (anyBlocked) {
    console.log("Some sizes were blocked for low resolution and won't be offered for those prints.");
  } else {
    console.log("All sizes are available for every image. No resolution issues found.");
  }
}

main();