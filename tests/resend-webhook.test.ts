/**
 * Integration tests for POST /api/resend/webhook (AGE-1402 Slice A).
 *
 * Every outbound call is stubbed — this suite makes NO live Resend or
 * Supabase request, creates no contact, and writes no ledger row.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signPayload } from "@/lib/svix";
import { POST } from "@/app/api/resend/webhook/route";

const SECRET = "whsec_" + Buffer.from("age-1402-test-signing-key").toString("base64");
const AUD_TLDR = "aud_tldr_test";
const CONTACT_ID = "e169aa45-1ecf-4183-9955-b1499d5701d3";

/** Fixture: a Resend contact.created event for the TLDR audience. */
function contactEvent(overrides: Record<string, unknown> = {}) {
  const { data: dataOverrides, ...topLevel } = overrides;
  return {
    type: "contact.created",
    created_at: "2026-09-06T12:00:00.000Z",
    ...topLevel,
    data: {
      id: CONTACT_ID,
      audience_id: AUD_TLDR,
      segment_ids: [],
      created_at: "2026-09-06T12:00:00.000Z",
      updated_at: "2026-09-06T12:00:00.000Z",
      email: "reader@example.org",
      first_name: null,
      last_name: null,
      unsubscribed: false,
      ...(dataOverrides as object | undefined),
    },
  };
}

function signedRequest(payload: unknown, { secret = SECRET, tamper = false } = {}) {
  const body = JSON.stringify(payload);
  const id = "msg_test";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = `v1,${signPayload({ secret, id, timestamp, body: tamper ? body + " " : body })}`;
  return new Request("https://abdur.ai/api/resend/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "svix-id": id,
      "svix-timestamp": timestamp,
      "svix-signature": signature,
    },
    body,
  });
}

/**
 * Stub Resend contact GET + Supabase insert, and record every insert so a
 * test can assert on the exact candidate rows produced.
 */
function stubBackends({
  properties = {},
  contactGetStatus = 200,
  insertStatus = 201,
}: { properties?: Record<string, unknown>; contactGetStatus?: number; insertStatus?: number } = {}) {
  const inserted: Record<string, unknown>[] = [];
  const seenIds = new Set<string>();
  const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
    const href = String(url);
    if (href.startsWith("https://api.resend.com/contacts/")) {
      if (contactGetStatus !== 200) return new Response("err", { status: contactGetStatus });
      return new Response(JSON.stringify({ id: CONTACT_ID, properties }), { status: 200 });
    }
    if (href.includes("/rest/v1/subscriber_candidates")) {
      const row = JSON.parse(String(init?.body ?? "{}"));
      // Emulate the unique index on event_id.
      if (seenIds.has(row.event_id)) {
        return new Response(JSON.stringify({ code: "23505" }), { status: 409 });
      }
      if (insertStatus !== 201) return new Response("db down", { status: insertStatus });
      seenIds.add(row.event_id);
      inserted.push(row);
      return new Response("", { status: 201 });
    }
    throw new Error(`unexpected fetch to ${href}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { inserted, fetchMock };
}

beforeEach(() => {
  process.env.RESEND_WEBHOOK_SECRET = SECRET;
  process.env.RESEND_API_KEY = "test-api-key";
  process.env.RESEND_AUDIENCE_TLDR = AUD_TLDR;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const key of [
    "RESEND_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "RESEND_AUDIENCE_TLDR",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]) {
    delete process.env[key];
  }
});

describe("POST /api/resend/webhook", () => {
  it("records a candidate for a signed contact.created on a known audience", async () => {
    const { inserted } = stubBackends({ properties: { source_path: "/writing/x", utm_source: "hn" } });
    const res = await POST(signedRequest(contactEvent()));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, result: "inserted" });
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({
      email: "reader@example.org",
      audience: "tldr",
      resend_contact_id: CONTACT_ID,
      channel: "abdur.ai_subscribe",
      event: "subscribe:tldr",
    });
    expect(inserted[0].properties).toMatchObject({ source_path: "/writing/x", utm_source: "hn", utm_term: null });
  });

  it("A2: a re-delivered event produces exactly one candidate", async () => {
    const { inserted } = stubBackends();
    const first = await POST(signedRequest(contactEvent()));
    const second = await POST(signedRequest(contactEvent()));
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toMatchObject({ result: "deduped" });
    expect(inserted).toHaveLength(1);
  });

  it("A1: a later contact.updated appends rather than overwriting", async () => {
    const { inserted } = stubBackends({ properties: { source_path: "/writing/x" } });
    await POST(signedRequest(contactEvent()));
    await POST(
      signedRequest(
        contactEvent({ type: "contact.updated", data: { updated_at: "2026-09-07T09:00:00.000Z" } }),
      ),
    );
    expect(inserted).toHaveLength(2);
    expect(inserted[0].event_id).not.toBe(inserted[1].event_id);
    // The first observation is still intact — nothing rewrote it.
    expect(inserted[0]).toMatchObject({ event_id: `rs_${CONTACT_ID}_20260906120000000` });
  });

  it("rejects an unsigned request", async () => {
    const { inserted } = stubBackends();
    const res = await POST(
      new Request("https://abdur.ai/api/resend/webhook", {
        method: "POST",
        body: JSON.stringify(contactEvent()),
      }),
    );
    expect(res.status).toBe(401);
    expect(inserted).toHaveLength(0);
  });

  it("rejects a tampered payload", async () => {
    const { inserted } = stubBackends();
    const res = await POST(signedRequest(contactEvent(), { tamper: true }));
    expect(res.status).toBe(401);
    expect(inserted).toHaveLength(0);
  });

  it("ignores an audience this site does not own", async () => {
    const { inserted } = stubBackends();
    const res = await POST(signedRequest(contactEvent({ data: { audience_id: "aud_not_ours" } })));
    expect(res.status).toBe(202);
    await expect(res.json()).resolves.toMatchObject({ ignored: "unknown_audience" });
    expect(inserted).toHaveLength(0);
  });

  it("ignores an unsubscribed contact — that is not inbound interest", async () => {
    const { inserted } = stubBackends();
    const res = await POST(signedRequest(contactEvent({ data: { unsubscribed: true } })));
    expect(res.status).toBe(202);
    expect(inserted).toHaveLength(0);
  });

  it("ignores event types it does not handle (no outbound, no email events)", async () => {
    const { inserted } = stubBackends();
    for (const type of ["email.sent", "email.delivered", "domain.created", "contact.deleted"]) {
      const res = await POST(signedRequest(contactEvent({ type })));
      expect(res.status).toBe(202);
    }
    expect(inserted).toHaveLength(0);
  });

  it("does NOT record an all-null candidate when the property read failed", async () => {
    const { inserted } = stubBackends({ contactGetStatus: 500 });
    const res = await POST(signedRequest(contactEvent()));
    expect(res.status).toBe(500); // Svix retries; the deterministic key keeps it idempotent.
    expect(inserted).toHaveLength(0);
  });

  it("records genuinely-empty attribution as nulls", async () => {
    const { inserted } = stubBackends({ properties: {} });
    await POST(signedRequest(contactEvent()));
    expect(Object.values(inserted[0].properties as Record<string, unknown>).every((v) => v === null)).toBe(true);
  });

  it("asks for a retry when the store is down", async () => {
    stubBackends({ insertStatus: 500 });
    const res = await POST(signedRequest(contactEvent()));
    expect(res.status).toBe(500);
  });

  it("503s rather than silently dropping events when unconfigured", async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;
    stubBackends();
    const res = await POST(signedRequest(contactEvent()));
    expect(res.status).toBe(503);
  });
});
