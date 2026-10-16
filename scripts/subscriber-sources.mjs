#!/usr/bin/env node
/**
 * subscriber-sources.mjs — aggregate subscriber attribution from Resend.
 *
 * Reads RESEND_API_KEY + RESEND_AUDIENCE_{TLDR,ASEC,MNEMIX} from the
 * environment (values are never printed). For each configured audience it
 * lists contacts (paginated), GETs each contact's properties, and prints an
 * aggregate table: counts by source_path and counts by utm_source.
 *
 * Usage: node scripts/subscriber-sources.mjs   (or: npm run subscribers:sources)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://api.resend.com";
const apiKey = process.env.RESEND_API_KEY;

const audiences = [
  ["tldr", process.env.RESEND_AUDIENCE_TLDR],
  ["asec-waitlist", process.env.RESEND_AUDIENCE_ASEC],
  ["mnemix-beta", process.env.RESEND_AUDIENCE_MNEMIX],
].filter(([, id]) => id);

async function resend(requestPath, init = {}) {
  const res = await fetch(`${API}${requestPath}`, {
    ...init,
    headers: { Authorization: `Bearer ${apiKey}`, ...init.headers },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend ${init.method ?? "GET"} ${requestPath} → ${res.status}: ${detail}`);
  }
  return res.json();
}

async function listContacts(audienceId) {
  // Resend's list endpoint omits custom properties, so collect contacts
  // first, then GET each one. Paginate defensively — if the list response
  // ever grows a cursor/has_more shape we follow it, otherwise one page.
  const contacts = [];
  let path = `/audiences/${audienceId}/contacts`;
  const seen = new Set();
  for (let page = 0; page < 50; page++) {
    const data = await resend(path);
    const items = Array.isArray(data) ? data : data.data ?? [];
    contacts.push(...items);
    // Documented shape: `has_more` + `after=<last id>`. Older/undocumented
    // `next_cursor` is still followed if it ever appears.
    const last = items[items.length - 1];
    let next = null;
    if (data?.has_more && last?.id) next = `/audiences/${audienceId}/contacts?after=${encodeURIComponent(last.id)}`;
    else if (data?.next_cursor) next = `/audiences/${audienceId}/contacts?cursor=${encodeURIComponent(data.next_cursor)}`;
    if (next && !seen.has(next)) {
      seen.add(next);
      path = next;
    } else {
      break;
    }
  }
  return contacts;
}

function bump(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

/**
 * Visible ASCII for C0, DEL, C1, U+2028, and U+2029. Applied before width so
 * a newline, CR, ESC, or Unicode line separator cannot open a second row.
 * AGE-3654 / cedd7176.
 */
export function escapeReportField(value) {
  let out = "";
  for (const ch of String(value)) {
    const cp = ch.codePointAt(0);
    if (cp === 0x2028) {
      out += "\\u2028";
    } else if (cp === 0x2029) {
      out += "\\u2029";
    } else if (cp <= 0x1f || cp === 0x7f || (cp >= 0x80 && cp <= 0x9f)) {
      out += `\\x${cp.toString(16).padStart(2, "0")}`;
    } else {
      out += ch;
    }
  }
  return out;
}

export function formatTable(title, map, total) {
  const heading = String(title);
  const lines = ["", heading, "─".repeat(heading.length)];
  const rows = [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => [escapeReportField(key), count]);
  if (rows.length === 0) {
    lines.push("  (no data)");
    return lines.join("\n");
  }
  const width = Math.max(...rows.map(([key]) => key.length), 7);
  for (const [key, count] of rows) {
    lines.push(`  ${key.padEnd(width)}  ${String(count).padStart(5)}  ${((count / total) * 100).toFixed(1)}%`);
  }
  return lines.join("\n");
}

function printTable(title, map, total) {
  console.log(formatTable(title, map, total));
}

async function main() {
  if (!apiKey) {
    console.error("Error: missing RESEND_API_KEY in the environment.");
    process.exit(1);
  }
  if (audiences.length === 0) {
    console.error(
      "Error: no audience IDs configured (expected RESEND_AUDIENCE_TLDR / RESEND_AUDIENCE_ASEC / RESEND_AUDIENCE_MNEMIX).",
    );
    process.exit(1);
  }

  const totals = { contacts: 0, attributed: 0, failed: 0 };
  const bySource = new Map();
  const byUtm = new Map();
  const byListSource = new Map();

  for (const [list, audienceId] of audiences) {
    let contacts;
    try {
      contacts = await listContacts(audienceId);
    } catch (err) {
      console.error(`Error listing contacts for "${list}": ${err.message}`);
      process.exitCode = 1;
      continue;
    }
    for (const contact of contacts) {
      const id = contact.id ?? contact.email;
      if (!id) continue;
      totals.contacts++;
      let props = contact.properties;
      if (!props) {
        if (!contact.email) {
          console.error(`  ! contact without email in "${list}" — skipped`);
          totals.failed++;
          continue;
        }
        try {
          const full = await resend(
            `/contacts/${encodeURIComponent(contact.email)}?audience_id=${audienceId}`,
          );
          props = full.properties ?? {};
        } catch (err) {
          console.error(`  ! could not fetch properties for one contact in "${list}": ${err.message}`);
          totals.failed++;
          continue;
        }
      }
      const source = props.source_path || "(unknown)";
      bump(bySource, source);
      bump(byUtm, props.utm_source || "(none)");
      bump(byListSource, `${list} ${source}`);
      if (props.source_path || props.utm_source) totals.attributed++;
    }
  }

  console.log(`Audiences: ${audiences.map(([l]) => l).join(", ")}`);
  console.log(`Contacts scanned: ${totals.contacts} (${totals.attributed} with attribution)`);
  if (totals.failed > 0) {
    console.error(`INCOMPLETE: ${totals.failed} contact(s) could not be read — the counts below cover a subset. Exit 1.`);
    process.exitCode = 1;
  }
  printTable("By source_path", bySource, totals.contacts || 1);
  printTable("By utm_source", byUtm, totals.contacts || 1);
  printTable("By list + source_path", byListSource, totals.contacts || 1);
}

function canonicalPath(entry) {
  const resolved = path.resolve(entry);
  try {
    return fs.realpathSync(resolved);
  } catch {
    return resolved;
  }
}

const scriptFile = fileURLToPath(import.meta.url);
const invoked = process.argv[1] ? canonicalPath(process.argv[1]) : "";
if (invoked === canonicalPath(scriptFile)) {
  await main();
}
