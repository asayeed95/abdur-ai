#!/usr/bin/env node
/**
 * Signup-journey boundary tests (AGE-2884).
 *
 * Starts the REAL built site (`next start`) against a local stand-in for the
 * Resend API and drives /api/subscribe the way a browser does. Every scenario
 * asserts what actually crossed the boundary — the stand-in records each
 * provider request — not just the HTTP status the visitor saw.
 *
 * WHAT THIS PROVES: this app's behaviour at each boundary it owns (validation,
 * normalisation, bot guard, provider calls made, failure handling, native-form
 * path, article-level signup presence).
 * WHAT IT CANNOT PROVE: anything Resend does. Provider acceptance of the real
 * payload, delivery, inbox receipt and unsubscribe handling need the real API
 * and a controlled inbox; they are reported as NOT OBSERVED, never inferred.
 *
 * Usage: npm run build && npm run test:subscribe
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import http from "node:http";
import net from "node:net";

const require = createRequire(import.meta.url);

/** Body fields documented for POST https://api.resend.com/emails (docs read 2026-10-03). */
const DOCUMENTED_SEND_FIELDS = new Set([
  "from", "to", "subject", "bcc", "cc", "scheduled_at", "reply_to", "html",
  "text", "react", "headers", "attachments", "tags", "template", "topic_id",
]);

if (!existsSync(".next/BUILD_ID")) {
  console.error("No production build found. Run `npm run build` first.");
  process.exit(2);
}

const freePort = () =>
  new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

// ---------- Resend stand-in -------------------------------------------------
const calls = []; // every provider request, in order
const contacts = new Set();
const idempotency = new Map();
const mode = { contact: "ok", emails: "ok", backfill: "ok" };
function resetMock() {
  calls.length = 0;
  contacts.clear();
  idempotency.clear();
  mode.contact = "ok";
  mode.emails = "ok";
  mode.backfill = "ok";
}

const mock = http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch { /* non-JSON */ }
    const call = { method: req.method, path: req.url, headers: req.headers, body };
    calls.push(call);
    const json = (status, obj) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(obj));
    };
    if (req.url === "/contact-properties") return json(201, { id: "prop" });
    if (req.method === "POST" && /^\/audiences\/[^/]+\/contacts$/.test(req.url)) {
      if (mode.contact === "hang") return; // never answer
      if (mode.contact === "destroy") return req.socket.destroy();
      if (mode.contact === "500") return json(500, { message: "provider exploded: secret-detail" });
      const e = body.email;
      if (contacts.has(e)) return json(409, { message: "exists" });
      contacts.add(e);
      return json(201, { id: `c_${contacts.size}` });
    }
    if (req.method === "GET" && req.url.startsWith("/contacts/")) {
      if (mode.backfill === "hang") return; // never answer
      return json(200, { properties: {} });
    }
    if (req.method === "PATCH" && req.url.startsWith("/contacts/")) return json(200, { id: "c" });
    if (req.method === "POST" && req.url === "/emails") {
      if (mode.emails === "500") return json(500, { message: "send failed" });
      const key = req.headers["idempotency-key"];
      if (key && idempotency.has(key)) return json(200, { id: idempotency.get(key) });
      const id = `em_${calls.filter((c) => c.path === "/emails").length}`;
      if (key) idempotency.set(key, id);
      return json(200, { id });
    }
    return json(404, { message: "unknown route" });
  });
});

// ---------- Site under test --------------------------------------------------
function startSite({ port, mockPort, withConfig = true }) {
  const env = { ...process.env, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" };
  delete env.RESEND_API_KEY;
  delete env.RESEND_AUDIENCE_TLDR;
  if (withConfig) {
    env.RESEND_API_KEY = "re_test_not_a_real_key";
    env.RESEND_AUDIENCE_TLDR = "aud_test_tldr";
  }
  env.RESEND_API_BASE_URL = `http://127.0.0.1:${mockPort}`;
  const logs = [];
  // detached => its own process group, so stopSite() can kill `next` AND the next-server it forks;
  // killing only the CLI left an orphaned server behind after every run.
  const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "-p", String(port)], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  child.stdout.on("data", (d) => logs.push(String(d)));
  child.stderr.on("data", (d) => logs.push(String(d)));
  return { child, logs, base: `http://127.0.0.1:${port}` };
}
async function waitReady(base) {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`${base}/subscribe`);
      if (r.status === 200) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`site did not become ready at ${base}`);
}

