#!/usr/bin/env node
/**
 * AGE-2585 — check share-card policy eligibility in rendered robots.txt.
 *
 * The checker applies the matching semantics below to nine agent tokens. It
 * does not establish how those services fetch previews or obey robots.txt;
 * Slack tokens are policy test inputs, not evidence of Slack compliance.
 * Unlike an HTTP fetch, this checks the rendered policy and asserts:
 *   1. bare/query share-card URLs are allowed for the tested tokens;
 *   2. the selected API and near-miss paths are disallowed for those tokens;
 *   3. the selected public paths are allowed.
 *
 * This is a focused policy regression check, not a complete crawler emulator
 * or proof of preview rendering. Longest matching rules win; Allow wins ties.
 *
 * Usage: node scripts/check-robots.mjs [path-to-robots.txt]
 *   default: .next/server/app/robots.txt.body  (run `npm run build` first)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2] ?? path.join(ROOT, ".next/server/app/robots.txt.body");

// Agent tokens used to test policy eligibility; actual fetching behavior varies.
const CARD_BOTS = [
  "Twitterbot",
  "LinkedInBot",
  "Slackbot",
  "Slackbot-LinkExpanding",
  "facebookexternalhit",
  "Facebot",
  "Discordbot",
  "WhatsApp",
  "TelegramBot",
];
const MUST_STAY_CLOSED = ["/api/subscribe", "/api/ingest/now", "/api/ingest/ship", "/api/og-debug", "/api/og/private", "/api/og-image?title=x"];
const MUST_STAY_OPEN = ["/", "/writing", "/writing/the-night-the-doctrine-failed"];

/** Parse robots.txt into groups: { agents: string[], rules: { type, pattern }[] }. */
function parse(text) {
  const groups = [];
  let cur = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r\n|\r|\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const i = line.indexOf(":");
    if (i < 0) continue;
    const field = line.slice(0, i).trim().toLowerCase();
    const value = line.slice(i + 1).trim();
    if (field === "user-agent") {
      if (!cur || !lastWasAgent) {
        cur = { agents: [], rules: [] };
        groups.push(cur);
      }
      cur.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    // Unsupported records (including sitemap) do not terminate an agent group.
    if ((field === "allow" || field === "disallow") && cur) {
      lastWasAgent = false;
      cur.rules.push({ type: field, pattern: value });
    }
  }
  return groups;
}

/** Google's pattern syntax: `*` matches any run of characters, a trailing `$` anchors the end. */
function toRegex(pattern) {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*")
    .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

/** Select the most specific matching token group, falling back to `*`. */
function rulesFor(groups, botToken) {
  const t = botToken.toLowerCase();
  const scored = groups.map((group) => ({
    group,
    specificity: Math.max(0, ...group.agents
      .filter((agent) => agent !== "*" && agent !== "" && t.startsWith(agent))
      .map((agent) => agent.length)),
  }));
  const best = Math.max(0, ...scored.map(({ specificity }) => specificity));
  return scored.filter(({ group, specificity }) => best > 0
    ? specificity === best
    : group.agents.includes("*")).flatMap(({ group }) => group.rules);
}

function verdict(groups, botToken, urlPath) {
  let best = null;
  for (const r of rulesFor(groups, botToken)) {
    if (r.pattern === "") continue; // an empty Disallow allows everything; an empty Allow says nothing
    if (!toRegex(r.pattern).test(urlPath)) continue;
    const len = r.pattern.length;
    if (!best || len > best.len || (len === best.len && r.type === "allow" && best.type !== "allow")) {
      best = { type: r.type, pattern: r.pattern, len };
    }
  }
  return { allowed: !best || best.type === "allow", rule: best };
}

// ---- share-card path: read it from the source that builds every og:image ------------
const ogSource = fs.readFileSync(path.join(ROOT, "lib/og.ts"), "utf8");
const ogMatch = /`(\/api\/og)\?\$\{qs\}`/.exec(ogSource);

const failures = [];
const fail = (msg) => failures.push(msg);

if (!fs.existsSync(target)) {
  console.error(`check:robots FAIL — ${target} not found. Run "npm run build" first, or pass a robots.txt path.`);
  process.exit(2);
}
const groups = parse(fs.readFileSync(target, "utf8"));
if (!groups.some((g) => g.agents.includes("*"))) fail(`no "User-agent: *" group found in ${target}`);
if (!ogMatch) fail("could not find the share-card route (`/api/og?${qs}`) in lib/og.ts — update this check with it");

let assertions = 0;
if (ogMatch) {
  const cardUrl = `${ogMatch[1]}?title=A%20title&excerpt=An%20excerpt&path=abdur.ai/writing/x&kicker=ABDUR%20R%20SAYEED&tag=AI%20TLDR&meta=SEP%202026`;
  for (const bot of CARD_BOTS) {
    for (const cardPath of [ogMatch[1], cardUrl]) {
      assertions++;
      const v = verdict(groups, bot, cardPath);
      if (!v.allowed) {
        fail(`${bot} may NOT fetch the share card ${cardPath} (blocked by "${v.rule.type}: ${v.rule.pattern}") — rejected under the tested policy semantics`);
      }
    }
  }
}
for (const bot of CARD_BOTS) {
  for (const p of MUST_STAY_CLOSED) {
    assertions++;
    const v = verdict(groups, bot, p);
    if (v.allowed) fail(`${bot} may fetch ${p}, which must stay closed to crawlers`);
  }
  for (const p of MUST_STAY_OPEN) {
    assertions++;
    const v = verdict(groups, bot, p);
    if (!v.allowed) fail(`${bot} may NOT fetch ${p}, which must stay open (blocked by "${v.rule.type}: ${v.rule.pattern}")`);
  }
}

if (failures.length) {
  console.error(`check:robots FAIL — ${failures.length} of ${assertions} assertions (${path.relative(ROOT, target) || target})`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`check:robots PASS — ${assertions} assertions across ${CARD_BOTS.length} card crawlers (${path.relative(ROOT, target) || target})`);
