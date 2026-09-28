#!/usr/bin/env node
/**
 * AGE-2585 — share-card crawlers must be able to fetch /api/og.
 *
 * Every post's og:image / twitter:image is https://abdur.ai/api/og?…, and
 * app/robots.ts disallows /api/ for `*`. Twitterbot, LinkedInBot, Slackbot and
 * the other preview fetchers are not named in robots.txt, so they inherit `*`.
 * X documents (and developer reports show) that Twitterbot obeys robots.txt and
 * drops the image when its URL is disallowed. `check:og` cannot see this: it
 * proves the tags exist and the route answers 200 to a plain fetch, which is
 * exactly the kind of fetch that ignores robots.txt.
 *
 * This check reads the RENDERED robots.txt (what `next build` emits, not the
 * source) and applies Google's matching rules: the longest matching rule wins
 * and Allow wins a tie. It asserts:
 *   1. the share-card route (read from lib/og.ts, never retyped here) is
 *      fetchable by every card crawler below;
 *   2. the private API routes stay closed to those same crawlers;
 *   3. the public pages stay open.
 *
 * Usage: node scripts/check-robots.mjs [path-to-robots.txt]
 *   default: .next/server/app/robots.txt.body  (run `npm run build` first)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2] ?? path.join(ROOT, ".next/server/app/robots.txt.body");

// Preview/card fetchers. None is named in app/robots.ts, so each inherits `*`.
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
const MUST_STAY_CLOSED = ["/api/subscribe", "/api/ingest/now", "/api/ingest/ship"];
const MUST_STAY_OPEN = ["/", "/writing", "/writing/the-night-the-doctrine-failed"];

/** Parse robots.txt into groups: { agents: string[], rules: { type, pattern }[] }. */
function parse(text) {
  const groups = [];
  let cur = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
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
    lastWasAgent = false;
    if ((field === "allow" || field === "disallow") && cur) cur.rules.push({ type: field, pattern: value });
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

/** A crawler obeys the group naming its product token; only if none does, the `*` group. */
function rulesFor(groups, botToken) {
  const t = botToken.toLowerCase();
  const named = groups.filter((g) => g.agents.includes(t));
  return (named.length ? named : groups.filter((g) => g.agents.includes("*"))).flatMap((g) => g.rules);
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
    assertions++;
    const v = verdict(groups, bot, cardUrl);
    if (!v.allowed) {
      fail(`${bot} may NOT fetch the share card ${ogMatch[1]}?… (blocked by "${v.rule.type}: ${v.rule.pattern}") — a crawler that honours robots.txt will preview posts with no image`);
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
