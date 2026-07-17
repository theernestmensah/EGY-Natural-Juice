import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PHOTOS_DIR = path.resolve("photos");
const OUT_DIR = path.resolve("src/assets/products");

const FILES = {
  "watermelon-beetroot.png": "WhatsApp Image 2026-07-17 at 21.29.49.jpeg",
  "ginger-passionfruit-pair.png": "WhatsApp Image 2026-07-17 at 21.29.50 (1).jpeg",
  "pinemango.png": "WhatsApp Image 2026-07-17 at 21.29.50 (2).jpeg",
  "melon.png": "WhatsApp Image 2026-07-17 at 21.29.50 (3).jpeg",
  "mint.png": "WhatsApp Image 2026-07-17 at 21.29.50.jpeg",
};

await mkdir(OUT_DIR, { recursive: true });

for (const [outName, inFile] of Object.entries(FILES)) {
  const inPath = path.join(PHOTOS_DIR, inFile);
  console.log(`Processing ${inFile} -> ${outName}`);
  const blob = await removeBackground(pathToFileURL(inPath), {
    output: { format: "image/png" },
  });
  const buf = Buffer.from(await blob.arrayBuffer());

  const trimmed = await sharp(buf).trim({ threshold: 10 }).toBuffer();

  await writeFile(path.join(OUT_DIR, outName), trimmed);
  console.log(`  saved ${outName}`);
}

console.log("Done.");
