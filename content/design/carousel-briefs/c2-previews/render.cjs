const path = require('path');
// Prefer a locally-installed playwright; fall back to the mnemix-site-v2 install this rig has always used.
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/Users/agencyflow/projects/mnemix-site-v2/node_modules/playwright')); }
(async () => {
  const dir = __dirname;
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome' });
    const page = await browser.newPage({ deviceScaleFactor: 2 });
    await page.setViewportSize({ width: 1080, height: 1350 });
    await page.goto('file://' + path.join(dir, 'deck.html'), { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    const slides = await page.$$('.slide');
    let i = 0;
    for (const s of slides) { i++; await s.screenshot({ path: path.join(dir, `c2-card-${String(i).padStart(2,'0')}.png`) }); }
    console.log('DONE', i, 'cards');
  } finally {
    if (browser) await browser.close();
  }
})().catch(e => { console.error(String(e)); process.exit(1); });
