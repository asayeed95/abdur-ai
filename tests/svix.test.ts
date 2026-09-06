import { describe, expect, it } from "vitest";
import { signPayload, verifySvixSignature, readSvixHeaders } from "@/lib/svix";

// A local, obviously-fake signing secret. Never a real whsec_ value.
const SECRET = "whsec_" + Buffer.from("age-1402-test-signing-key").toString("base64");
const ID = "msg_test_0001";
const BODY = JSON.stringify({ type: "contact.created", data: { id: "c_1" } });

function headersFor(timestamp: string, body = BODY, secret = SECRET) {
  return {
    id: ID,
    timestamp,
    signature: `v1,${signPayload({ secret, id: ID, timestamp, body })}`,
  };
}

describe("verifySvixSignature", () => {
  const now = 1_757_000_000;
  const ts = String(now);

  it("accepts a correctly signed payload", () => {
    expect(verifySvixSignature({ secret: SECRET, headers: headersFor(ts), body: BODY, nowSeconds: now }))
      .toEqual({ ok: true });
  });

  it("rejects a tampered body", () => {
    const result = verifySvixSignature({
      secret: SECRET,
      headers: headersFor(ts),
      body: BODY.replace("c_1", "c_2"),
      nowSeconds: now,
    });
    expect(result).toEqual({ ok: false, reason: "no matching signature" });
  });

  it("rejects a signature made with a different secret", () => {
    const other = "whsec_" + Buffer.from("some-other-key").toString("base64");
    const result = verifySvixSignature({
      secret: SECRET,
      headers: headersFor(ts, BODY, other),
      body: BODY,
      nowSeconds: now,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a replayed timestamp outside tolerance", () => {
    const result = verifySvixSignature({
      secret: SECRET,
      headers: headersFor(ts),
      body: BODY,
      nowSeconds: now + 3600,
    });
    expect(result).toEqual({ ok: false, reason: "timestamp outside tolerance" });
  });

  it("rejects missing headers", () => {
    const result = verifySvixSignature({
      secret: SECRET,
      headers: { id: null, timestamp: null, signature: null },
      body: BODY,
      nowSeconds: now,
    });
    expect(result).toEqual({ ok: false, reason: "missing signature headers" });
  });

  it("accepts when one of several rotating signatures matches", () => {
    const good = signPayload({ secret: SECRET, id: ID, timestamp: ts, body: BODY });
    const result = verifySvixSignature({
      secret: SECRET,
      headers: { id: ID, timestamp: ts, signature: `v1,AAAAdeadbeef= v1,${good}` },
      body: BODY,
      nowSeconds: now,
    });
    expect(result).toEqual({ ok: true });
  });

  it("ignores non-v1 signature versions", () => {
    const good = signPayload({ secret: SECRET, id: ID, timestamp: ts, body: BODY });
    const result = verifySvixSignature({
      secret: SECRET,
      headers: { id: ID, timestamp: ts, signature: `v2,${good}` },
      body: BODY,
      nowSeconds: now,
    });
    expect(result.ok).toBe(false);
  });
});

describe("readSvixHeaders", () => {
  it("reads svix-* and falls back to webhook-*", () => {
    expect(readSvixHeaders(new Headers({ "svix-id": "a", "svix-timestamp": "1", "svix-signature": "v1,x" })))
      .toEqual({ id: "a", timestamp: "1", signature: "v1,x" });
    expect(readSvixHeaders(new Headers({ "webhook-id": "b", "webhook-timestamp": "2", "webhook-signature": "v1,y" })))
      .toEqual({ id: "b", timestamp: "2", signature: "v1,y" });
  });
});
