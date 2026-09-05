/**
 * Server-only Supabase (PostgREST) helpers for the Now panel + Ship log.
 *
 * Raw fetch against `${NEXT_PUBLIC_SUPABASE_URL}/rest/v1` — no
 * @supabase/supabase-js, because tagged reads need fetch cache tags so
 * `revalidateTag('now' | 'ship')` from the ingest webhooks works.
 *
 * The service role key bypasses RLS; both tables are RLS-enabled with no
 * public policies, so these helpers must only run server-side. Note the
 * NEXT_PUBLIC_ URL is inlined into the build at build time — changing it
 * requires a rebuild, not just a restart.
 *
 * Readers never throw: on ANY failure (missing env, network error, non-2xx)
 * they return null/[] and log a warning, so the homepage always renders
 * its fallback content instead of a 500.
 */

const BASE = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

function configured(): boolean {
  if (!BASE() || !KEY()) {
    console.warn("[supabase] missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — using fallback");
    return false;
  }
  return true;
}

async function postgrest(
  path: string,
  init: RequestInit & { next?: { tags: string[] } }
): Promise<Response> {
  return fetch(`${BASE()}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: KEY()!,
      Authorization: `Bearer ${KEY()}`,
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}

export type NowAgent = {
  agent: string;
  task: string;
  state: "running" | "queued" | "idle" | "done" | "blocked";
};

export type ShipEntry = {
  date: string;
  text: string;
  tag: string;
  client_id?: string | null;
};

/** Latest Now-panel agent states, or null on any failure. */
export async function getNowState(): Promise<NowAgent[] | null> {
  if (!configured()) return null;
  try {
    const res = await postgrest("/now_state?select=agents&profile_id=eq.abdur", {
      method: "GET",
      next: { tags: ["now"] },
    });
    if (!res.ok) {
      console.warn(`[supabase] getNowState HTTP ${res.status}`);
      return null;
    }
    const rows = (await res.json()) as Array<{ agents: NowAgent[] }>;
    return rows[0]?.agents ?? null;
  } catch (err) {
    console.warn("[supabase] getNowState failed:", err);
    return null;
  }
}

/** Most recent ship-log entries (newest first), or [] on any failure. */
export async function getShipLog(limit = 25): Promise<ShipEntry[]> {
  if (!configured()) return [];
  try {
    const res = await postgrest(
      `/ship_log?select=date_short,text,tag&profile_id=eq.abdur&order=created_at.desc&limit=${limit}`,
      { method: "GET", next: { tags: ["ship"] } }
    );
    if (!res.ok) {
      console.warn(`[supabase] getShipLog HTTP ${res.status}`);
      return [];
    }
    const rows = (await res.json()) as Array<{ date_short: string; text: string; tag: string }>;
    return rows.map((r) => ({ date: r.date_short, text: r.text, tag: r.tag }));
  } catch (err) {
    console.warn("[supabase] getShipLog failed:", err);
    return [];
  }
}

/** Upsert the Now-panel state (merge-duplicates on pk profile_id). Throws on failure. */
export async function upsertNowState(agents: NowAgent[]): Promise<void> {
  if (!configured()) throw new Error("supabase not configured");
  const res = await postgrest("/now_state", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ profile_id: "abdur", agents }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`upsertNowState HTTP ${res.status}: ${await res.text()}`);
  }
}

export type InsertShipResult = "inserted" | "deduped";

/**
 * Insert a ship-log line. A duplicate `client_id` (partial unique index per
 * profile) comes back as PostgREST 409 / code 23505 and is treated as an
 * idempotent success ("deduped"). Throws on any other failure.
 */
export async function insertShipLog(entry: ShipEntry): Promise<InsertShipResult> {
  if (!configured()) throw new Error("supabase not configured");
  const res = await postgrest("/ship_log", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      profile_id: "abdur",
      date_short: entry.date,
      text: entry.text,
      tag: entry.tag,
      client_id: entry.client_id ?? null,
    }),
    cache: "no-store",
  });
  if (res.ok) return "inserted";
  if (res.status === 409) {
    const body = await res.text().catch(() => "");
    if (body.includes("23505")) return "deduped";
  }
  throw new Error(`insertShipLog HTTP ${res.status}: ${await res.text().catch(() => "")}`);
}
