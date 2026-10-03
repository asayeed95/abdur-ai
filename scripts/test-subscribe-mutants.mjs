#!/usr/bin/env node
/**
 * Mutation check for the signup journey suite (AGE-2884).
 *
 * A suite that has never failed proves little. This reintroduces known defects
 * into the signup route / article component ONE AT A TIME, rebuilds, runs
 * scripts/test-subscribe-journey.mjs, and reports which scenarios caught each.
 * A mutant that no scenario catches is a hole in the suite and fails this run.
 *
 * Slow on purpose (one production build per mutant, ~30 s each) so it is NOT in
 * the gate. Run it when the route or the suite changes:  npm run test:subscribe:mutants
 * Files are restored from memory on exit, including on Ctrl-C.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const ROUTE = "app/api/subscribe/route.ts";
const ARTICLE = "components/post/PostArticle.tsx";
const SITEMAP = "app/sitemap.ts";
const RESEND_BASE = "lib/resend-base.ts";

const MUTANTS = [
  {
    name: "undocumented `unsubscribe` body field returns (headers.List-Unsubscribe removed)",
    file: ROUTE,
    from: 'headers: { "List-Unsubscribe": `<mailto:${SITE.email}?subject=${unsubSubject}>` },',
    to: 'unsubscribe: `mailto:${SITE.email}?subject=${unsubSubject}`,',
  },
  { name: "address no longer lowercased", file: ROUTE, from: ".toLowerCase().max(254)", to: ".max(254)" },
  { name: "no maximum address length", file: ROUTE, from: ".max(254)", to: "" },
  {
    name: "native (no-JS) form posts get the raw JSON document again",
    file: ROUTE,
    from: "    if (isNativeForm) {\n      const to = new URL",
    to: "    if (false) {\n      const to = new URL",
  },
  {
    name: "raw address back in the idempotency key",
    file: ROUTE,
    from: "welcome-${list}/${emailTag(email)}",
    to: "welcome-${list}/${email}",
  },
  {
    name: "contact call loses its timeout",
    file: ROUTE,
    from: "      signal: AbortSignal.timeout(CONTACT_TIMEOUT_MS),\n",
    to: "",
  },
  {
    name: "attribution backfill GET loses its timeout",
    file: ROUTE,
    from: "{ headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(BACKFILL_TIMEOUT_MS) },",
    to: "{ headers: { Authorization: `Bearer ${apiKey}` } },",
  },
  {
    name: "tables no longer wrapped in a scroll container",
    file: ARTICLE,
    from: '<div className="overflow-x-auto" role="region"',
    to: '<div className="" role="region"',
  },
  {
    name: "inline article signup removed",
    file: ARTICLE,
    from: '{!source.includes("<NewsletterCTA") && <PostSubscribe />}',
    to: "{null}",
  },
  {
    name: "RESEND_API_BASE_URL honoured for any https host again",
    file: RESEND_BASE,
    from: "if (u.origin === RESEND_API_ORIGIN) return u.origin;",
    to: 'if (u.protocol === "https:") return u.origin;',
  },
  {
    name: "index pages report build time as lastmod (F10)",
    file: SITEMAP,
    from: "const newestChange = changeTimes.length ? new Date(Math.max(...changeTimes)) : undefined;",
    to: "const newestChange = new Date();",
  },
];

const original = new Map([ROUTE, ARTICLE, SITEMAP, RESEND_BASE].map((f) => [f, readFileSync(f, "utf8")]));
const restore = () => original.forEach((text, f) => writeFileSync(f, text));
process.on("SIGINT", () => { restore(); process.exit(130); });
process.on("exit", restore);

const sh = (cmd) => {
  try { return { ok: true, out: execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 240_000 }) }; }
  catch (e) { return { ok: false, out: `${e.stdout ?? ""}${e.stderr ?? ""}` }; }
};

const rows = [];
for (const m of MUTANTS) {
  const text = original.get(m.file);
  if (!text.includes(m.from)) { rows.push({ m, error: "mutation anchor not found (route changed? update this script)" }); continue; }
  writeFileSync(m.file, text.replace(m.from, m.to));
  const build = sh("npm run build");
  if (!build.ok) { rows.push({ m, error: "mutant did not build" }); restore(); continue; }
  const run = sh("node scripts/test-subscribe-journey.mjs");
  const failed = run.out.split("\n").filter((l) => l.startsWith("FAIL")).map((l) => l.replace(/^FAIL\s+/, "").replace(/\s{2,}\[.*$/, ""));
  rows.push({ m, failed });
  restore();
}
restore();
const pristine = sh("npm run build");

let survivors = 0;
console.log("\nMutation check — each row reintroduces one defect; scenarios that caught it are listed\n");
for (const r of rows) {
  if (r.error) { survivors++; console.log(`ERROR     ${r.m.name}\n          ${r.error}`); continue; }
  const caught = r.failed.length > 0;
  if (!caught) survivors++;
  console.log(`${caught ? "KILLED  " : "SURVIVED"}  ${r.m.name}  (${r.failed.length} scenario${r.failed.length === 1 ? "" : "s"})`);
  for (const f of r.failed) console.log(`            ↳ ${f}`);
}
console.log(`\n${rows.length - survivors}/${rows.length} mutants killed. Pristine tree rebuilt: ${pristine.ok ? "ok" : "BUILD FAILED"}.`);
process.exit(survivors || !pristine.ok ? 1 : 0);
