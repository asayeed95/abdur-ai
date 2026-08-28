#!/usr/bin/env node
/**
 * OG-API-001 / AGE-1386 — parameterized /api/og share cards.
 *
 * Live og:image is /api/og?… (1200×630 PNG). AGE-1222 public/og/*.png may
 * stay on disk as leftovers and must not be the live messenger image.
 *
 * Prove source wires shareCard() + /api/og, and (when CHECK_OG_BASE is set)
 * the three routes emit the full tag set:
 *   og:title, og:description, og:image (absolute https://abdur.ai/api/og?…),
 *   og:image:alt, og:image:width, og:image:height, og:url, og:type,
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
  "og:image:alt",
  "og:image:width",
  "og:image:height",
  "og:url",
  "og:type",
  "twitter:card",
  "twitter:image",
  "twitter:title",
  "twitter:description",
];

function encodeOgValue(value) {
  return encodeURIComponent(value).replace(/%2F/gi, "/");
}

function apiOg(params) {
  const pairs = [
    ["title", params.title],
    ["excerpt", params.excerpt ?? ""],
    ["path", params.path ?? "abdur.ai"],
    ["kicker", params.kicker ?? "ABDUR R SAYEED"],
    ["tag", params.tag ?? "AI TLDR"],
    ["meta", params.meta ?? ""],
  ];
  const qs = pairs
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `${encodeOgValue(key)}=${encodeOgValue(value)}`)
    .join("&");
  return `${SITE}/api/og?${qs}`;
}

const ROUTES = [
  {
    id: "home",
    path: "/",
    pageUrl: SITE,
    type: "website",
    image: apiOg({
      title: "The logbook",
      excerpt: "What shipped. What broke. What I learned.",
      path: "abdur.ai",
      tag: "LOGBOOK",
    }),
    altIncludes: "logbook",
  },
  {
    id: "pager",
    path: "/aitldr/your-pager-is-not-your-customer",
    pageUrl: `${SITE}/aitldr/your-pager-is-not-your-customer`,
    type: "article",
    image: apiOg({
      title: "Your pager is not your customer",
      excerpt:
        "A production health cron aborted around 100ms while the documented slow-warn was 2000ms.",
      path: "abdur.ai/aitldr/your-pager-is-not-your-customer",
      tag: "AI TLDR",
      meta: "AUG 2026",
    }),
    altIncludes: "pager",
  },
  {
    id: "number",
    path: "/aitldr/the-number-is-not-the-person",
    pageUrl: `${SITE}/aitldr/the-number-is-not-the-person`,
    type: "article",
    image: apiOg({
      title: "The number is not the person",
      excerpt:
        "Voice agents that persist contact memory on the phone number will replay the last caller on a shared line.",
      path: "abdur.ai/aitldr/the-number-is-not-the-person",
      tag: "AI TLDR",
      meta: "AUG 2026",
    }),
    altIncludes: "number",
  },
];

const PROOF_OG =
  "https://abdur.ai/api/og?title=The%20number%20is%20not%20the%20person&excerpt=Voice%20agents%20that%20persist%20contact%20memory%20on%20the%20phone%20number%20will%20replay%20the%20last%20caller%20on%20a%20shared%20line.&path=abdur.ai/aitldr/the-number-is-not-the-person&kicker=ABDUR%20R%20SAYEED&tag=AI%20TLDR&meta=AUG%202026";

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

const numberRoute = ROUTES.find((r) => r.id === "number");
if (numberRoute.image !== PROOF_OG) {
  failures.push(`number og URL drifted from the handoff proof URL\n    got: ${numberRoute.image}\n    exp: ${PROOF_OG}`);
}

const ogRoute = path.join(ROOT, "app/api/og/route.tsx");
if (!fs.existsSync(ogRoute)) {
  failures.push("missing app/api/og/route.tsx");
} else {
  const src = read("app/api/og/route.tsx");
  if (!src.includes('from "next/og"') || !src.includes("ImageResponse")) {
    failures.push("app/api/og/route.tsx must use ImageResponse from next/og");
  }
  if (!src.includes('runtime = "edge"')) {
    failures.push("app/api/og/route.tsx must be Edge");
  }
  if (!src.includes("#050505") || !src.includes("#D97757")) {
    failures.push("app/api/og/route.tsx must keep the clay visual spec");
  }
  if (src.includes("prisma") || src.includes("supabase") || src.includes("getPost(")) {
    failures.push("app/api/og/route.tsx must not look up a database or post");
  }
}

const ogTs = read("lib/og.ts");
const siteTs = read("lib/site.ts");
if (!siteTs.includes('url: "https://abdur.ai"')) {
  failures.push("lib/site.ts SITE.url is not https://abdur.ai");
}
if (!ogTs.includes("function shareCard") || !ogTs.includes("SHARE_CARD_TAGS")) {
  failures.push("lib/og.ts must export shareCard + SHARE_CARD_TAGS");
}
if (!ogTs.includes("function buildOgPath") || !ogTs.includes("/api/og?")) {
  failures.push("lib/og.ts must build /api/og? query URLs");
}
if (!ogTs.includes('card: "summary_large_image"')) {
  failures.push("lib/og.ts shareCard must set twitter:card summary_large_image");
}
for (const tag of REQUIRED_TAGS) {
  if (!ogTs.includes(`"${tag}"`)) {
    failures.push(`lib/og.ts SHARE_CARD_TAGS missing ${tag}`);
  }
}
if (ogTs.includes("ogImageForHome") && /ogImageForHome[\s\S]*OG_LEFTOVER_PNGS|OG_PATHS/.test(ogTs)) {
  failures.push("ogImageForHome must not use leftover static PNGs");
}
if (!ogTs.includes('tag: OG_TAG_HOME') && !ogTs.includes('tag: "LOGBOOK"')) {
  failures.push("home card must use tag=LOGBOOK");
}
if (!ogTs.includes("ABDUR R SAYEED")) {
  failures.push("lib/og.ts must use kicker ABDUR R SAYEED");
}

const layout = read("app/layout.tsx");
if (!layout.includes("shareCard") || !layout.includes("ogImageForHome")) {
  failures.push("app/layout.tsx must use shareCard() + ogImageForHome()");
}
const postPage = read("app/aitldr/[slug]/page.tsx");
if (!postPage.includes("shareCard") || !postPage.includes("ogImageForPost")) {
  failures.push("app/aitldr/[slug]/page.tsx must use shareCard() + ogImageForPost()");
}
if (postPage.includes("ogImageForPost(post.slug")) {
  failures.push("generateMetadata must pass the post (frontmatter), not only the slug");
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
    if (meta["og:image"] && !meta["og:image"].startsWith("https://abdur.ai/api/og?")) {
      failures.push(`${route.path}: og:image is not a parameterized /api/og URL`);
    }
    if (meta["og:image"]?.includes("/og/") && meta["og:image"]?.endsWith(".png")) {
      failures.push(`${route.path}: leftover static PNG is still the live og:image`);
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
    if (!meta["og:image:alt"] || !meta["og:image:alt"].toLowerCase().includes(route.altIncludes)) {
      failures.push(`${route.path}: og:image:alt missing or not meaningful`);
    }
  }

  const proofPath = PROOF_OG.replace(SITE, "");
  const imgRes = await fetch(`${origin}${proofPath}`);
  const contentType = imgRes.headers.get("content-type") ?? "";
  if (!imgRes.ok) {
    failures.push(`GET /api/og proof → ${imgRes.status}`);
  } else if (!contentType.includes("image/png")) {
    failures.push(`GET /api/og proof content-type ${contentType}`);
  } else {
    const buf = Buffer.from(await imgRes.arrayBuffer());
    try {
      const { width, height } = pngSize(buf);
      if (width !== 1200 || height !== 630) {
        failures.push(`/api/og proof is ${width}×${height}, expected 1200×630`);
      }
    } catch (err) {
      failures.push(`/api/og proof: ${err.message}`);
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
if (base) console.log(`  fetched ${ROUTES.length} routes + /api/og proof from ${base}`);
else console.log("  source only (set CHECK_OG_BASE to fetch)");
