#!/usr/bin/env node
/**
 * AGE-2590 / ML-1 — machine-legibility pack.
 *
 * Source checks always run. Set CHECK_LEGIBILITY_BASE (for example
 * http://127.0.0.1:3210) to also fetch the built site and prove the bodies,
 * twins, and frontmatter fields are actually served.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.CHECK_LEGIBILITY_BASE?.replace(/\/$/, "") ?? "";

const FLAGSHIP = "the-night-the-doctrine-failed";
const SERIES_POST = "the-dashboard-query-rls-wouldnt-let-through";
const BODY_SENTENCE = "I designed a cleanup pass to close the drift.";
const SERIES_NAME = "Mistakes TLDR";
const CITATION =
  "Sayeed, Abdur Rahman. 'The dashboard query RLS wouldn't let through.' abdur.ai, 25 July 2026.";

let failed = 0;

function pass(message) {
  console.log(`  ok  ${message}`);
}

function fail(message) {
  failed += 1;
  console.error(`  FAIL ${message}`);
}

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

function assertIncludes(label, haystack, needle) {
  if (haystack.includes(needle)) pass(`${label} includes ${JSON.stringify(needle).slice(0, 80)}`);
  else fail(`${label} missing ${JSON.stringify(needle).slice(0, 120)}`);
}

function assertExcludes(label, haystack, needle) {
  if (!haystack.includes(needle)) pass(`${label} excludes ${JSON.stringify(needle).slice(0, 80)}`);
  else fail(`${label} unexpectedly includes ${JSON.stringify(needle).slice(0, 120)}`);
}

const posts = read("lib/posts.ts");
assertIncludes("lib/posts.ts", posts, "series: scalarString(data.series)");
assertIncludes("lib/posts.ts", posts, "resolveRelated");

const llms = read("lib/llms-text.ts");
assertIncludes("lib/llms-text.ts", llms, "/llms-full.txt");
assertIncludes("lib/llms-text.ts", llms, "/writing/feed.json");
assertIncludes("lib/llms-text.ts", llms, "citation_preferred");
assertIncludes("lib/llms-text.ts", llms, "the memory and enrichment layer for AI agents");

const rss = read("lib/legibility.ts");
assertIncludes("lib/legibility.ts", rss, "content: itemContent(post)");
assertIncludes("lib/legibility.ts", rss, "content_text: itemContent(post)");
assertExcludes("lib/legibility.ts", rss, "content_html");

assertIncludes("rewrite", read("next.config.mjs"), '/writing/:slug.md');

async function fetchText(urlPath) {
  const response = await fetch(`${BASE}${urlPath}`);
  const text = await response.text();
  return { status: response.status, text, type: response.headers.get("content-type") ?? "" };
}

async function live() {
  const full = await fetchText("/llms-full.txt");
  if (full.status !== 200) fail(`llms-full.txt status ${full.status}`);
  else pass("llms-full.txt 200");
  assertIncludes("llms-full.txt", full.text, BODY_SENTENCE);
  assertIncludes("llms-full.txt", full.text, "citation_preferred");
  assertExcludes("llms-full.txt", full.text, "abdur-ai-launch-postmortem");

  const index = await fetchText("/llms.txt");
  assertIncludes("llms.txt", index.text, "/llms-full.txt");
  assertIncludes("llms.txt", index.text, SERIES_NAME);
  assertIncludes("llms.txt", index.text, CITATION);

  const twin = await fetchText(`/writing/${FLAGSHIP}.md`);
  if (twin.status !== 200) fail(`markdown twin status ${twin.status}`);
  else pass("markdown twin 200");
  assertIncludes("twin type", twin.type, "text/markdown");
  assertIncludes("twin", twin.text, BODY_SENTENCE);
  assertIncludes("twin", twin.text, `url: https://abdur.ai/writing/${FLAGSHIP}`);

  const draft = await fetchText("/writing/abdur-ai-launch-postmortem.md");
  if (draft.status === 404) pass("draft markdown twin 404");
  else fail(`draft markdown twin status ${draft.status}`);

  const rssXml = await fetchText("/writing/rss.xml");
  assertIncludes("rss type", rssXml.type, "rss");
  assertIncludes("rss body", rssXml.text, BODY_SENTENCE);
  assertIncludes("rss series", rssXml.text, SERIES_NAME);
  const flagshipItem = rssXml.text
    .split("<item>")
    .slice(1)
    .find((part) => part.includes(`<link>https://abdur.ai/writing/${FLAGSHIP}</link>`));
  if (!flagshipItem) fail("flagship missing from rss");
  else {
    const encoded = flagshipItem.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
    const description = flagshipItem.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
    if (!encoded || !encoded[1].includes(BODY_SENTENCE)) fail("rss content:encoded missing the body");
    else pass("rss content:encoded carries the body");
    if (!description) fail("rss item description missing");
    else if (description[1].includes(BODY_SENTENCE)) fail("rss description carries the body");
    else pass("rss description stays the dek");
  }

  const legacy = await fetchText("/aitldr/rss.xml");
  assertIncludes("legacy rss body", legacy.text, BODY_SENTENCE);

  const feed = await fetchText("/writing/feed.json");
  if (!feed.type.includes("feed+json") && !feed.type.includes("json")) {
    fail(`json feed type ${feed.type}`);
  } else pass(`json feed type ${feed.type}`);
  let parsed;
  try {
    parsed = JSON.parse(feed.text);
  } catch (error) {
    fail(`json feed parse ${error}`);
    return;
  }
  if (parsed.version !== "https://jsonfeed.org/version/1.1") fail(`json feed version ${parsed.version}`);
  else pass("json feed 1.1");
  const item = parsed.items?.find((entry) => entry.id?.endsWith(SERIES_POST));
  if (!item) {
    fail("series post missing from json feed");
    return;
  }
  assertIncludes("json content_text", item.content_text ?? "", "Postgres expands");
  if ("content_html" in item) fail("json item has content_html");
  else pass("json item has no content_html");
  if (item._abdur?.series !== SERIES_NAME) fail(`json series ${item._abdur?.series}`);
  else pass("json series");
  if (item._abdur?.citation_preferred !== CITATION) fail("json citation mismatch");
  else pass("json citation");
  const related = item._abdur?.related ?? [];
  if (related.some((url) => url.endsWith(`/writing/${FLAGSHIP}`))) pass("json related");
  else fail(`json related ${JSON.stringify(related)}`);

  const page = await fetchText(`/writing/${SERIES_POST}`);
  assertIncludes("post html series", page.text, SERIES_NAME);
  assertIncludes("post html citation", page.text, CITATION);
  assertIncludes("post html related", page.text, `/writing/${FLAGSHIP}`);
  assertIncludes("post html json-ld citation", page.text, "Preferred citation");
}

if (BASE) {
  await live();
} else {
  console.log("  skip live checks (set CHECK_LEGIBILITY_BASE)");
}

if (failed) {
  console.error(`\n${failed} legibility check(s) failed`);
  process.exit(1);
}
console.log("\nlegibility checks passed");
