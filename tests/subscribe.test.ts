/**
 * Integration tests for POST /api/subscribe — AGE-1402 Slice B (201≠409
 * backfill + welcome gate) and acceptance A3 (honeypot → zero candidates).
 *
 * All Resend traffic is stubbed. No live call, no contact created, no mail
 * sent. The route module is re-imported per test because it caches its
 * contact-property declarations at module scope.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const AUD_TLDR = "aud_tldr_test";

type Call = { url: string; method: string; body: unknown };

/**
 * Stub the four Resend endpoints the route touches and record every call.
 *
 * `existing` decides what the pre-create GET reports: `null` = 404 (brand
 * new), otherwise the contact's current properties bag. `createStatus`
 * models Resend's real behaviour, where a DUPLICATE create returns 201 —
 * the defect Slice B fixes.
 */
function stubResend({
  existing = null,
  createStatus = 201,
  getStatus,
}: {
  existing?: Record<string, unknown> | null;
  createStatus?: number;
  getStatus?: number;
} = {}) {
  const calls: Call[] = [];
  const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
    const href = String(url);
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url: href, method, body });

    if (href === "https://api.resend.com/contact-properties") {
      return new Response("", { status: 201 });
    }
    if (href.startsWith("https://api.resend.com/contacts/") && method === "GET") {
      if (getStatus && getStatus !== 200) return new Response("err", { status: getStatus });
      if (!existing) return new Response("not found", { status: 404 });
      return new Response(JSON.stringify({ id: "c_1", properties: existing }), { status: 200 });
    }
    if (href.startsWith("https://api.resend.com/contacts/") && method === "PATCH") {
      return new Response("", { status: 200 });
    }
    if (href.includes("/audiences/") && href.endsWith("/contacts")) {
      return new Response(JSON.stringify({ id: "c_1" }), { status: createStatus });
    }
    if (href === "https://api.resend.com/emails") {
      return new Response(JSON.stringify({ id: "em_1" }), { status: 200 });
    }
    throw new Error(`unexpected fetch to ${href}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return {
    calls,
    creates: () => calls.filter((c) => c.url.includes("/audiences/")),
    patches: () => calls.filter((c) => c.method === "PATCH"),
    welcomes: () => calls.filter((c) => c.url === "https://api.resend.com/emails"),
  };
}

async function subscribe(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/subscribe/route");
  return POST(
    new Request("https://abdur.ai/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const NEW_SUBSCRIBER = {
  email: "reader@example.org",
  list: "tldr",
  source_path: "/writing/x",
  utm_source: "hn",
  // Old enough to clear the min-fill guard.
  rendered_at: 0,
};

beforeEach(() => {
  vi.resetModules();
  process.env.RESEND_API_KEY = "test-api-key";
  process.env.RESEND_AUDIENCE_TLDR = AUD_TLDR;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_AUDIENCE_TLDR;
});

describe("A3 — bot guards create nothing", () => {
  it("a filled honeypot writes nothing to Resend, so no candidate can exist", async () => {
    const stub = stubResend();
    const res = await subscribe({ ...NEW_SUBSCRIBER, company: "Acme Corp" });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(stub.calls).toHaveLength(0);
  });

  it("a sub-min-fill submit writes nothing to Resend", async () => {
    const stub = stubResend();
    const res = await subscribe({ ...NEW_SUBSCRIBER, rendered_at: Date.now() });
    expect(res.status).toBe(200);
    expect(stub.calls).toHaveLength(0);
  });
});

describe("B1 — backfill runs on a duplicate create (201, not just 409)", () => {
  it("fills previously-empty keys for a returning subscriber", async () => {
    const stub = stubResend({ existing: { source_path: "/writing/x" }, createStatus: 201 });
    const res = await subscribe({ ...NEW_SUBSCRIBER, utm_campaign: "launch" });
    expect(res.status).toBe(200);
    expect(stub.patches()).toHaveLength(1);
    expect(stub.patches()[0].body).toMatchObject({
      audience_id: AUD_TLDR,
      properties: { utm_source: "hn", utm_campaign: "launch" },
    });
  });

  it("never overwrites a filled first-touch value", async () => {
    const stub = stubResend({
      existing: { source_path: "/original", utm_source: "original-source" },
      createStatus: 201,
    });
    await subscribe({ ...NEW_SUBSCRIBER, source_path: "/second-visit", utm_source: "second-source" });
    // Everything already filled → nothing left to patch.
    expect(stub.patches()).toHaveLength(0);
  });

  it("still backfills on the classic 409", async () => {
    const stub = stubResend({ existing: {}, createStatus: 409 });
    const res = await subscribe(NEW_SUBSCRIBER);
    expect(res.status).toBe(200);
    expect(stub.patches()).toHaveLength(1);
  });
});

describe("B2 — welcome only for truly-new contacts", () => {
  it("sends exactly one welcome to a brand-new subscriber", async () => {
    const stub = stubResend({ existing: null, createStatus: 201 });
    await subscribe(NEW_SUBSCRIBER);
    expect(stub.welcomes()).toHaveLength(1);
    expect(stub.welcomes()[0].body).toMatchObject({ to: ["reader@example.org"] });
  });

  it("does NOT re-send when a duplicate create returns 201", async () => {
    const stub = stubResend({ existing: { source_path: "/writing/x" }, createStatus: 201 });
    await subscribe(NEW_SUBSCRIBER);
    expect(stub.welcomes()).toHaveLength(0);
  });

  it("does not welcome the asec-waitlist", async () => {
    process.env.RESEND_AUDIENCE_ASEC = "aud_asec_test";
    const stub = stubResend({ existing: null, createStatus: 201 });
    await subscribe({ ...NEW_SUBSCRIBER, list: "asec-waitlist" });
    expect(stub.welcomes()).toHaveLength(0);
    delete process.env.RESEND_AUDIENCE_ASEC;
  });

  it("suppresses the welcome when existence could not be determined", async () => {
    const stub = stubResend({ existing: null, createStatus: 201, getStatus: 500 });
    const res = await subscribe(NEW_SUBSCRIBER);
    expect(res.status).toBe(200); // subscribing still succeeds
    expect(stub.welcomes()).toHaveLength(0);
  });
});

describe("subscribe still fails loudly on a real Resend error", () => {
  it("502s when the create fails for a non-duplicate reason", async () => {
    stubResend({ existing: null, createStatus: 422 });
    const res = await subscribe(NEW_SUBSCRIBER);
    expect(res.status).toBe(502);
  });
});