// ---------- Tiny harness -----------------------------------------------------
const results = [];
async function scenario(name, observed, fn) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, observed, ms: Date.now() - t0 });
  } catch (err) {
    results.push({ name, ok: false, observed, ms: Date.now() - t0, err: err instanceof Error ? err.message : String(err) });
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
const post = (base, body, headers = {}) =>
  fetch(`${base}/api/subscribe`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(20_000), // a removed server-side timeout must fail a scenario, not hang the suite
  });
const form = (base, fields) =>
  fetch(`${base}/api/subscribe`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
    signal: AbortSignal.timeout(20_000), // same bound as post(): a hung native-form request fails its scenario, not the suite
  });
const slow = () => Date.now() - 6000; // a human-plausible render time
const contactCalls = () => calls.filter((c) => /\/audiences\/.+\/contacts$/.test(c.path) && c.method === "POST");
const emailCalls = () => calls.filter((c) => c.path === "/emails");

await new Promise((r) => mock.listen(0, "127.0.0.1", r));
const mockPort = mock.address().port;
const port = await freePort();
const site = startSite({ port, mockPort });
const bare = { port: await freePort() };
const noConfig = startSite({ port: bare.port, mockPort, withConfig: false });

try {
  await Promise.all([waitReady(site.base), waitReady(noConfig.base)]);

  await scenario("valid JS signup → 200, contact stored once, one welcome", "provider accepted (stand-in)", async () => {
    resetMock();
    const r = await post(site.base, { email: "ada@example.com", rendered_at: slow(), source_path: "/writing/x", utm_source: "t" });
    assert(r.status === 200 && (await r.json()).ok === true, `status ${r.status}`);
    assert(contactCalls().length === 1, `contact calls: ${contactCalls().length}`);
    assert(contactCalls()[0].body.unsubscribed === false, "contact not created as subscribed");
    assert(contactCalls()[0].body.properties?.source_path === "/writing/x", "attribution property missing");
    assert(emailCalls().length === 1, `welcome sends: ${emailCalls().length}`);
  });

  await scenario("email is trimmed + lowercased before the provider sees it", "provider accepted (stand-in)", async () => {
    resetMock();
    const r = await post(site.base, { email: "  Ada@Example.COM ", rendered_at: slow() });
    assert(r.status === 200, `status ${r.status}`);
    assert(contactCalls()[0].body.email === "ada@example.com", `got ${contactCalls()[0].body.email}`);
    assert(emailCalls()[0].body.to[0] === "ada@example.com", "welcome sent to un-normalised address");
  });

  await scenario("welcome payload uses only documented Resend fields, carries List-Unsubscribe", "request shape (stand-in)", async () => {
    resetMock();
    await post(site.base, { email: "shape@example.com", rendered_at: slow() });
    const sent = emailCalls()[0].body;
    const unknown = Object.keys(sent).filter((k) => !DOCUMENTED_SEND_FIELDS.has(k));
    assert(unknown.length === 0, `undocumented fields sent: ${unknown.join(", ")}`);
    assert(/^<mailto:[^>]+>$/.test(sent.headers?.["List-Unsubscribe"] ?? ""), "List-Unsubscribe header missing/malformed");
  });

  await scenario("idempotency key never contains the raw address", "request shape (stand-in)", async () => {
    resetMock();
    await post(site.base, { email: "private.person@example.com", rendered_at: slow() });
    const key = emailCalls()[0].headers["idempotency-key"] ?? "";
    assert(key.startsWith("welcome-tldr/") && key.length > 20, `key: ${key}`);
    assert(!key.includes("private") && !key.includes("@"), `key leaks address: ${key}`);
  });

  await scenario("invalid email → 400 with a human message, no provider traffic", "validation (app only)", async () => {
    for (const bad of ["not-an-email", "a@b", "", "x".repeat(300) + "@example.com"]) {
      resetMock();
      const r = await post(site.base, { email: bad, rendered_at: slow() });
      const j = await r.json();
      assert(r.status === 400, `"${bad.slice(0, 12)}": status ${r.status}`);
      assert(j.error === "Enter a valid email address.", `"${bad.slice(0, 12)}": error was ${JSON.stringify(j.error).slice(0, 80)}`);
      assert(calls.length === 0, `provider was called for invalid input`);
    }
  });

  await scenario("missing email field / malformed JSON → 400, no provider traffic", "validation (app only)", async () => {
    resetMock();
    const a = await post(site.base, { rendered_at: slow() });
    const b = await post(site.base, "{not json");
    assert(a.status === 400 && b.status === 400, `statuses ${a.status}/${b.status}`);
    assert(calls.length === 0, "provider called");
  });

  await scenario("native form (JS off) success → 303 to /subscribe?subscribed=1, page renders the notice", "redirect + render (app only)", async () => {
    resetMock();
    const r = await form(site.base, { email: "native@example.com", rendered_at: String(slow()) });
    assert(r.status === 303, `status ${r.status}`);
    const loc = new URL(r.headers.get("location"));
    assert(loc.pathname === "/subscribe" && loc.searchParams.get("subscribed") === "1", `location ${loc}`);
    assert(contactCalls().length === 1, "contact not stored");
    const html = await (await fetch(`${site.base}/subscribe?subscribed=1`)).text();
    assert(html.includes("You&#x27;re on the list.") || html.includes("You're on the list."), "notice not rendered");
  });

  await scenario("native form invalid email → 303 to ?error=invalid, page renders the notice", "redirect + render (app only)", async () => {
    resetMock();
    const r = await form(site.base, { email: "nope", rendered_at: String(slow()) });
    assert(r.status === 303 && new URL(r.headers.get("location")).searchParams.get("error") === "invalid", `status ${r.status}`);
    assert(calls.length === 0, "provider called");
    const html = await (await fetch(`${site.base}/subscribe?error=invalid`)).text();
    assert(html.includes("doesn&#x27;t look right") || html.includes("doesn't look right"), "notice not rendered");
  });

  await scenario("duplicate signup (409) → 200, no second welcome", "provider accepted (stand-in)", async () => {
    resetMock();
    await post(site.base, { email: "dupe@example.com", rendered_at: slow(), source_path: "/a" });
    const second = await post(site.base, { email: "dupe@example.com", rendered_at: slow(), source_path: "/b" });
    assert(second.status === 200, `status ${second.status}`);
    assert(emailCalls().length === 1, `welcome sends: ${emailCalls().length} (want 1)`);
  });

  await scenario("two concurrent signups for one new address → exactly one welcome", "provider accepted (stand-in)", async () => {
    resetMock();
    const rs = await Promise.all([1, 2, 3].map(() => post(site.base, { email: "race@example.com", rendered_at: slow() })));
    assert(rs.every((r) => r.status === 200), "a concurrent signup failed");
    assert(emailCalls().length === 1, `welcome sends: ${emailCalls().length} (want 1)`);
  });

  await scenario("honeypot filled / submitted too fast → silent 200, provider never called", "bot guard (app only)", async () => {
    resetMock();
    const a = await post(site.base, { email: "bot@example.com", company: "Acme", rendered_at: slow() });
    const b = await post(site.base, { email: "fast@example.com", rendered_at: Date.now() });
    assert(a.status === 200 && b.status === 200, `statuses ${a.status}/${b.status}`);
    assert(calls.length === 0, `provider called ${calls.length}×`);
  });

  await scenario("visitor clock ahead of server is NOT treated as a bot", "bot guard (app only)", async () => {
    resetMock();
    const r = await post(site.base, { email: "skew@example.com", rendered_at: Date.now() + 10 * 60_000 });
    assert(r.status === 200 && contactCalls().length === 1, "legitimate skewed-clock signup was dropped");
  });

  await scenario("provider 500 → 502 with a generic message, provider detail not leaked, no welcome", "failure handling (stand-in)", async () => {
    resetMock();
    mode.contact = "500";
    const r = await post(site.base, { email: "down@example.com", rendered_at: slow() });
    const text = await r.text();
    assert(r.status === 502, `status ${r.status}`);
    assert(!text.includes("secret-detail"), "provider error text reached the visitor");
    assert(JSON.parse(text).error === "Could not subscribe right now", `error ${text}`);
    assert(emailCalls().length === 0, "welcome sent although contact failed");
  });

  await scenario("provider connection dropped → 502 JSON (not an opaque 500)", "failure handling (stand-in)", async () => {
    resetMock();
    mode.contact = "destroy";
    const r = await post(site.base, { email: "drop@example.com", rendered_at: slow() });
    assert(r.status === 502, `status ${r.status}`);
    assert((await r.json()).error === "Could not subscribe right now", "body was not the friendly JSON error");
  });

  await scenario("provider hangs → request is cut off by the timeout, 502 JSON", "failure handling (stand-in)", async () => {
    resetMock();
    mode.contact = "hang";
    const t0 = Date.now();
    const r = await post(site.base, { email: "hang@example.com", rendered_at: slow() });
    const took = Date.now() - t0;
    assert(r.status === 502, `status ${r.status}`);
    assert(took < 12_000, `took ${took}ms`);
  });

  await scenario("existing contact + provider hangs on the attribution backfill → still answered, bounded", "failure handling (stand-in)", async () => {
    resetMock();
    await post(site.base, { email: "backfill@example.com", rendered_at: slow() });
    mode.backfill = "hang";
    const t0 = Date.now();
    const r = await post(site.base, { email: "backfill@example.com", rendered_at: slow(), source_path: "/writing/x" });
    const took = Date.now() - t0;
    assert(r.status === 200, `status ${r.status}`);
    assert(took < 9_000, `took ${took}ms`);
    assert(emailCalls().length === 1, `welcome sends: ${emailCalls().length} (want 1)`);
  });

  await scenario("welcome send fails → signup still succeeds; logs contain no raw address", "failure handling (stand-in)", async () => {
    resetMock();
    mode.emails = "500";
    site.logs.length = 0;
    const r = await post(site.base, { email: "welcomefail@example.com", rendered_at: slow() });
    assert(r.status === 200, `status ${r.status}`);
    assert(contactCalls().length === 1, "contact not stored");
    await new Promise((res) => setTimeout(res, 300));
    assert(site.logs.join("").includes("welcome email 500"), "welcome failure was not logged");
    assert(!site.logs.join("").includes("welcomefail@example.com"), "raw address written to logs");
  });

  await scenario("missing Resend config → 503 (JSON) / 303 ?error=unavailable (native form)", "failure handling (app only)", async () => {
    const a = await post(noConfig.base, { email: "cfg@example.com", rendered_at: slow() });
    assert(a.status === 503, `json status ${a.status}`);
    const b = await form(noConfig.base, { email: "cfg@example.com", rendered_at: String(slow()) });
    assert(b.status === 303 && new URL(b.headers.get("location")).searchParams.get("error") === "unavailable", `form status ${b.status}`);
  });

  await scenario("/subscribe has one h1 and a native-post form", "render (app only)", async () => {
    const html = await (await fetch(`${site.base}/subscribe`)).text();
    assert((html.match(/<h1[\s>]/g) ?? []).length === 1, "h1 count != 1");
    assert(/<form[^>]+action="\/api\/subscribe"[^>]+method="post"/.test(html) || /<form[^>]+method="post"[^>]+action="\/api\/subscribe"/.test(html), "form is not a native POST to /api/subscribe");
  });

  await scenario("every article ends with exactly one newsletter signup (inline form XOR embedded CTA)", "render (app only)", async () => {
    const sitemap = await (await fetch(`${site.base}/sitemap.xml`)).text();
    const urls = [...sitemap.matchAll(/<loc>(https:\/\/abdur\.ai\/writing\/[^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    assert(urls.length >= 10, `only ${urls.length} article URLs in sitemap`);
    const bad = [];
    for (const p of urls) {
      const html = await (await fetch(`${site.base}${p}`)).text();
      const inline = (html.match(/data-signup="post-end"/g) ?? []).length; // PostSubscribe
      const embedded = (html.match(/GET THE NEXT POSTMORTEM/g) ?? []).length; // <NewsletterCTA />
      if (inline + embedded !== 1) bad.push(`${p} (inline=${inline}, embedded=${embedded})`);
    }
    assert(bad.length === 0, bad.join("; "));
  });

  await scenario("every table in every article scrolls inside its own wrapper (no sideways page overflow)", "render (app only)", async () => {
    const sitemap = await (await fetch(`${site.base}/sitemap.xml`)).text();
    const urls = [...sitemap.matchAll(/<loc>(https:\/\/abdur\.ai\/writing\/[^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    const bad = [];
    for (const p of urls) {
      const html = await (await fetch(`${site.base}${p}`)).text();
      const tables = (html.match(/<table[\s>]/g) ?? []).length;
      const wrapped = (html.match(/<div class="overflow-x-auto"[^>]*><table[\s>]/g) ?? []).length;
      if (tables !== wrapped) bad.push(`${p} (tables=${tables}, wrapped=${wrapped})`);
    }
    assert(bad.length === 0, bad.join("; "));
  });

  await scenario("RESEND_API_BASE_URL override honoured only for loopback or api.resend.com", "config guard (app only)", async () => {
    const { resolveResendBase, RESEND_API_ORIGIN } = await import("../lib/resend-base.ts");
    const cases = [
      [undefined, RESEND_API_ORIGIN],
      ["", RESEND_API_ORIGIN],
      ["not a url", RESEND_API_ORIGIN],
      [`http://127.0.0.1:${mockPort}`, `http://127.0.0.1:${mockPort}`],
      ["http://localhost:4010/x", "http://localhost:4010"],
      ["http://[::1]:4010", "http://[::1]:4010"],
      ["https://api.resend.com/", RESEND_API_ORIGIN],
      ["https://evil.example", RESEND_API_ORIGIN],
      ["https://api.resend.com.evil.example", RESEND_API_ORIGIN],
      ["https://api.resnd.com", RESEND_API_ORIGIN],
      ["http://api.resend.com", RESEND_API_ORIGIN],
      ["http://10.0.0.5:8080", RESEND_API_ORIGIN],
      ["ftp://127.0.0.1", RESEND_API_ORIGIN],
    ];
    for (const [input, want] of cases) {
      const got = resolveResendBase(input);
      assert(got === want, `resolveResendBase(${JSON.stringify(input)}) = ${got}, want ${want}`);
    }
  });

  await scenario("sitemap: static pages carry no fabricated lastmod; Person JSON-LD has no dead image", "render (app only)", async () => {
    const xml = await (await fetch(`${site.base}/sitemap.xml`)).text();
    const entries = xml.split("<url>").slice(1);
    const about = entries.find((e) => e.includes("<loc>https://abdur.ai/about</loc>"));
    assert(about, "/about missing from sitemap");
    assert(!about.includes("<lastmod>"), "/about still has a lastmod");
    const post = entries.find((e) => e.includes("/writing/what-is-an-agent-memory-layer"));
    assert(post?.includes("<lastmod>"), "a post lost its lastmod");
    // The two index pages must report the latest post change, not build time
    // (`new Date()` on every deploy) and not just posts[0]'s date.
    const lastmod = (e) => {
      const m = e?.match(/<lastmod>([^<]+)<\/lastmod>/);
      return m ? new Date(m[1]).getTime() : NaN;
    };
    const postTimes = entries.filter((e) => /<loc>https:\/\/abdur\.ai\/writing\/[^<]+<\/loc>/.test(e)).map(lastmod);
    assert(postTimes.length >= 10 && postTimes.every((t) => !Number.isNaN(t)), "post lastmods missing or unparseable");
    const latestPost = Math.max(...postTimes);
    for (const loc of ["https://abdur.ai/", "https://abdur.ai/writing"]) {
      const t = lastmod(entries.find((e) => e.includes(`<loc>${loc}</loc>`)));
      assert(t === latestPost, `${loc} lastmod ${Number.isNaN(t) ? "missing" : new Date(t).toISOString()} != latest post change ${new Date(latestPost).toISOString()}`);
    }
    const home = await (await fetch(`${site.base}/`)).text();
    assert(!home.includes("abdur.jpg"), "Person image still points at /abdur.jpg");
  });
} finally {
  for (const { child } of [site, noConfig]) {
    try { process.kill(-child.pid, "SIGTERM"); } catch { /* already gone */ }
  }
  mock.close();
}

// ---------- Report -----------------------------------------------------------
const w = Math.max(...results.map((r) => r.name.length));
console.log("\nSignup journey — boundary results (stand-in provider; real Resend NOT contacted)\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(w)}  [${r.observed}]  ${r.ms}ms${r.ok ? "" : `\n      ↳ ${r.err}`}`);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed.`);
console.log("NOT OBSERVED by this harness: Resend's real acceptance of the payload, email delivery, inbox receipt, hosted unsubscribe.");
process.exit(failed ? 1 : 0);
