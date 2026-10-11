/**
 * Builds og/laxmee-og.png (1200 × 630), the share image for WhatsApp, LinkedIn and X.
 * It reuses the hero's phone markup from index.html so the preview always matches the site,
 * and renders with headless Microsoft Edge against the local preview server.
 * Run: (python -m http.server 8123 in the site root) then cd tools && npm run og
 */
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SERVER = process.env.SITE_URL ?? 'http://127.0.0.1:8123';

const index = await readFile(path.join(site, 'index.html'), 'utf8');
const sprite = index.match(/<svg width="0" height="0"[\s\S]*?<\/svg>/)[0];
const start = index.indexOf('<div class="phone lg"');
const end = index.indexOf('\n      </div>\n    </div>\n  </section>', start);
const phone = index.slice(start, end).trim();

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Laxmee share image</title>
<link rel="stylesheet" href="/assets/site.css">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
  body { background: #0B110E; position: relative; }
  .glow { position: absolute; width: 900px; height: 900px; right: -260px; top: -200px; border-radius: 50%;
    background: radial-gradient(closest-side, rgba(11, 122, 82, 0.42), rgba(11, 122, 82, 0) 72%); }
  .leaves { position: absolute; right: -40px; bottom: -10px; width: 860px; opacity: 0.6; }
  .copy { position: absolute; left: 84px; top: 0; bottom: 0; width: 640px; display: flex; flex-direction: column; justify-content: center; gap: 28px; }
  .brand { display: flex; align-items: center; gap: 16px; }
  .brand .mark { height: 52px; width: auto; }
  .brand .word { height: 40px; width: auto; }
  h1 { font: 800 76px/1.02 Manrope, sans-serif; letter-spacing: -0.035em; color: #E8EFEA; margin: 0; }
  h1 span { color: #A2D4B9; }
  .line { display: flex; align-items: center; gap: 14px; font: 600 20px/1 Inter, sans-serif; letter-spacing: 0.14em; text-transform: uppercase; color: #A2D4B9; }
  .line::before { content: ""; width: 12px; height: 12px; border-radius: 50%; background: #F5B82E; }
  .device { position: absolute; right: 120px; top: 64px; transform: rotate(4deg); transform-origin: top center; }
  .device .phone { --pw: 330px; }
  .url { position: absolute; left: 84px; bottom: 44px; font: 600 20px/1 Inter, sans-serif; color: #9BAAA1; }
</style></head>
<body>
${sprite}
<div class="glow"></div>
<img class="leaves" src="/assets/img/leaves-wide-dark.webp" alt="">
<div class="copy">
  <div class="brand"><img class="mark" src="/assets/img/lotus-mint.png" alt=""><img class="word" src="/assets/img/wordmark-light.png" alt=""></div>
  <h1>Make room for <span>what matters.</span></h1>
  <div class="line">Personal finance, with clarity</div>
</div>
<div class="device">${phone}</div>
<div class="url">laxmee.in</div>
</body></html>
`;
await writeFile(path.join(site, 'og', 'og.html'), html);

const out = path.join(site, 'og', 'laxmee-og.png');
execFileSync(EDGE, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--virtual-time-budget=5000',
  `--screenshot=${out}`,
  '--window-size=1200,630',
  `${SERVER}/og/og.html`,
]);
console.log('wrote', out);
