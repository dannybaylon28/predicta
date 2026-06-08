import { copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "logo_predicta.png");
const publicLogo = join(root, "public/logo.png");

copyFileSync(source, publicLogo);
console.log("Copied logo_predicta.png → public/logo.png");

async function writeIcon(size, filename) {
  await sharp(source).resize(size, size).png().toFile(join(root, "public", filename));
  console.log(`Generated public/${filename}`);
}

await writeIcon(192, "icon-192.png");
await writeIcon(512, "icon-512.png");
await writeIcon(32, "favicon-32.png");
