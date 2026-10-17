#!/usr/bin/env node
/**
 * Free-library fulfillment boundary tests (AGE-3762).
 *
 * Starts the REAL built site (`next start`) against a local stand-in for the
 * Resend API and drives /api/library and the /library pages the way a browser
 * does. Every scenario asserts what crossed the provider boundary (the
 * stand-in records each request and keeps contact state), not only the HTTP
 * status the reader saw.
 *
 * Three servers from one build:
 *  - site:     LIBRARY_PREVIEW=1, so the draft workbook is requestable.
 *  - prodlike: LIBRARY_PREVIEW=1 but VERCEL_ENV=production, so the flag must
 *              be ignored and the draft must not exist anywhere.
 *  - nokey:    LIBRARY_PREVIEW=1, no Resend config.
 *
 * WHAT THIS PROVES: this app's behaviour at each boundary it owns (consent
 * separation, allowlist, idempotency key, list handling, failure handling,
 * native-form path, what the pages render).
 * WHAT IT CANNOT PROVE: anything Resend does: real acceptance, delivery,
 * inbox receipt, hosted unsubscribe. Reported as NOT OBSERVED.
 *
 * Usage: npm run build && npm run test:library
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import http from "node:http";
import net from "node:net";

const require = createRequire(import.meta.url);

const ASSET = "evidence-os-v1";
const READ_URL = `https://abdur.ai/library/${ASSET}/read`;
const DOWNLOAD_URL = `https://abdur.ai/library/${ASSET}/workbook.md`;
/** Body fields documented for POST https://api.resend.com/emails (same list as the signup suite). */
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
const calls = [];
/** email -> { unsubscribed, properties } */
const contacts = new Map();
/** idempotency key -> { hash, id }. Same key + different payload = 409, as Resend documents. */
const idempotency = new Map();
/** Emails the stand-in actually accepted for sending (deduplicated by key). */
const delivered = [];
const mode = { contact: "ok", emails: "ok" };
function resetMock() {
  calls.length = 0;
  contacts.clear();
  idempotency.clear();
  delivered.length = 0;
  mode.contact = "ok";
  mode.emails = "ok";
}

const mock = http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch { /* non-JSON */ }
    calls.push({ method: req.method, path: req.url, headers: req.headers, body });
    const json = (status, obj) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(obj));
    };
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/contact-properties") return json(201, { id: "prop" });
    if (req.method === "POST" && /^\/audiences\/[^/]+\/contacts$/.test(url.pathname)) {
      if (mode.contact === "500") return json(500, { message: "provider exploded: secret-detail" });
      if (contacts.has(body.email)) return json(409, { message: "exists" });
      contacts.set(body.email, { unsubscribed: body.unsubscribed === true, properties: { ...(body.properties ?? {}) } });
      return json(201, { id: `c_${contacts.size}` });
    }
    const contactPath = url.pathname.match(/^\/contacts\/([^/]+)$/);
    if (contactPath && req.method === "GET") {
      const c = contacts.get(decodeURIComponent(contactPath[1]));
      return c ? json(200, c) : json(404, { message: "not found" });
    }
    if (contactPath && req.method === "PATCH") {
      const c = contacts.get(decodeURIComponent(contactPath[1]));
      if (!c) return json(404, { message: "not found" });
      if ("unsubscribed" in body) c.unsubscribed = body.unsubscribed === true;
      Object.assign(c.properties, body.properties ?? {});
      return json(200, { id: "c" });
    }
    if (req.method === "POST" && url.pathname === "/emails") {
      if (mode.emails === "500") return json(500, { message: "send failed: secret-detail" });
      if (mode.emails === "hang") return; // never answer
      const key = req.headers["idempotency-key"];
      const hash = createHash("sha256").update(raw).digest("hex");
      if (key && idempotency.has(key)) {
        const prior = idempotency.get(key);
        if (prior.hash !== hash) return json(409, { name: "invalid_idempotent_request" });
        return json(200, { id: prior.id });
      }
      const id = `em_${delivered.length + 1}`;
      if (key) idempotency.set(key, { hash, id });
      delivered.push({ id, body, key });
      return json(200, { id });
    }
    return json(404, { message: "unknown route" });
  });
});

