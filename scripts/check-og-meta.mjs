#!/usr/bin/env node
/**
 * AGE-1222 — iMessage / X / Slack share cards.
 *
 * One 1200×630 PNG per route. Prove files exist, source wires shareCard(),
 * and (when CHECK_OG_BASE is set) the three routes emit the full tag set:
 *   og:title, og:description, og:image (absolute https://abdur.ai/...),
 *   og:image:width, og:image:height, og:url, og:type,
 *   twitter:card=summary_large_image, twitter:image, twitter:title,
 *   twitter:description
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://abdur.ai";

const REQUIRED_TAGS = [
  "og:title",
  "og:description",
  "og:image",
  "og:image:width",
  "og:image:height",
  "og:url",
  "og:type",
  "twitter:card",
  "twitter:image",
  "twitter:title",
  "twitter:description",
];

const ROUTES = [
  {
    id: "home",
    path: "/",
    file: "public/og/home.png",
    image: `${SITE}/og/home.png`,
    pageUrl: SITE,
    type: "website",
  },
  {
    id: "pager",
    path: "/aitldr/your-pager-is-not-your-customer",
    file: "public/og/your-pager-is-not-your-customer.png",
    image: `${SITE}/og/your-pager-is-not-your-customer.png`,
    pageUrl: `${SITE}/aitldr/your-pager-is-not-your-customer`,
    type: "article",
  },
  {
    id: "number",
    path: "/aitldr/the-number-is-not-the-person",
    file: "public/og/the-number-is-not-the-person.png",
    image: `${SITE}/og/the-number-is-not-the-person.png`,
    pageUrl: `${SITE}/aitldr/the-number-is-not-the-person`,
    type: "article",
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

function parseMeta(html) {
  const found = {};
  for (const m of html.matchAll(/<meta\s+([^>]+)/g)) {
    const attrs = m[1];
    const key = attrs.match(/(?:property|name)="([^"]+)"/)?.[1];
    const content = attrs.match(/content="([^"]*)"/)?.[1];
    if (key && content !== undefined) found[key] = content;
  }
  return found;
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
if (!ogTs.includes("function shareCard") || !ogTs.includes("SHARE_CARD_TAGS")) {
  failures.push("lib/og.ts must export shareCard + SHARE_CARD_TAGS");
}
if (!ogTs.includes('card: "summary_large_image"')) {
  failures.push("lib/og.ts shareCard must set twitter:card summary_large_image");
}
for (const tag of REQUIRED_TAGS) {
  if (!ogTs.includes(`"${tag}"`)) {
    failures.push(`lib/og.ts SHARE_CARD_TAGS missing ${tag}`);
  }
}
for (const route of ROUTES) {
  const rel = route.file.replace(/^public/, "");
  if (!ogTs.includes(rel)) {
    failures.push(`lib/og.ts missing path ${rel}`);
  }
}

const layout = read("app/layout.tsx");
if (!layout.includes("shareCard") || !layout.includes("ogImageForHome")) {
  failures.push("app/layout.tsx must use shareCard() + ogImageForHome()");
}
const postPage = read("app/aitldr/[slug]/page.tsx");
if (!postPage.includes("shareCard") || !postPage.includes("ogImageForPost")) {
  failures.push("app/aitldr/[slug]/page.tsx must use shareCard() + ogImageForPost()");
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
    const meta = parseMeta(html);
    for (const tag of REQUIRED_TAGS) {
      if (!meta[tag]) failures.push(`${route.path}: missing ${tag}`);
    }
    if (meta["og:image"] !== route.image) {
      failures.push(`${route.path}: og:image ${meta["og:image"]} ≠ ${route.image}`);
    }
    if (meta["twitter:image"] !== route.image) {
      failures.push(
        `${route.path}: twitter:image ${meta["twitter:image"]} ≠ ${route.image}`,
      );
    }
    if (meta["og:image"] && !meta["og:image"].startsWith("https://abdur.ai/")) {
      failures.push(`${route.path}: og:image is not an absolute abdur.ai URL`);
    }
    if (meta["og:url"] !== route.pageUrl) {
      failures.push(`${route.path}: og:url ${meta["og:url"]} ≠ ${route.pageUrl}`);
    }
    if (meta["og:type"] !== route.type) {
      failures.push(`${route.path}: og:type ${meta["og:type"]} ≠ ${route.type}`);
    }
    if (meta["twitter:card"] !== "summary_large_image") {
      failures.push(`${route.path}: twitter:card ${meta["twitter:card"]}`);
    }
    if (meta["og:image:width"] !== "1200" || meta["og:image:height"] !== "630") {
      failures.push(`${route.path}: og:image size ${meta["og:image:width"]}×${meta["og:image:height"]}`);
    }
    if (!meta["og:title"] || !meta["twitter:title"]) {
      failures.push(`${route.path}: empty title tags`);
    }
    if (!meta["og:description"] || !meta["twitter:description"]) {
      failures.push(`${route.path}: empty description tags`);
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
  console.log(`  ${route.path}  og:image=${route.image}  og:type=${route.type}`);
}
console.log(`  required tags: ${REQUIRED_TAGS.join(", ")}`);
if (base) console.log(`  fetched ${ROUTES.length} routes from ${base}`);
else console.log("  source + files only (set CHECK_OG_BASE to fetch)");
