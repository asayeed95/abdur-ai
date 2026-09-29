#!/usr/bin/env node
/**
 * AGE-2590 / ML-1 — citation-baseline probe (MEASURE ONLY).
 *
 * Asks Perplexity a fixed list of probe questions and records, per question,
 * whether abdur.ai appears among the cited sources. It writes raw counts and
 * the returned citation URLs to a dated JSON file. Nothing else.
 *
 * Status: AGE-2590 stays open. The baseline and the 30-day re-run are not done
 * by committing this script. This file holds no baseline numbers and makes no
 * visibility-lift claim; any figure comes only from a real run.
 *
 * Usage:
 *   PERPLEXITY_API_KEY=... node scripts/pplx-baseline.mjs
 *
 * The key is read from the PERPLEXITY_API_KEY environment variable only. It is
 * never printed, logged, or written to the output file. With no key the script
 * prints "skipped: no key", writes nothing, and exits 0.
 *
 * Output: scratch/out/pplx-baseline-YYYY-MM-DD.json (scratch/ is gitignored).
 * Override the directory with PPLX_BASELINE_OUT_DIR.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_HOST = "abdur.ai";
const ENDPOINT = "https://api.perplexity.ai/chat/completions";
const MODEL = process.env.PPLX_MODEL || "sonar";

/** Citation probes. Neutral questions a reader could ask; none names abdur.ai. */
export const PROBES = [
  "What is an agent memory layer and how does it differ from RAG?",
  "Why do AI agents need long-term memory beyond a context window?",
  "How does memory latency affect voice AI agents?",
  "What is a post-mortem pattern for AI-assisted engineering mistakes?",
  "Who owns the architecture when AI writes the code?",
  "How can optional chaining hide a missing analytics provider in a web app?",
  "Why can a dashboard query pass tests but fail under Postgres row level security?",
  "What are common failure modes of retry storms caused by health checks?",
];

function isSiteUrl(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === SITE_HOST || host.endsWith(`.${SITE_HOST}`);
  } catch {
    return false;
  }
}

function citedUrls(body) {
  const urls = new Set();
  for (const entry of body?.citations ?? []) {
    if (typeof entry === "string") urls.add(entry);
  }
  for (const entry of body?.search_results ?? []) {
    if (typeof entry?.url === "string") urls.add(entry.url);
  }
  return [...urls];
}

async function probe(question, key) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: question }] }),
  });
  if (!response.ok) {
    // Status only: never echo headers or request details.
    return { question, error: `http ${response.status}`, cited: [], site_cited: false };
  }
  const urls = citedUrls(await response.json());
  return { question, cited: urls, site_cited: urls.some(isSiteUrl) };
}

async function main() {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) {
    console.log("pplx-baseline skipped: no key (set PERPLEXITY_API_KEY). Nothing written.");
    return;
  }

  const results = [];
  for (const question of PROBES) {
    try {
      results.push(await probe(question, key));
    } catch (error) {
      results.push({ question, error: error?.name ?? "request failed", cited: [], site_cited: false });
    }
  }

  const answered = results.filter((r) => !r.error);
  const summary = {
    probes: results.length,
    answered: answered.length,
    errors: results.length - answered.length,
    site_cited: answered.filter((r) => r.site_cited).length,
  };
  const date = new Date().toISOString().slice(0, 10);
  const dir = process.env.PPLX_BASELINE_OUT_DIR || path.join(ROOT, "scratch", "out");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `pplx-baseline-${date}.json`);
  fs.writeFileSync(
    file,
    `${JSON.stringify({ date, model: MODEL, site: SITE_HOST, summary, results }, null, 2)}\n`,
  );
  console.log(`pplx-baseline wrote ${path.relative(ROOT, file)}`);
  console.log(`raw counts: ${JSON.stringify(summary)}`);
}

await main();
