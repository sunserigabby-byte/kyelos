const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const svgPath = path.join(__dirname, "..", "public", "icon.svg");
const publicDir = path.join(__dirname, "..", "public");

const svg = fs.readFileSync(svgPath);

(async () => {
  await sharp(svg).resize(192, 192).png().toFile(path.join(publicDir, "icon-192.png"));
  await sharp(svg).resize(512, 512).png().toFile(path.join(publicDir, "icon-512.png"));
  await sharp(svg).resize(180, 180).png().toFile(path.join(publicDir, "apple-touch-icon.png"));
  await sharp(svg).resize(32, 32).png().toFile(path.join(publicDir, "favicon-32.png"));
  await sharp(svg).resize(16, 16).png().toFile(path.join(publicDir, "favicon-16.png"));
  fs.copyFileSync(path.join(publicDir, "favicon-32.png"), path.join(publicDir, "favicon.ico"));
  console.log("Tandem icons generated.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
