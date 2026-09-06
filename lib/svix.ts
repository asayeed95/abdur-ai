/**
 * Svix webhook signature verification — the scheme Resend signs its
 * webhooks with (https://resend.com/docs/webhooks/verify-webhooks-requests).
 *
 * Implemented against `node:crypto` rather than pulling in the `svix`
 * package: this is ~40 lines of well-specified HMAC, it keeps the runtime
 * dependency list of a content site unchanged, and — unlike a vendored
 * verifier — it can be unit-tested here without network or secrets.
 *
 * The scheme:
 *   signed content = `${svix-id}.${svix-timestamp}.${raw body}`
 *   signature      = base64( HMAC-SHA256( base64decode(secret minus
 *                    "whsec_" prefix), signed content ) )
 * `svix-signature` carries one or more space-separated `v1,<sig>` entries
 * (during a secret rotation there are two); a match on ANY entry passes.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/** Reject anything older/newer than this to blunt replay. Svix's own default. */
export const SVIX_TOLERANCE_SECONDS = 5 * 60;

export type SvixHeaders = {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
};

export type VerifyResult = { ok: true } | { ok: false; reason: string };

/** Pull the three svix headers, tolerating the `webhook-*` aliases. */
export function readSvixHeaders(headers: Headers): SvixHeaders {
  return {
    id: headers.get("svix-id") ?? headers.get("webhook-id"),
    timestamp: headers.get("svix-timestamp") ?? headers.get("webhook-timestamp"),
    signature: headers.get("svix-signature") ?? headers.get("webhook-signature"),
  };
}

function constantTimeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Compute the expected `v1` signature for a payload. Exported for tests. */
export function signPayload({
  secret,
  id,
  timestamp,
  body,
}: {
  secret: string;
  id: string;
  timestamp: string;
  body: string;
}): string {
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  return createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
}

/**
 * Verify a webhook request. `body` MUST be the raw request text — parsing
 * and re-serialising the JSON changes the bytes and invalidates the
 * signature.
 */
export function verifySvixSignature({
  secret,
  headers,
  body,
  nowSeconds = Math.floor(Date.now() / 1000),
}: {
  secret: string;
  headers: SvixHeaders;
  body: string;
  nowSeconds?: number;
}): VerifyResult {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return { ok: false, reason: "missing signature headers" };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "malformed timestamp" };
  if (Math.abs(nowSeconds - ts) > SVIX_TOLERANCE_SECONDS) {
    return { ok: false, reason: "timestamp outside tolerance" };
  }

  let expected: string;
  try {
    expected = signPayload({ secret, id, timestamp, body });
  } catch {
    return { ok: false, reason: "malformed signing secret" };
  }

  for (const part of signature.split(" ")) {
    const [version, value] = part.split(",", 2);
    if (version !== "v1" || !value) continue;
    if (constantTimeEquals(value, expected)) return { ok: true };
  }
  return { ok: false, reason: "no matching signature" };
}
