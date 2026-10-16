// Usage: PLAYWRIGHT_MODULE=/path/to/playwright node scripts/tests/mobile-prose-overflow.cjs
//   http://127.0.0.1:PORT /path/to/runtime/source /path/to/report.json
// The server must be a production build of the recorded source revision.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const [base, source, output] = process.argv.slice(2);
assert(base && source && output, 'Provide origin, runtime source directory, and report path');
const css = fs.readFileSync(path.join(__dirname, '../proposals/age-2976-prose-wrap.css'), 'utf8');
const slugs = fs.readdirSync(path.join(source, 'content/posts'))
  .filter(name => name.endsWith('.mdx')).map(name => name.slice(0, -4)).sort();
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

async function stableScreenshot(page) {
  let previous = await page.screenshot({ fullPage: true });
  for (let attempt = 0; attempt < 4; attempt++) {
    const current = await page.screenshot({ fullPage: true });
    if (previous.equals(current)) return current;
    previous = current;
  }
  throw new Error('Page did not reach a stable screenshot before comparison');
}

async function metrics(page, desktop) {
  return page.evaluate(desktop => ({
    overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
    geometry: [...document.querySelectorAll('body *:not(script):not(style)')].map(el => {
      const r = el.getBoundingClientRect();
      return [el.tagName, r.x, r.y, r.width, r.height];
    }),
    fenced: [...document.querySelectorAll('.prose-clay pre code')].map(el => ({
      wrap: getComputedStyle(el).overflowWrap,
      whiteSpace: getComputedStyle(el).whiteSpace,
    })),
    wrapping: [...document.querySelectorAll('.prose-clay code, .prose-clay a, .prose-clay .not-prose li > p')]
      .map(el => getComputedStyle(el).overflowWrap),
    styles: desktop ? [...document.querySelectorAll('body *:not(script):not(style)')].map(el => {
      const serialize = style => [...style].map(key => [key, style.getPropertyValue(key)]);
      return [serialize(getComputedStyle(el)), el.tagName === 'LI' ? serialize(getComputedStyle(el, '::marker')) : null];
    }) : null,
    text: desktop ? (() => {
      const result = [], walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent.trim() || node.parentElement.closest('script,style')) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        result.push([node.textContent, [...range.getClientRects()].map(r => [r.x, r.y, r.width, r.height])]);
      }
      return result;
    })() : null,
  }), desktop);
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  const report = { base, runtimeRevision: process.env.RUNTIME_REVISION || 'unrecorded',
    cssSha256: hash(css), browser: browser.version(), slugs, results: [] };
  try {
    for (const theme of ['light', 'dark']) {
      for (const width of [375, 1280]) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        for (const slug of slugs) {
          const response = await page.goto(`${base}/writing/${slug}`, { waitUntil: 'networkidle' });
          assert.equal(response.status(), 200, slug);
          await page.evaluate(async theme => {
            await document.fonts.ready;
            document.documentElement.setAttribute('data-theme', theme);
          }, theme);
          await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
          // Scroll every article into view so Reveal blocks settle before comparing.
          await page.evaluate(async () => {
            for (let y = 0; y < document.body.scrollHeight; y += 700) {
              scrollTo(0, y);
              await new Promise(resolve => setTimeout(resolve, 30));
            }
            scrollTo(0, 0);
          });
          await page.waitForTimeout(100);
          await page.waitForFunction(() => [...document.querySelectorAll('[data-reveal]')]
            .every(el => el.classList.contains('in')));
          const beforeImage = width === 1280 ? await stableScreenshot(page) : null;
          const before = await metrics(page, width === 1280);
          await page.addStyleTag({ content: css });
          const afterImage = width === 1280 ? await stableScreenshot(page) : null;
          const after = await metrics(page, width === 1280);
          const row = { slug, theme, width, beforeOverflow: before.overflow,
            afterOverflow: after.overflow, fencedUnchanged: JSON.stringify(before.fenced) === JSON.stringify(after.fenced) };
          if (width === 1280) {
            row.geometryUnchanged = JSON.stringify(before.geometry) === JSON.stringify(after.geometry);
            row.wrappingUnchanged = JSON.stringify(before.wrapping) === JSON.stringify(after.wrapping);
            row.computedStylesUnchanged = JSON.stringify(before.styles) === JSON.stringify(after.styles);
            row.textRectsUnchanged = JSON.stringify(before.text) === JSON.stringify(after.text);
            row.beforeScreenshotSha256 = hash(beforeImage);
            row.afterScreenshotSha256 = hash(afterImage);
            row.pixelsUnchanged = beforeImage.equals(afterImage);
            if (!row.pixelsUnchanged) {
              fs.writeFileSync(`${output}.${theme}.${slug}.before.png`, beforeImage);
              fs.writeFileSync(`${output}.${theme}.${slug}.after.png`, afterImage);
            }
          }
          report.results.push(row);
          console.log(JSON.stringify(row));
        }
        await page.close();
      }
    }
    report.passed = report.results.every(row => row.afterOverflow <= 0 && row.fencedUnchanged &&
      // Screenshot hashes remain diagnostics: Chromium marker-edge rasterization
      // can vary even when no desktop CSS rule applies. Require exact styles,
      // text/line rectangles, and element geometry instead of a pixel tolerance.
      (row.width !== 1280 || (row.geometryUnchanged && row.wrappingUnchanged && row.computedStylesUnchanged && row.textRectsUnchanged)));
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
    assert(report.passed, 'Overflow, desktop regression, or fenced-code regression; inspect report');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
