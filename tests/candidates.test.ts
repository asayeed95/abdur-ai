import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  appendCandidateEvent,
  audienceSlugMap,
  buildCandidateEvent,
  candidateEventId,
  eventNameForSlug,
  fetchContactProperties,
  normalizeProperties,
  CANDIDATE_PROPERTY_KEYS,
} from "@/lib/candidates";

const CONTACT_ID = "e169aa45-1ecf-4183-9955-b1499d5701d3";
const AUD_TLDR = "aud_tldr_test";

describe("normalizeProperties", () => {
  it("returns all eight keys, empty ones as null", () => {
    const props = normalizeProperties({ utm_source: "x", utm_medium: "  ", referrer: 42 });
    expect(Object.keys(props).sort()).toEqual([...CANDIDATE_PROPERTY_KEYS].sort());
    expect(props.utm_source).toBe("x");
    expect(props.utm_medium).toBeNull();
    expect(props.referrer).toBeNull();
    expect(props.source_path).toBeNull();
  });

  it("treats a missing bag as all-null — never invents a value", () => {
    const props = normalizeProperties(undefined);
    expect(Object.values(props).every((v) => v === null)).toBe(true);
  });
});

describe("candidateEventId (A2 idempotency)", () => {
  it("is deterministic for the same contact + event timestamp", () => {
    const a = candidateEventId(CONTACT_ID, "2026-09-06T12:00:00.000Z");
    const b = candidateEventId(CONTACT_ID, "2026-09-06T12:00:00.000Z");
    expect(a).toBe(b);
    expect(a).toBe(`rs_${CONTACT_ID}_20260906120000000`);
  });

  it("differs for a genuinely later contact state", () => {
    expect(candidateEventId(CONTACT_ID, "2026-09-06T12:00:00.000Z")).not.toBe(
      candidateEventId(CONTACT_ID, "2026-09-07T12:00:00.000Z"),
    );
  });
});

describe("audienceSlugMap", () => {
  it("maps only configured audiences", () => {
    const map = audienceSlugMap({ RESEND_AUDIENCE_TLDR: AUD_TLDR, RESEND_AUDIENCE_ASEC: "" });
    expect(map).toEqual({ [AUD_TLDR]: "tldr" });
    expect(map["aud_someone_elses"]).toBeUndefined();
  });
});

describe("eventNameForSlug", () => {
  it("uses the schema vocabulary and degrades to bare subscribe", () => {
    expect(eventNameForSlug("tldr")).toBe("subscribe:tldr");
    expect(eventNameForSlug("asec-waitlist")).toBe("subscribe:asec-waitlist");
    expect(eventNameForSlug("")).toBe("subscribe");
  });
});

describe("buildCandidateEvent", () => {
  it("emits the packet §A.2 shape", () => {
    const event = buildCandidateEvent({
      email: "person@example.org",
      audienceId: AUD_TLDR,
      audienceSlug: "tldr",
      contactId: CONTACT_ID,
      eventTimestamp: "2026-09-06T12:00:00.000Z",
      rawProperties: { source_path: "/writing/foo", utm_source: "x" },
      receivedAt: "2026-09-06T12:00:05.000Z",
    });
    expect(event).toEqual({
      event_id: `rs_${CONTACT_ID}_20260906120000000`,
      received_at: "2026-09-06T12:00:05.000Z",
      email: "person@example.org",
      audience: "tldr",
      resend_contact_id: CONTACT_ID,
      properties: {
        source_path: "/writing/foo",
        landing_path: null,
        referrer: null,
        utm_source: "x",
        utm_medium: null,
        utm_campaign: null,
        utm_content: null,
        utm_term: null,
      },
      channel: "abdur.ai_subscribe",
      event: "subscribe:tldr",
      evidence: `resend:GET /contacts/person%40example.org?audience_id=${AUD_TLDR}`,
    });
  });

  it("carries no ledger fields — stage/wtp/outbound are Prospector's", () => {
    const event = buildCandidateEvent({
      email: "a@b.co",
      audienceId: AUD_TLDR,
      audienceSlug: "tldr",
      contactId: CONTACT_ID,
      eventTimestamp: "2026-09-06T12:00:00.000Z",
    });
    for (const forbidden of ["stage", "wtp", "outbound", "contact_id", "qualified"]) {
      expect(event).not.toHaveProperty(forbidden);
    }
  });
});

describe("appendCandidateEvent", () => {
  const event = buildCandidateEvent({
    email: "a@b.co",
    audienceId: AUD_TLDR,
    audienceSlug: "tldr",
    contactId: CONTACT_ID,
    eventTimestamp: "2026-09-06T12:00:00.000Z",
  });

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("inserts (POST only — never an UPDATE, so A1 holds)", async () => {
    const fetchMock = vi.fn(async () => new Response("", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(appendCandidateEvent(event)).resolves.toBe("inserted");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://supabase.test/rest/v1/subscriber_candidates");
    expect(init.method).toBe("POST");
  });

  it("treats a duplicate event_id as an idempotent success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ code: "23505" }), { status: 409 })),
    );
    await expect(appendCandidateEvent(event)).resolves.toBe("deduped");
  });

  it("throws on a real failure so the caller can ask for a retry", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 500 })));
    await expect(appendCandidateEvent(event)).rejects.toThrow(/500/);
  });

  it("refuses to run unconfigured", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    await expect(appendCandidateEvent(event)).rejects.toThrow(/not configured/);
  });
});

describe("fetchContactProperties", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns {} for a contact with no properties (honest empty)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ id: "x" }), { status: 200 })));
    await expect(fetchContactProperties({ email: "a@b.co", audienceId: AUD_TLDR, apiKey: "k" })).resolves.toEqual({});
  });

  it("returns undefined when the read failed (unknown ≠ empty)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));
    await expect(fetchContactProperties({ email: "a@b.co", audienceId: AUD_TLDR, apiKey: "k" })).resolves.toBeUndefined();
  });
});
