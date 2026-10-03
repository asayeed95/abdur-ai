import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Shared Bearer-token guard for every `/api/ingest/*` webhook (AGE-2591).
 *
 * Fails closed: if `AGENT_TOKEN` is unset, empty or whitespace-only, EVERY
 * request is refused with 500 — the old inline check built the expected
 * header from the env var directly, so an unset token made the literal
 * `Bearer undefined` a valid credential.
 *
 * The comparison hashes both sides to a fixed length and uses
 * `timingSafeEqual`, so neither the token's contents nor its length leak
 * through response timing.
 *
 * Returns a response to send back when the request must be refused, or
 * `null` when it is authorized. Call it before reading the body:
 *
 *   const denied = requireAgentToken(req, "ingest/now");
 *   if (denied) return denied;
 */
export function requireAgentToken(req: Request, route: string): NextResponse | null {
  // Read per request, not at module load, so a rotated or newly-set token
  // takes effect without depending on module caching.
  const token = process.env.AGENT_TOKEN;
  if (!token || token.trim() === "") {
    console.error(`[${route}] AGENT_TOKEN is not configured — refusing all ingest requests`);
    // Deliberately vague to the caller: don't advertise that auth is off.
    return NextResponse.json({ error: "ingest_unavailable" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (!auth || !constantTimeEqual(auth, `Bearer ${token}`)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return null;
}

function constantTimeEqual(a: string, b: string): boolean {
  const da = createHash("sha256").update(a, "utf8").digest();
  const db = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(da, db);
}
