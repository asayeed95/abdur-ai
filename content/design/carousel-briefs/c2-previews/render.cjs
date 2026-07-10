const path = require('path');
const { chromium } = require('/Users/agencyflow/projects/mnemix-site-v2/node_modules/playwright');
(async () => {
  const dir = __dirname;
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  await page.setViewportSize({ width: 1080, height: 1350 });
  await page.goto('file://' + path.join(dir, 'deck.html'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const slides = await page.$$('.slide');
  let i = 0;
  for (const s of slides) { i++; await s.screenshot({ path: path.join(dir, `c2-card-${String(i).padStart(2,'0')}.png`) }); }
  await browser.close();
  console.log('DONE', i, 'cards');
})().catch(e => { console.error(String(e)); process.exit(1); });
