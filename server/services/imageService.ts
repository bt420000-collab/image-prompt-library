import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

export const uploadRoot = path.resolve(process.cwd(), "uploads/images");
export const originalDir = path.join(uploadRoot, "original");
export const thumbsDir = path.join(uploadRoot, "thumbs");

fs.mkdirSync(originalDir, { recursive: true });
fs.mkdirSync(thumbsDir, { recursive: true });

export function publicUploadPath(kind: "original" | "thumbs", filename: string) {
  return `/uploads/images/${kind}/${filename}`;
}

export async function makeThumb(inputPath: string, outputName: string) {
  const out = path.join(thumbsDir, outputName.replace(/\.[^.]+$/, ".webp"));
  const meta = await sharp(inputPath).metadata();
  await sharp(inputPath)
    .resize({ width: 520, height: 390, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(out);

  const width = meta.width || null;
  const height = meta.height || null;
  let aspectRatio = "";
  if (width && height) {
    const r = width / height;
    if (Math.abs(r - 1) < 0.05) aspectRatio = "1:1";
    else if (r > 1.65 && r < 1.9) aspectRatio = "16:9";
    else if (r > 1.25 && r < 1.45) aspectRatio = "4:3";
    else if (r < 0.6) aspectRatio = "长竖图";
    else if (r < 0.85) aspectRatio = "3:4";
    else if (r > 2.2) aspectRatio = "长横图";
    else aspectRatio = `${width}:${height}`;
  }

  return {
    thumbPath: publicUploadPath("thumbs", path.basename(out)),
    width,
    height,
    aspectRatio
  };
}
