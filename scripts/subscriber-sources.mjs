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

const API = "https://api.resend.com";
const apiKey = process.env.RESEND_API_KEY;

const audiences = [
  ["tldr", process.env.RESEND_AUDIENCE_TLDR],
  ["asec-waitlist", process.env.RESEND_AUDIENCE_ASEC],
  ["mnemix-beta", process.env.RESEND_AUDIENCE_MNEMIX],
].filter(([, id]) => id);

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

async function resend(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${apiKey}`, ...init.headers },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend ${init.method ?? "GET"} ${path} → ${res.status}: ${detail}`);
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
    const next = data?.next_cursor ?? null;
    if (next && !seen.has(next)) {
      seen.add(next);
      path = `/audiences/${audienceId}/contacts?cursor=${encodeURIComponent(next)}`;
    } else {
      break;
    }
  }
  return contacts;
}

function bump(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function printTable(title, map, total) {
  console.log(`\n${title}`);
  console.log("─".repeat(title.length));
  const rows = [...map.entries()].sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) {
    console.log("  (no data)");
    return;
  }
  const width = Math.max(...rows.map(([k]) => k.length), 7);
  for (const [key, count] of rows) {
    console.log(`  ${key.padEnd(width)}  ${String(count).padStart(5)}  ${((count / total) * 100).toFixed(1)}%`);
  }
}

const totals = { contacts: 0, attributed: 0 };
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
      try {
        const full = await resend(
          `/contacts/${encodeURIComponent(contact.email)}?audience_id=${audienceId}`,
        );
        props = full.properties ?? {};
      } catch (err) {
        console.error(`  ! could not fetch properties for one contact in "${list}": ${err.message}`);
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
printTable("By source_path", bySource, totals.contacts || 1);
printTable("By utm_source", byUtm, totals.contacts || 1);
printTable("By list + source_path", byListSource, totals.contacts || 1);
