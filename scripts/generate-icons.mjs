import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
mkdirSync(publicDir, { recursive: true });

const standard = path.join(__dirname, "icon-source.svg");
const maskable = path.join(__dirname, "icon-maskable.svg");
const ogSource = path.join(__dirname, "og-image.svg");

const jobs = [
  { src: standard, out: "icon-192.png", size: 192 },
  { src: standard, out: "icon-512.png", size: 512 },
  { src: standard, out: "apple-touch-icon.png", size: 180 },
  { src: maskable, out: "maskable-icon-512.png", size: 512 },
];

for (const job of jobs) {
  await sharp(job.src, { density: 384 })
    .resize(job.size, job.size)
    .png()
    .toFile(path.join(publicDir, job.out));
  console.log("wrote", job.out);
}

await sharp(ogSource, { density: 192 }).resize(1200, 630).png().toFile(path.join(publicDir, "og-image.png"));
console.log("wrote og-image.png");
