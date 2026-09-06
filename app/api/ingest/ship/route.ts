import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { insertShipLog } from "@/lib/supabase";

/**
 * POST /api/ingest/ship
 *
 * Webhook endpoint for the ship log. Agents post a new line whenever
 * something ships. Auth: Bearer `AGENT_TOKEN`.
 *
 * Storage: inserts into Supabase `ship_log` via PostgREST
 * (`Prefer: return=minimal`), then `revalidateTag('ship')`.
 *
 * `client_id` is an optional idempotency key for retried agent deliveries:
 * it's unique per profile, so a retry of an already-recorded line returns
 * PostgREST 409 (code 23505) and this endpoint answers 200
 * { ok: true, deduped: true } instead of double-logging. Any other write
 * failure returns 502 {error:'persist_failed'} — never a silent 200.
 *
 * Example payload:
 *   { "date": "JUN 27", "text": "Beacon push surface live", "tag": "mnemix" }
 */

const schema = z.object({
  date: z.string().regex(/^[A-Z]{3} \d{2}$/),
  text: z.string().min(1).max(280),
  tag: z.string().min(1).max(32),
  client_id: z.string().min(1).max(128).optional(),
});

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth || auth !== `Bearer ${process.env.AGENT_TOKEN}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    const result = await insertShipLog(parsed.data);
    if (result === "deduped") {
      return NextResponse.json({ ok: true, deduped: true });
    }
  } catch (err) {
    console.error("[ingest/ship] persist failed:", err);
    return NextResponse.json({ error: "persist_failed" }, { status: 502 });
  }

  revalidateTag("ship");

  return NextResponse.json({ ok: true });
}
