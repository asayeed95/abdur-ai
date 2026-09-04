import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { upsertNowState } from "@/lib/supabase";

/**
 * POST /api/ingest/now
 *
 * Webhook endpoint for the abdur-os agent swarm. Pushes a fresh
 * "Now" panel state — what each agent is working on right now.
 *
 * Auth: Bearer token via `AGENT_TOKEN` env var.
 *
 * Storage: upserts the `now_state` row (pk profile_id='abdur') in Supabase
 * via PostgREST, then `revalidateTag('now')` so the homepage re-renders.
 * Returns 502 {error:'persist_failed'} if the write fails — never a silent 200.
 */

const schema = z.object({
  agents: z.array(
    z.object({
      agent: z.string().min(1).max(64),
      task: z.string().min(1).max(280),
      state: z.enum(["running", "queued", "idle", "done", "blocked"]),
    })
  ).max(20),
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
    await upsertNowState(parsed.data.agents);
  } catch (err) {
    console.error("[ingest/now] persist failed:", err);
    return NextResponse.json({ error: "persist_failed" }, { status: 502 });
  }

  revalidateTag("now");

  return NextResponse.json({ ok: true });
}
