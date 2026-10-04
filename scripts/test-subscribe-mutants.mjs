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
import { execSync, spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

// ---- Safety rails. This script edits tracked source files IN PLACE and rebuilds .next, so:
// 1. refuse to run on a dirty tree: a half-edited "original" would be restored as if it were clean;
// 2. take a lock: two concurrent runs corrupt each other's originals and the shared .next;
// 3. restore on SIGINT/SIGTERM too. Child builds run asynchronously so these handlers can fire.
const FILES = [...new Set(MUTANTS.map((m) => m.file))];
try {
  execSync(`git diff --quiet -- ${FILES.join(" ")}`, { stdio: "ignore" });
} catch {
  console.error(`Refusing to run: ${FILES.join(", ")} have uncommitted changes. Commit or stash them first.`);
  process.exit(2);
}
const LOCK = join(tmpdir(), "abdur-ai-subscribe-mutants.lock");
try {
  mkdirSync(LOCK);
} catch {
  console.error(`Another mutation run holds ${LOCK}. If none is running (and 'git status' is clean), remove that directory and retry.`);
  process.exit(2);
}
const original = new Map(FILES.map((f) => [f, readFileSync(f, "utf8")]));
let child = null;
const killGroup = (pid) => { try { process.kill(-pid, "SIGKILL"); } catch { /* already gone */ } };
const restore = () => original.forEach((text, f) => writeFileSync(f, text));
const cleanup = () => { restore(); rmSync(LOCK, { recursive: true, force: true }); };
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => { if (child) killGroup(child.pid); cleanup(); process.exit(130); });
}
process.on("exit", cleanup);

/** Run a shell command asynchronously (so signal handlers can run) and collect its output. */
const sh = (cmd) =>
  new Promise((resolve) => {
    let out = "";
    // detached => own process group, so the whole npm -> next build tree can be killed, not just `sh`.
    child = spawn("sh", ["-c", cmd], { stdio: ["ignore", "pipe", "pipe"], detached: true });
    const pg = child.pid;
    const timer = setTimeout(() => killGroup(pg), 240_000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => { clearTimeout(timer); child = null; resolve({ ok: code === 0, out }); });
  });

const rows = [];
for (const m of MUTANTS) {
  const text = original.get(m.file);
  if (!text.includes(m.from)) { rows.push({ m, error: "mutation anchor not found (route changed? update this script)" }); continue; }
  writeFileSync(m.file, text.replace(m.from, m.to));
  const build = await sh("npm run build");
  if (!build.ok) { rows.push({ m, error: "mutant did not build" }); restore(); continue; }
  const run = await sh("node scripts/test-subscribe-journey.mjs");
  const failed = run.out.split("\n").filter((l) => l.startsWith("FAIL")).map((l) => l.replace(/^FAIL\s+/, "").replace(/\s{2,}\[.*$/, ""));
  rows.push({ m, failed });
  restore();
}
restore();
const pristine = await sh("npm run build");

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
