#!/usr/bin/env node
/**
 * AGE-1222 — prove the three share routes emit absolute https://abdur.ai/...
 * image URLs, and that the committed 1200×630 cards exist.
 *
 * Default: files + source wiring (no server).
 * Optional: CHECK_OG_BASE=http://127.0.0.1:3000 also fetches the three routes.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://abdur.ai";

const ROUTES = [
  {
    id: "home",
    path: "/",
    file: "public/og/home.png",
    url: `${SITE}/og/home.png`,
  },
  {
    id: "pager",
    path: "/aitldr/your-pager-is-not-your-customer",
    file: "public/og/your-pager-is-not-your-customer.png",
    url: `${SITE}/og/your-pager-is-not-your-customer.png`,
  },
  {
    id: "number",
    path: "/aitldr/the-number-is-not-the-person",
    file: "public/og/the-number-is-not-the-person.png",
    url: `${SITE}/og/the-number-is-not-the-person.png`,
  },
];

const failures = [];

function pngSize(buf) {
  if (buf.length < 24 || buf.toString("ascii", 1, 4) !== "PNG") {
    throw new Error("not a PNG");
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

for (const route of ROUTES) {
  const abs = path.join(ROOT, route.file);
  if (!fs.existsSync(abs)) {
    failures.push(`missing ${route.file}`);
    continue;
  }
  const buf = fs.readFileSync(abs);
  try {
    const { width, height } = pngSize(buf);
    if (width !== 1200 || height !== 630) {
      failures.push(`${route.file} is ${width}×${height}, expected 1200×630`);
    }
  } catch (err) {
    failures.push(`${route.file}: ${err.message}`);
  }
}

const ogTs = read("lib/og.ts");
const siteTs = read("lib/site.ts");
if (!siteTs.includes('url: "https://abdur.ai"')) {
  failures.push('lib/site.ts SITE.url is not https://abdur.ai');
}
if (!ogTs.includes("absoluteOgUrl") || !ogTs.includes("SITE.url")) {
  failures.push("lib/og.ts must build image URLs from SITE.url");
}
for (const route of ROUTES) {
  const rel = route.file.replace(/^public/, "");
  if (!ogTs.includes(rel)) {
    failures.push(`lib/og.ts missing path ${rel}`);
  }
}

const layout = read("app/layout.tsx");
if (!layout.includes("ogImageForHome")) {
  failures.push("app/layout.tsx must use ogImageForHome()");
}
const postPage = read("app/aitldr/[slug]/page.tsx");
if (!postPage.includes("ogImageForPost")) {
  failures.push("app/aitldr/[slug]/page.tsx must use ogImageForPost()");
}

const base = process.env.CHECK_OG_BASE;
if (base) {
  const origin = base.replace(/\/$/, "");
  for (const route of ROUTES) {
    const res = await fetch(`${origin}${route.path}`);
    if (!res.ok) {
      failures.push(`GET ${route.path} → ${res.status}`);
      continue;
    }
    const html = await res.text();
    const og = html.match(/property="og:image" content="([^"]+)"/);
    const tw = html.match(/name="twitter:image" content="([^"]+)"/);
    if (!og) failures.push(`${route.path}: missing og:image`);
    else if (og[1] !== route.url) {
      failures.push(`${route.path}: og:image ${og[1]} ≠ ${route.url}`);
    }
    if (!tw) failures.push(`${route.path}: missing twitter:image`);
    else if (tw[1] !== route.url) {
      failures.push(`${route.path}: twitter:image ${tw[1]} ≠ ${route.url}`);
    }
    if (og && !og[1].startsWith("https://abdur.ai/")) {
      failures.push(`${route.path}: og:image is not an absolute abdur.ai URL`);
    }
  }
}

if (failures.length) {
  console.error("check-og-meta: FAIL");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("check-og-meta: ok");
for (const route of ROUTES) {
  console.log(`  ${route.path}  og:image=${route.url}`);
}
if (base) console.log(`  fetched ${ROUTES.length} routes from ${base}`);
else console.log("  source + files only (set CHECK_OG_BASE to fetch)");
