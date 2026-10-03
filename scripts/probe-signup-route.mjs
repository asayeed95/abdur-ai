#!/usr/bin/env node
/**
 * Probe a built copy of the signup route against a local Resend stand-in and
 * print what came back for five requests. Used by scripts/repro-prefix-signup.sh
 * to show the pre-audit behaviour; pass any built site directory as argv[2].
 */
import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const dir = process.argv[2];
const label = process.argv[3] ?? "";
if (!dir) { console.error("usage: probe-signup-route.mjs <built-site-dir> [label]"); process.exit(2); }
const require = createRequire(`${dir}/package.json`);

const free = () => new Promise((r) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const seen = [];
let mode = "ok";
const mock = http.createServer((q, res) => {
  let raw = "";
  q.on("data", (c) => (raw += c));
  q.on("end", () => {
    let b = {}; try { b = JSON.parse(raw); } catch { /* not JSON */ }
    seen.push({ u: q.url, b });
    const j = (s, o) => { res.writeHead(s, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
    if (/\/contacts$/.test(q.url) && q.method === "POST") return mode === "destroy" ? q.socket.destroy() : j(201, { id: "c" });
    j(200, { id: "x" });
  });
});
await new Promise((r) => mock.listen(0, "127.0.0.1", r));
const port = await free();
const env = { ...process.env, NODE_ENV: "production", RESEND_API_KEY: "re_test_not_a_real_key", RESEND_AUDIENCE_TLDR: "aud", RESEND_API_BASE_URL: `http://127.0.0.1:${mock.address().port}`, NEXT_TELEMETRY_DISABLED: "1" };
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "-p", String(port)], { env, cwd: dir, stdio: "ignore", detached: true });
const base = `http://127.0.0.1:${port}`;
for (let i = 0; i < 80; i++) { try { if ((await fetch(`${base}/subscribe`)).status === 200) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 250)); }

const post = (b) => fetch(`${base}/api/subscribe`, { method: "POST", redirect: "manual", headers: { "content-type": "application/json" }, body: JSON.stringify(b) });
const slow = Date.now() - 6000;
console.log(`ROUTE UNDER PROBE ${label} (patched only to reach the stand-in)\n`);
let r = await post({ email: "a@b", rendered_at: slow });
console.log("1. email 'a@b'            ->", r.status, (await r.text()).slice(0, 200).replace(/\s+/g, " "));
r = await post({ email: "x".repeat(300) + "@example.com", rendered_at: slow });
console.log("2. 312-char address       ->", r.status, "| provider contact calls:", seen.filter((s) => /contacts$/.test(s.u)).length);
seen.length = 0; mode = "destroy";
r = await post({ email: "drop@example.com", rendered_at: slow });
console.log("3. connection dropped     ->", r.status, JSON.stringify((await r.text()).slice(0, 80)), "content-type:", r.headers.get("content-type"));
mode = "ok"; seen.length = 0;
r = await fetch(`${base}/api/subscribe`, { method: "POST", redirect: "manual", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ email: "native@example.com", rendered_at: String(slow) }).toString() });
console.log("4. native form post       ->", r.status, "content-type:", r.headers.get("content-type"), "body:", JSON.stringify((await r.text()).slice(0, 40)), "location:", r.headers.get("location"));
const mail = seen.find((s) => s.u === "/emails");
console.log("5. welcome body fields    ->", mail ? Object.keys(mail.b).join(", ") : "(no welcome sent)");
try { process.kill(-child.pid, "SIGTERM"); } catch { /* gone */ }
mock.close();
