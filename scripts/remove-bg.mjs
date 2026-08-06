import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath  = path.join(__dirname, '../public/logos/power-business-awards.jpeg');
const outputPath = path.join(__dirname, '../public/logos/power-business-awards.png');

const image = sharp(inputPath);
const meta  = await image.metadata();
console.log(`Input: ${meta.width}x${meta.height} channels=${meta.channels}`);

const { data, info } = await sharp(inputPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const buf = Buffer.from(data);
const { width, height } = info;

// Soft-edge white removal: pixels near white become proportionally transparent
for (let i = 0; i < buf.length; i += 4) {
  const r = buf[i], g = buf[i + 1], b = buf[i + 2];
  const brightness = Math.min(r, g, b); // darkest channel
  if (brightness > 210) {
    // Map 210–255 → fully transparent to fully opaque (soft edge)
    const alpha = Math.round(((255 - brightness) / 45) * 255);
    buf[i + 3] = Math.min(alpha, buf[i + 3]);
  }
}

await sharp(buf, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

console.log(`Saved transparent PNG → ${outputPath}`);
