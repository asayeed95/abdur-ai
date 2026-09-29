// Regression tests for AGE-2591: /api/ingest/* must fail closed.
//
// Before the fix, both routes compared the Authorization header against
// `Bearer ${process.env.AGENT_TOKEN}`, so with AGENT_TOKEN unset the expected
// value was the literal string "Bearer undefined" and anyone sending it could
// write to the public homepage panels.
//
// Every route under app/api/ingest/ is discovered at runtime, so a new ingest
// route that skips the shared guard fails this suite without anyone
// remembering to add it here.
//
// Run: npm test
import { after, afterEach, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const INGEST_DIR = path.join(ROOT, "app/api/ingest");

// A body each known route accepts, so a request that slips past auth would go
// on to attempt a real write (which the fetch spy below records).
const VALID_BODY = {
  now: { agents: [{ agent: "test-agent", task: "regression test", state: "running" }] },
  ship: { date: "SEP 29", text: "regression test", tag: "test" },
};

const GOOD_TOKEN = "fake-agent-token-for-tests";

const routes = readdirSync(INGEST_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(path.join(INGEST_DIR, d.name, "route.ts")))
  .map((d) => d.name)
  .sort();

const ENV_KEYS = ["AGENT_TOKEN", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
const realFetch = globalThis.fetch;
const realConsoleError = console.error;
let fetchCalls = [];

function setToken(value) {
  if (value === undefined) delete process.env.AGENT_TOKEN;
  else process.env.AGENT_TOKEN = value;
}

async function call(POST, name, { authorization, body }) {
  const headers = { "content-type": "application/json" };
  if (authorization !== undefined) headers.authorization = authorization;
  const req = new Request(`http://localhost/api/ingest/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body ?? VALID_BODY[name] ?? {}),
  });
  try {
    const res = await POST(req);
    let json = null;
    try {
      json = await res.json();
    } catch {
      // non-JSON body; status is what matters
    }
    return { status: res.status, json };
  } catch (err) {
    // Reaching revalidateTag() outside a Next request context throws — which
    // only happens if the request got all the way through auth and the write.
    return { status: "threw", json: null, error: err };
  }
}

before(() => {
  // Point the Supabase helpers at a fake project and spy on every outbound
  // call, so "refused" also proves "nothing was written".
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test.invalid";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  globalThis.fetch = async (input, init) => {
    fetchCalls.push({ url: String(input), method: init?.method });
    return new Response(null, { status: 201 });
  };
  // The fail-closed branch logs a server-side error on purpose; keep test
  // output readable.
  console.error = () => {};
});

afterEach(() => {
  fetchCalls = [];
});

after(() => {
  globalThis.fetch = realFetch;
  console.error = realConsoleError;
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

test("discovers the ingest routes", () => {
  assert.ok(routes.includes("now"), `routes found: ${routes.join(", ")}`);
  assert.ok(routes.includes("ship"), `routes found: ${routes.join(", ")}`);
});

for (const name of routes) {
  describe(`POST /api/ingest/${name}`, () => {
    let POST;
    before(async () => {
      ({ POST } = await import(pathToFileURL(path.join(INGEST_DIR, name, "route.ts")).href));
      assert.equal(typeof POST, "function");
    });

    // --- AGENT_TOKEN not configured: refuse everything, write nothing ---

    for (const [label, token] of [
      ["unset", undefined],
      ["empty", ""],
      ["whitespace-only", "   "],
    ]) {
      for (const authorization of [
        "Bearer undefined",
        "Bearer ",
        "Bearer",
        `Bearer ${token ?? ""}`,
        `Bearer ${GOOD_TOKEN}`,
        undefined,
      ]) {
        test(`AGENT_TOKEN ${label} + Authorization ${JSON.stringify(authorization ?? null)} → 500, no write`, async () => {
          setToken(token);
          const res = await call(POST, name, { authorization });
          assert.equal(fetchCalls.length, 0, `FAIL-OPEN: write attempted: ${JSON.stringify(fetchCalls)}`);
          assert.equal(res.status, 500, `expected 500, got ${res.status} ${JSON.stringify(res.json)}`);
          assert.deepEqual(res.json, { error: "ingest_unavailable" });
        });
      }
    }

    test("misconfigured response does not reveal the env var name", async () => {
      setToken(undefined);
      const res = await call(POST, name, { authorization: "Bearer undefined" });
      assert.ok(!JSON.stringify(res.json ?? {}).includes("AGENT_TOKEN"));
    });

    // --- AGENT_TOKEN configured: wrong / malformed credentials get 401 ---

    for (const authorization of [
      undefined,
      "",
      "Bearer undefined",
      "Bearer ",
      "Bearer wrong-token",
      `Bearer ${GOOD_TOKEN}x`,
      `Bearer ${GOOD_TOKEN.slice(0, -1)}`,
      `bearer ${GOOD_TOKEN}`,
      `Basic ${GOOD_TOKEN}`,
      GOOD_TOKEN,
      `Bearer  ${GOOD_TOKEN}`,
    ]) {
      test(`AGENT_TOKEN set + Authorization ${JSON.stringify(authorization ?? null)} → 401, no write`, async () => {
        setToken(GOOD_TOKEN);
        const res = await call(POST, name, { authorization });
        assert.equal(fetchCalls.length, 0, `FAIL-OPEN: write attempted: ${JSON.stringify(fetchCalls)}`);
        assert.equal(res.status, 401, `expected 401, got ${res.status} ${JSON.stringify(res.json)}`);
        assert.deepEqual(res.json, { error: "unauthorized" });
      });
    }

    // --- Correct token: allowed through to validation ---

    test("AGENT_TOKEN set + correct Bearer token → passes auth (reaches body validation)", async () => {
      setToken(GOOD_TOKEN);
      // An invalid body proves the request cleared auth (400 comes from zod,
      // after the guard) without needing a live Supabase or Next's cache.
      const res = await call(POST, name, { authorization: `Bearer ${GOOD_TOKEN}`, body: { invalid: true } });
      assert.equal(res.status, 400, `expected 400 from validation, got ${res.status} ${JSON.stringify(res.json)}`);
      assert.equal(fetchCalls.length, 0);
    });

    if (VALID_BODY[name]) {
      test("AGENT_TOKEN set + correct Bearer token + valid body → write attempted", async () => {
        setToken(GOOD_TOKEN);
        await call(POST, name, { authorization: `Bearer ${GOOD_TOKEN}` });
        assert.equal(fetchCalls.length, 1, `expected one Supabase write, got ${JSON.stringify(fetchCalls)}`);
        assert.equal(fetchCalls[0].method, "POST");
      });
    }
  });
}