// ---------- Sites under test -------------------------------------------------
function startSite({ port, mockPort, withConfig = true, production = false }) {
  const env = { ...process.env, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1", LIBRARY_PREVIEW: "1" };
  delete env.RESEND_API_KEY;
  delete env.RESEND_AUDIENCE_TLDR;
  delete env.VERCEL_ENV;
  if (withConfig) {
    env.RESEND_API_KEY = "re_test_not_a_real_key";
    env.RESEND_AUDIENCE_TLDR = "aud_test_tldr";
  }
  if (production) env.VERCEL_ENV = "production";
  env.RESEND_API_BASE_URL = `http://127.0.0.1:${mockPort}`;
  const logs = [];
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
const post = (base, body) =>
  fetch(`${base}/api/library`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
const form = (base, fields) =>
  fetch(`${base}/api/library`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
    signal: AbortSignal.timeout(20_000),
  });
const slow = () => Date.now() - 6000;
const req = (extra = {}) => ({ asset_id: ASSET, rendered_at: slow(), ...extra });
const contactCalls = () => calls.filter((c) => /\/audiences\/.+\/contacts$/.test(c.path) && c.method === "POST");
const patchCalls = () => calls.filter((c) => c.method === "PATCH");
const emailCalls = () => calls.filter((c) => c.path === "/emails");
const providerCalls = () => calls.filter((c) => c.path !== "/contact-properties");
const seedContact = (email, unsubscribed, properties = {}) => contacts.set(email, { unsubscribed, properties: { ...properties } });

await new Promise((r) => mock.listen(0, "127.0.0.1", r));
const mockPort = mock.address().port;
const site = startSite({ port: await freePort(), mockPort });
const prodlike = startSite({ port: await freePort(), mockPort, production: true });
const nokey = startSite({ port: await freePort(), mockPort, withConfig: false });

try {
  await Promise.all([site, prodlike, nokey].map((s) => waitReady(s.base)));

  await scenario("box unticked → asset sent once, no list traffic at all", "provider accepted (stand-in)", async () => {
    resetMock();
    const r = await post(site.base, req({ email: "  Ada@Example.COM " }));
    const j = await r.json();
    assert(r.status === 200 && j.ok === true && j.delivered === true, `status ${r.status} ${JSON.stringify(j)}`);
    assert(j.newsletter === "skipped", `newsletter ${j.newsletter}`);
    assert(delivered.length === 1, `emails delivered: ${delivered.length}`);
    assert(delivered[0].body.to[0] === "ada@example.com", `sent to ${delivered[0].body.to}`);
    assert(contactCalls().length === 0 && patchCalls().length === 0 && contacts.size === 0, "an unticked request touched the list");
  });

  await scenario("delivery email: the registry's links only, documented fields, asset tags, one-off footer", "request shape (stand-in)", async () => {
    resetMock();
    await post(site.base, req({ email: "shape@example.com", url: "https://evil.example/x", delivery_url: "https://evil.example/y", download: "https://evil.example/z" }));
    const sent = delivered[0]?.body;
    assert(sent, "no email");
    const unknown = Object.keys(sent).filter((k) => !DOCUMENTED_SEND_FIELDS.has(k));
    assert(unknown.length === 0, `undocumented fields: ${unknown.join(", ")}`);
    assert(sent.html.includes(READ_URL) && sent.html.includes(DOWNLOAD_URL), "html missing the registry links");
    assert(sent.text.includes(READ_URL) && sent.text.includes(DOWNLOAD_URL), "text part missing the registry links");
    assert(!JSON.stringify(sent).includes("evil.example"), "a client-supplied URL reached the email");
    assert(sent.subject.includes("Evidence Before Shipping"), `subject ${sent.subject}`);
    const tags = Object.fromEntries((sent.tags ?? []).map((t) => [t.name, t.value]));
    assert(tags.kind === "library" && tags.asset === ASSET, `tags ${JSON.stringify(sent.tags)}`);
    assert(/doesn.t add you to any list/.test(sent.text), "footer no longer says the delivery adds no list");
    const key = delivered[0].key ?? "";
    assert(key.startsWith(`asset-${ASSET}/`) && !key.includes("shape") && !key.includes("@"), `idempotency key ${key}`);
  });

  await scenario("box ticked, new address → asset sent, contact created subscribed with attribution + lead_asset", "provider accepted (stand-in)", async () => {
    resetMock();
    const r = await post(site.base, req({ email: "new@example.com", newsletter: true, source_path: "/library/evidence-os-v1", utm_source: "x" }));
    const j = await r.json();
    assert(r.status === 200 && j.newsletter === "added", `status ${r.status} ${JSON.stringify(j)}`);
    assert(delivered.length === 1, `emails: ${delivered.length}`);
    const c = contactCalls()[0]?.body;
    assert(c && c.unsubscribed === false, "contact not created subscribed");
    assert(c.properties.lead_asset === ASSET, `lead_asset ${c.properties.lead_asset}`);
    assert(c.properties.source_path === "/library/evidence-os-v1" && c.properties.utm_source === "x", "attribution missing");
  });

  await scenario("box ticked, existing subscriber → 'existing', blanks filled first-wins, attribution never overwritten", "provider accepted (stand-in)", async () => {
    resetMock();
    seedContact("old@example.com", false, { source_path: "/writing/first-touch" });
    const r = await post(site.base, req({ email: "old@example.com", newsletter: true, source_path: "/library/x" }));
    const j = await r.json();
    assert(j.newsletter === "existing", `newsletter ${j.newsletter}`);
    const c = contacts.get("old@example.com");
    assert(c.properties.source_path === "/writing/first-touch", `first touch overwritten: ${c.properties.source_path}`);
    assert(c.properties.lead_asset === ASSET, "lead_asset not backfilled");
    assert(delivered.length === 1, `emails: ${delivered.length}`);
  });

  await scenario("box ticked, previously unsubscribed → asset still delivered, contact stays unsubscribed", "provider accepted (stand-in)", async () => {
    resetMock();
    seedContact("gone@example.com", true);
    const r = await post(site.base, req({ email: "gone@example.com", newsletter: true }));
    const j = await r.json();
    assert(r.status === 200 && j.delivered === true, `status ${r.status}`);
    assert(delivered.length === 1, "unsubscribed reader did not get what they asked for");
    assert(contacts.get("gone@example.com").unsubscribed === true, "unsubscribed reader was re-subscribed");
    assert(patchCalls().every((p) => !("unsubscribed" in p.body)), "a PATCH carried `unsubscribed`");
  });

  await scenario("box unticked, previously unsubscribed → delivered, list untouched", "provider accepted (stand-in)", async () => {
    resetMock();
    seedContact("gone2@example.com", true);
    const r = await post(site.base, req({ email: "gone2@example.com" }));
    assert(r.status === 200 && delivered.length === 1, `status ${r.status}, emails ${delivered.length}`);
    assert(contactCalls().length === 0 && patchCalls().length === 0, "list touched without consent");
    assert(contacts.get("gone2@example.com").unsubscribed === true, "subscription state changed");
  });

  await scenario("duplicate requests (repeat, ticked-then-unticked, 3 concurrent) → one email", "idempotency (stand-in)", async () => {
    resetMock();
    await post(site.base, req({ email: "dupe@example.com" }));
    const again = await post(site.base, req({ email: "dupe@example.com", newsletter: true }));
    assert(again.status === 200, `repeat status ${again.status}`);
    const rs = await Promise.all([1, 2, 3].map(() => post(site.base, req({ email: "race@example.com" }))));
    assert(rs.every((r) => r.status === 200), "a concurrent request failed");
    const per = (e) => delivered.filter((d) => d.body.to[0] === e).length;
    assert(per("dupe@example.com") === 1, `dupe emails: ${per("dupe@example.com")}`);
    assert(per("race@example.com") === 1, `race emails: ${per("race@example.com")}`);
    const keys = new Set(emailCalls().filter((c) => c.body.to[0] === "dupe@example.com").map((c) => c.headers["idempotency-key"]));
    assert(keys.size === 1, "repeat requests used different idempotency keys");
  });

  await scenario("idempotency 409 (key held with another payload) counts as delivered, not an error", "failure handling (stand-in)", async () => {
    resetMock();
    const key = `asset-${ASSET}/${createHash("sha256").update("held@example.com").digest("hex").slice(0, 32)}`;
    idempotency.set(key, { hash: "something-else", id: "em_prior" });
    const r = await post(site.base, req({ email: "held@example.com" }));
    assert(r.status === 200 && (await r.json()).delivered === true, `status ${r.status}`);
  });

  await scenario("malformed / unknown / planned asset id → rejected, no provider traffic", "allowlist (app only)", async () => {
    for (const [id, want] of [["../etc/passwd", 400], ["EVIDENCE-OS-V1", 400], ["x".repeat(65), 400], ["board-os", 404], ["mistakes-playbook-v1", 404], ["mcp-publishing-kit-v1", 404]]) {
      resetMock();
      const r = await post(site.base, req({ email: "id@example.com", asset_id: id }));
      assert(r.status === want, `${id.slice(0, 20)}: status ${r.status} (want ${want})`);
      assert(providerCalls().length === 0, `${id.slice(0, 20)}: provider called`);
    }
    resetMock();
    const missing = await post(site.base, { email: "id@example.com", rendered_at: slow() });
    assert(missing.status === 400 && providerCalls().length === 0, `missing id: ${missing.status}`);
  });

  await scenario("invalid email / malformed JSON → 400, no provider traffic", "validation (app only)", async () => {
    for (const bad of ["nope", "a@b", "", "x".repeat(300) + "@example.com"]) {
      resetMock();
      const r = await post(site.base, req({ email: bad }));
      const j = await r.json();
      assert(r.status === 400 && j.error === "Enter a valid email address.", `"${bad.slice(0, 10)}": ${r.status} ${j.error}`);
      assert(providerCalls().length === 0, "provider called");
    }
    resetMock();
    const b = await post(site.base, "{not json");
    assert(b.status === 400 && providerCalls().length === 0, `malformed JSON: ${b.status}`);
  });

  await scenario("send fails (500) → 502, generic message, provider detail not leaked, list untouched even if ticked", "failure handling (stand-in)", async () => {
    resetMock();
    mode.emails = "500";
    const r = await post(site.base, req({ email: "down@example.com", newsletter: true }));
    const text = await r.text();
    assert(r.status === 502, `status ${r.status}`);
    assert(!text.includes("secret-detail"), "provider detail reached the reader");
    assert(contactCalls().length === 0, "contact added although the asset was not sent");
  });

  await scenario("send hangs → cut off by the timeout, 502", "failure handling (stand-in)", async () => {
    resetMock();
    mode.emails = "hang";
    const t0 = Date.now();
    const r = await post(site.base, req({ email: "hang@example.com" }));
    assert(r.status === 502, `status ${r.status}`);
    assert(Date.now() - t0 < 12_000, `took ${Date.now() - t0}ms`);
  });

  await scenario("list add fails (500) with box ticked → asset still delivered, newsletter 'failed'", "failure handling (stand-in)", async () => {
    resetMock();
    mode.contact = "500";
    const r = await post(site.base, req({ email: "listdown@example.com", newsletter: true }));
    const j = await r.json();
    assert(r.status === 200 && j.delivered === true && j.newsletter === "failed", `${r.status} ${JSON.stringify(j)}`);
    assert(delivered.length === 1, "asset not delivered");
  });

  await scenario("honeypot filled / submitted too fast → silent 200, provider never called", "bot guard (app only)", async () => {
    resetMock();
    const a = await post(site.base, req({ email: "bot@example.com", company: "Acme" }));
    const b = await post(site.base, req({ email: "fast@example.com", rendered_at: Date.now() }));
    assert(a.status === 200 && b.status === 200, `statuses ${a.status}/${b.status}`);
    assert(providerCalls().length === 0, `provider called ${providerCalls().length}×`);
  });

  await scenario("native form: ticked box ('on') → 303 ?sent=1 + contact; unticked → no contact", "redirect (app only)", async () => {
    resetMock();
    const a = await form(site.base, { email: "nat@example.com", asset_id: ASSET, newsletter: "on", rendered_at: String(slow()) });
    assert(a.status === 303, `status ${a.status}`);
    const loc = new URL(a.headers.get("location"));
    assert(loc.pathname === `/library/${ASSET}` && loc.searchParams.get("sent") === "1", `location ${loc}`);
    assert(contacts.has("nat@example.com") && delivered.length === 1, "ticked native form did not deliver + add");
    resetMock();
    await form(site.base, { email: "nat2@example.com", asset_id: ASSET, rendered_at: String(slow()) });
    assert(delivered.length === 1 && contactCalls().length === 0, "unticked native form touched the list");
  });

  await scenario("native form errors → 303 to the asset page ?error=invalid, unknown id → /library?error=invalid", "redirect + render (app only)", async () => {
    resetMock();
    const a = await form(site.base, { email: "nope", asset_id: ASSET, rendered_at: String(slow()) });
    const la = new URL(a.headers.get("location"));
    assert(a.status === 303 && la.pathname === `/library/${ASSET}` && la.searchParams.get("error") === "invalid", `bad email → ${la}`);
    const b = await form(site.base, { email: "ok@example.com", asset_id: "board-os", rendered_at: String(slow()) });
    const lb = new URL(b.headers.get("location"));
    assert(b.status === 303 && lb.pathname === "/library" && lb.searchParams.get("error") === "invalid", `unknown id → ${lb}`);
    assert(providerCalls().length === 0, "provider called");
    const html = await (await fetch(`${site.base}/library/${ASSET}?error=invalid`)).text();
    assert(html.includes("doesn&#x27;t look right") || html.includes("doesn't look right"), "error notice not rendered");
  });

  await scenario("asset page: one h1, native POST form, logbook box present and UNCHECKED, preview only, draft noindex", "render (app only)", async () => {
    const r = await fetch(`${site.base}/library/${ASSET}`);
    const html = await r.text();
    assert(r.status === 200, `status ${r.status}`);
    assert((html.match(/<h1[\s>]/g) ?? []).length === 1, "h1 count != 1");
    assert(/<form[^>]+action="\/api\/library"[^>]+method="post"/.test(html), "not a native POST to /api/library");
    const box = html.match(/<input[^>]*name="newsletter"[^>]*>/)?.[0];
    assert(box && /type="checkbox"/.test(box), "logbook checkbox missing");
    assert(!/\schecked(=|\s|>|\/)/.test(box), `logbook box is pre-checked: ${box}`);
    assert(html.includes("The loop"), "preview section missing");
    assert(!html.includes("The worksheet"), "content past the preview marker leaked onto the request page");
    assert(/<meta name="robots" content="noindex/.test(html), "draft page is indexable");
    assert(html.includes("Draft preview"), "draft banner missing");
  });

  await scenario("read page has the full workbook; download serves the Markdown as an attachment", "render (app only)", async () => {
    const r = await fetch(`${site.base}/library/${ASSET}/read`);
    const html = await r.text();
    assert(r.status === 200 && html.includes("The worksheet"), `read status ${r.status}`);
    assert(/<meta name="robots" content="noindex/.test(html), "read page is indexable");
    const d = await fetch(`${site.base}/library/${ASSET}/workbook.md`);
    const md = await d.text();
    assert(d.status === 200 && (d.headers.get("content-type") ?? "").startsWith("text/markdown"), `download ${d.status} ${d.headers.get("content-type")}`);
    assert((d.headers.get("content-disposition") ?? "").includes(`${ASSET}.md`), "not served as an attachment");
    assert(md.startsWith("---\n") && md.includes("## The worksheet"), "download is not the Markdown source");
  });

  await scenario("production (VERCEL_ENV=production) ignores LIBRARY_PREVIEW: the draft exists nowhere", "visibility (app only)", async () => {
    resetMock();
    for (const p of ["/library", `/library/${ASSET}`, `/library/${ASSET}/read`, `/library/${ASSET}/workbook.md`]) {
      const r = await fetch(`${prodlike.base}${p}`);
      assert(r.status === 404, `${p}: status ${r.status}`);
    }
    const r = await post(prodlike.base, req({ email: "prod@example.com", newsletter: true }));
    assert(r.status === 404, `POST status ${r.status}`);
    assert(providerCalls().length === 0, "provider called for a draft in production");
    const xml = await (await fetch(`${prodlike.base}/sitemap.xml`)).text();
    assert(!xml.includes("/library"), "a draft library page is in the sitemap");
  });

  await scenario("missing Resend config → 503, no provider traffic", "failure handling (app only)", async () => {
    resetMock();
    const r = await post(nokey.base, req({ email: "cfg@example.com" }));
    assert(r.status === 503, `status ${r.status}`);
    assert(providerCalls().length === 0, "provider called");
  });

  await scenario("logs never contain a raw address", "privacy (app only)", async () => {
    const all = [site, prodlike, nokey].flatMap((s) => s.logs).join("");
    for (const e of ["listdown@example.com", "down@example.com", "hang@example.com", "new@example.com"]) {
      assert(!all.includes(e), `raw address in logs: ${e}`);
    }
  });
} finally {
  for (const { child } of [site, prodlike, nokey]) {
    try { process.kill(-child.pid, "SIGTERM"); } catch { /* already gone */ }
  }
  mock.close();
}

// ---------- Report -----------------------------------------------------------
const w = Math.max(...results.map((r) => r.name.length));
console.log("\nLibrary fulfillment — boundary results (stand-in provider; real Resend NOT contacted)\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(w)}  [${r.observed}]  ${r.ms}ms${r.ok ? "" : `\n      ↳ ${r.err}`}`);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed.`);
console.log("NOT OBSERVED by this harness: Resend's real acceptance of the payload, email delivery, inbox receipt, hosted unsubscribe.");
process.exit(failed ? 1 : 0);
