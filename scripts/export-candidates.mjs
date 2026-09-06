#!/usr/bin/env node
/**
 * export-candidates.mjs — materialise AGE-1402 candidate events as JSONL.
 *
 * Reads the append-only `subscriber_candidates` table (written by
 * `app/api/resend/webhook/route.ts`) and emits one JSON object per line in
 * the packet §A.2 candidate shape, oldest first.
 *
 * This script is READ-ONLY and emits CANDIDATES. It does not write, and must
 * never be pointed at, `reports/prospector/accounts.jsonl` — promoting a
 * candidate into a ledger row is Prospector's judgement call, not an
 * automatic export. See docs/crm/age-1402-candidate-export.md.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (values never
 * printed).
 *
 * Usage:
 *   node scripts/export-candidates.mjs                    # JSONL to stdout
 *   node scripts/export-candidates.mjs --since 2026-09-01 # cursor by received_at
 *   node scripts/export-candidates.mjs --out candidates.jsonl   # append-only file
 *   node scripts/export-candidates.mjs --latest-per-contact     # newest state only
 */

import { appendFileSync, existsSync, readFileSync } from "node:fs";

const args = process.argv.slice(2);
function flag(name) {
  return args.includes(`--${name}`);
}
function opt(name) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) {
  console.error("Error: missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}

const since = opt("since");
const outPath = opt("out");
const latestPerContact = flag("latest-per-contact");

const select =
  "event_id,received_at,email,audience,resend_contact_id,properties,channel,event,evidence";
let path = `/rest/v1/subscriber_candidates?select=${select}&order=received_at.asc,event_id.asc`;
if (since) path += `&received_at=gte.${encodeURIComponent(since)}`;

const rows = [];
const PAGE = 500;
for (let offset = 0; ; offset += PAGE) {
  const res = await fetch(`${base}${path}&limit=${PAGE}&offset=${offset}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    console.error(`Error: Supabase ${res.status}: ${await res.text().catch(() => "")}`);
    process.exit(1);
  }
  const page = await res.json();
  rows.push(...page);
  if (page.length < PAGE) break;
}

let emit = rows;
if (latestPerContact) {
  // Rows are ascending, so the last write per contact wins.
  const byContact = new Map();
  for (const row of rows) byContact.set(row.resend_contact_id, row);
  emit = [...byContact.values()];
}

// Never re-emit a line an existing output file already carries: the file is
// append-only, keyed on event_id, exactly like the table.
let alreadyWritten = new Set();
if (outPath && existsSync(outPath)) {
  for (const line of readFileSync(outPath, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      alreadyWritten.add(JSON.parse(line).event_id);
    } catch {
      // A hand-edited line we cannot parse is left alone, not rewritten.
    }
  }
}

let written = 0;
for (const row of emit) {
  if (alreadyWritten.has(row.event_id)) continue;
  const line = JSON.stringify(row);
  if (outPath) appendFileSync(outPath, line + "\n");
  else console.log(line);
  written++;
}

if (outPath) {
  console.error(
    `${written} candidate event(s) appended to ${outPath} (${rows.length} read, ${alreadyWritten.size} already present).`,
  );
}
