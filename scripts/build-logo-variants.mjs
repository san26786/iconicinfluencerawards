// Builds the two theme-aware logo variants the header actually needs from the
// single flattened source artwork in public/474.png (purple icon + solid-black
// wordmark on an opaque white rectangle).
//
// components/SiteHeader.tsx renders logo_url under .theme-logo-dark (the
// site's default dark chrome) and logo_url_light under .theme-logo-light
// (html[data-theme="light"] only) — see the CSS in app/globals.css. Both
// need a transparent background or they render as a white box on the dark
// header, which is the "not loading" bug being fixed here. The wordmark
// also needs to invert per variant: black text is invisible on the dark
// header, so the dark-chrome variant gets a white wordmark instead.
//
//   node scripts/build-logo-variants.mjs

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');
const srcPath = path.join(publicDir, '474.png');
const outDark = path.join(publicDir, 'Iconic-Influencer-Awards-Logo-Dark.png');   // for dark chrome -> logo_url
const outLight = path.join(publicDir, 'Iconic-Influencer-Awards-Logo-Light.png'); // for light theme -> logo_url_light

const { data, info } = await sharp(srcPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height } = info;
const light = Buffer.from(data); // black wordmark, transparent bg
const dark = Buffer.from(data);  // white wordmark, transparent bg

for (let i = 0; i < data.length; i += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const brightness = Math.min(r, g, b);
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);

  // Soft-edge white removal (same approach as scripts/remove-bg.mjs): pixels
  // near white become proportionally transparent so anti-aliased edges stay
  // smooth instead of jagged.
  let alpha = data[i + 3];
  if (brightness > 210) {
    const a = Math.round(((255 - brightness) / 45) * 255);
    alpha = Math.min(a, alpha);
  }
  light[i + 3] = alpha;
  dark[i + 3] = alpha;

  // Grayscale + dark = wordmark ink. The purple icon has a large gap between
  // its channels (high saturation) so it never matches this and is left
  // untouched in both variants.
  const isWordmark = saturation < 25 && brightness < 200;
  if (isWordmark) {
    dark[i] = 255;
    dark[i + 1] = 255;
    dark[i + 2] = 255;
  }
}

await sharp(light, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(outLight);
await sharp(dark, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(outDark);

console.log(`Wrote ${outLight}`);
console.log(`Wrote ${outDark}`);
