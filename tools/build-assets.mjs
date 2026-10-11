/**
 * Builds the site's assets from the Laxmee app's own brand files (../../laxmee/assets):
 * subset web fonts, optimised artwork, the reversed wordmark for dark backgrounds, and icons.
 * Run: cd tools && npm run assets
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import subsetFont from 'subset-font';

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, '..');
const app = path.resolve(site, '..', 'laxmee');
const fontsIn = path.join(app, 'node_modules', '@expo-google-fonts');
const out = (...p) => path.join(site, ...p);

/* ---------- Fonts: Manrope (display) + Inter (text), as in the app ---------- */
// Latin, punctuation, the rupee sign and a few symbols the page uses.
const CHARS =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~' +
  '₹•·–—‘’“”…×≈↑↓→←✓©®™ ';
const FONTS = [
  ['manrope', '600SemiBold/Manrope_600SemiBold.ttf', 'manrope-600.woff2'],
  ['manrope', '700Bold/Manrope_700Bold.ttf', 'manrope-700.woff2'],
  ['manrope', '800ExtraBold/Manrope_800ExtraBold.ttf', 'manrope-800.woff2'],
  ['inter', '400Regular/Inter_400Regular.ttf', 'inter-400.woff2'],
  ['inter', '500Medium/Inter_500Medium.ttf', 'inter-500.woff2'],
  ['inter', '600SemiBold/Inter_600SemiBold.ttf', 'inter-600.woff2'],
];

/* ---------- Images ---------- */
const img = (f) => path.join(app, 'assets', f);

/**
 * The app's art carries a faint grain across its whole transparent area. Invisible on a phone,
 * it shows as a box on the web (and costs bytes), so near-transparent pixels become transparent.
 */
const GRAIN_ALPHA = 72;

async function webp(src, file, width, quality = 72, grain = GRAIN_ALPHA) {
  // Threshold at full size, before resizing: a resize hands back premultiplied pixels.
  const { data, info: raw } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) if (data[i] < grain) data[i] = 0;
  const info = await sharp(data, { raw: { width: raw.width, height: raw.height, channels: 4 } })
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, alphaQuality: 70, effort: 6 })
    .toFile(out('assets', 'img', file));
  return `${file} ${info.width}x${info.height}`;
}

/** The lotus mark without its empty margins. */
async function mark(src, file, size) {
  const trimmed = await sharp(src).trim().toBuffer();
  const info = await sharp(trimmed).resize({ height: size }).png({ compressionLevel: 9 }).toFile(out('assets', 'img', file));
  return `${file} ${info.width}x${info.height}`;
}

/**
 * The wordmark from the master logo (white background, "Lax" green, "mee" gold), cut out and
 * reversed for dark backgrounds: green becomes pale mint, gold stays gold.
 */
async function wordmark() {
  const src = sharp(path.join(app, 'assets', 'brand', 'logo-source.webp'));
  const { data, info } = await src
    .extract({ left: 90, top: 850, width: 1080, height: 230 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const make = async (variant) => {
    const px = Buffer.from(data);
    for (let i = 0; i < px.length; i += 4) {
      const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
      // Distance from white = ink coverage (keeps anti-aliasing).
      const raw = 1 - Math.min(r, g, b) / 255;
      // Paper noise below 8% coverage is background, not ink.
      const ink = raw < 0.08 ? 0 : raw;
      const gold = r > g && r - b > 60;
      let rgb;
      if (gold) rgb = [245, 184, 46];
      else rgb = variant === 'light' ? [232, 239, 234] : [0, 87, 58];
      px[i] = rgb[0];
      px[i + 1] = rgb[1];
      px[i + 2] = rgb[2];
      px[i + 3] = Math.round(Math.min(1, ink * 1.15) * 255);
    }
    const buf = await sharp(px, { raw: info }).trim().png().toBuffer();
    const name = `wordmark-${variant}.png`;
    const r = await sharp(buf).resize({ height: 96 }).png({ compressionLevel: 9 }).toFile(out('assets', 'img', name));
    return `${name} ${r.width}x${r.height}`;
  };
  return [await make('light'), await make('dark')];
}

/** Minimal .ico holding PNG images (supported by every current browser). */
async function ico(srcPng, sizes) {
  const pngs = await Promise.all(sizes.map((s) => sharp(srcPng).resize(s, s).png().toBuffer()));
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach((p, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], e);
    header.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(p.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += p.length;
  });
  await writeFile(out('favicon.ico'), Buffer.concat([header, ...pngs]));
}

async function main() {
  await mkdir(out('assets', 'fonts'), { recursive: true });
  await mkdir(out('assets', 'img'), { recursive: true });

  for (const [fam, file, name] of FONTS) {
    const ttf = await readFile(path.join(fontsIn, fam, file));
    const woff2 = await subsetFont(ttf, CHARS, { targetFormat: 'woff2' });
    await writeFile(out('assets', 'fonts', name), woff2);
    console.log(name, `${(woff2.length / 1024).toFixed(1)} KB`);
  }

  const log = [
    await mark(img('images/splash-icon-dark.png'), 'lotus-mint.png', 96),
    await mark(img('images/splash-icon.png'), 'lotus-green.png', 96),
    ...(await wordmark()),
    await webp(img('art/leaf-card@3x.png'), 'leaf-card.webp', 600),
    await webp(img('art/splash-leaves-dark@3x.png'), 'leaves-dark.webp', 720),
    await webp(img('art/plant-dark@3x.png'), 'plant-dark.webp', 300),
    await webp(img('art/onboarding-2-dark@3x.png'), 'privacy-dark.webp', 480),
    await webp(img('art/onboarding-1-dark@3x.png'), 'growth-dark.webp', 480),
    await webp(img('art/empty-goals-dark@3x.png'), 'goals-dark.webp', 360),
    // Website art (clean transparency, no grain: keep soft glows).
    await webp(img('art/web/leaves-wide-dark.webp'), 'leaves-wide-dark.webp', 1600, 78, 4),
    await webp(img('art/web/leaves-wide-dark.webp'), 'leaves-wide-dark-800.webp', 800, 78, 4),
    await webp(img('art/web/leaves-wide-light.webp'), 'leaves-wide-light.webp', 1200, 78, 4),
    await webp(img('art/web/step-sms.webp'), 'step-sms.webp', 560, 78, 4),
    await webp(img('art/web/step-patterns.webp'), 'step-patterns.webp', 560, 78, 4),
    await webp(img('art/web/step-goal.webp'), 'step-goal.webp', 560, 78, 4),
  ];
  log.forEach((l) => console.log(l));

  // Icons from the app icon (white lotus on emerald, full bleed: also safe as "maskable").
  const icon = img('images/icon.png');
  for (const [file, s] of [
    ['favicon-16.png', 16],
    ['favicon-32.png', 32],
    ['apple-touch-icon.png', 180],
    ['icon-192.png', 192],
    ['icon-512.png', 512],
  ]) {
    await sharp(icon).resize(s, s).png({ compressionLevel: 9 }).toFile(out(file));
  }
  await ico(icon, [16, 32, 48]);
  console.log('icons: favicon.ico, favicon-16/32.png, apple-touch-icon.png, icon-192/512.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
