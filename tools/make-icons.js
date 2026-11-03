// Renders the app icons and a staged store screenshot with the pre-installed Chromium. node tools/make-icons.js [baseUrl]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#f3ead8"/>
<g transform="translate(${pad} ${pad}) scale(${(512 - 2 * pad) / 512})">
<circle cx="256" cy="256" r="200" fill="#cfe0e6" stroke="#1d1a14" stroke-width="8"/>
<path d="M120 200 L170 150 L240 170 L300 140 L380 180 L360 260 L290 300 L250 360 L180 330 L140 270 Z" fill="#e7dcc0" stroke="#1d1a14" stroke-width="8" stroke-linejoin="round"/>
<path d="M256 56 L270 240 L256 256 L242 240 Z" fill="#8a3b1f"/><path d="M256 456 L242 272 L256 256 L270 272 Z" fill="#1d1a14"/>
<path d="M56 256 L240 242 L256 256 L240 270 Z" fill="#1d1a14"/><path d="M456 256 L272 242 L256 256 L272 270 Z" fill="#1d1a14"/>
<circle cx="256" cy="256" r="14" fill="#f3ead8" stroke="#1d1a14" stroke-width="6"/>
</g></svg>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  const out = path.join(__dirname, '..', 'icons'); fs.mkdirSync(out, { recursive: true });
  for (const [name, pad, size] of [['icon-512.png', 0, 512], ['icon-192.png', 0, 192], ['maskable-512.png', 70, 512]]) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<html><body style="margin:0;background:#0b1220">${svg(pad).replace('viewBox="0 0 512 512"', `viewBox="0 0 512 512" width="${size}" height="${size}"`)}</body></html>`);
    await p.screenshot({ path: path.join(out, name), clip: { x: 0, y: 0, width: size, height: size } });
  }
  const base = process.argv[2];
  if (base) {
    const q = await b.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 });
    await q.goto(base + '?dev=1'); await q.waitForSelector('#app:not([hidden])');
    await q.evaluate(() => { const T = window.__cartographer; T.layers(); T.state.tools.inks = 1; T.identify(['FR','ES','DE']); T.seedCommission('IT', { tier: 1 }); });
    await q.waitForTimeout(400); await q.screenshot({ path: path.join(out, 'screenshot-portrait.png') });
  }
  await b.close(); console.log('icons written');
})();
