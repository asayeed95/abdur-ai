import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * POST /api/ingest/ship
 *
 * Webhook endpoint for the ship log. Agents post a new line whenever
 * something ships. Auth: Bearer `AGENT_TOKEN`. Storage: stub.
 *
 * Example payload:
 *   { "date": "JUN 27", "text": "Beacon push surface live", "tag": "mnemix" }
 */

const schema = z.object({
  date: z.string().regex(/^[A-Z]{3} \d{2}$/),
  text: z.string().min(1).max(280),
  tag: z.string().min(1).max(32),
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

  // TODO(claude-code): prepend to Supabase `ship_log` + revalidateTag('ship').
  console.log(`[ingest/ship] ${parsed.data.date} ${parsed.data.text}`);

  return NextResponse.json({ ok: true });
}
