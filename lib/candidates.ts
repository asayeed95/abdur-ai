/**
 * Subscriber candidate events — AGE-1402 Slice A (Resend → office export).
 *
 * A *candidate event* is the append-only bridge between a Resend audience
 * contact and the Prospector account ledger
 * (`reports/prospector/accounts.jsonl`). This module NEVER writes the
 * ledger: promotion of a candidate into a ledger row at `stage: "inbound"`
 * is Prospector's decision, not the ship lane's. See
 * `docs/crm/age-1402-candidate-export.md`.
 *
 * Invariants (packet §A.5):
 *  - A1 append-only. Rows are inserted, never updated. A first-touch value
 *    that is already filled can therefore never be overwritten from here.
 *  - A2 idempotent. `event_id` is derived deterministically from the Resend
 *    contact id + the event's own timestamp, so a webhook re-delivery or a
 *    re-pull of the same contact state collapses to one row.
 *  - Empty attribution properties stay `null` — this module never invents a
 *    UTM, a referrer, or a source path.
 */

/** The eight attribution properties declared by /api/subscribe. */
export const CANDIDATE_PROPERTY_KEYS = [
  "source_path",
  "landing_path",
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type CandidatePropertyKey = (typeof CANDIDATE_PROPERTY_KEYS)[number];

/** Every declared key is present; unknown/blank values are explicitly null. */
export type CandidateProperties = Record<CandidatePropertyKey, string | null>;

export type CandidateEvent = {
  event_id: string;
  received_at: string;
  email: string;
  audience: string;
  resend_contact_id: string;
  properties: CandidateProperties;
  channel: "abdur.ai_subscribe";
  event: string;
  evidence: string;
};

/**
 * Audience id → list slug. Reads the same env vars the subscribe route
 * uses, so there is exactly one place audience ids are configured.
 * An audience the site does not own is not in this map and yields no
 * candidate.
 */
export function audienceSlugMap(
  env: Record<string, string | undefined> = process.env,
): Record<string, string> {
  const map: Record<string, string> = {};
  const pairs: Array<[string | undefined, string]> = [
    [env.RESEND_AUDIENCE_TLDR, "tldr"],
    [env.RESEND_AUDIENCE_ASEC, "asec-waitlist"],
    [env.RESEND_AUDIENCE_MNEMIX, "mnemix-beta"],
  ];
  for (const [id, slug] of pairs) {
    if (id && id.trim() !== "") map[id.trim()] = slug;
  }
  return map;
}

/**
 * Analytics/ledger event name for a list slug. Matches the schema's
 * `sources.first_touch.event` vocabulary; an unrecognised slug degrades to
 * the bare `subscribe` rather than inventing a list.
 */
export function eventNameForSlug(slug: string): string {
  return slug ? `subscribe:${slug}` : "subscribe";
}

/**
 * Normalise a Resend contact's `properties` bag into the full eight-key
 * shape. Missing, null, non-string, and whitespace-only values all become
 * `null` — an empty property is recorded as empty, never guessed at.
 */
export function normalizeProperties(raw: unknown): CandidateProperties {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out = {} as CandidateProperties;
  for (const key of CANDIDATE_PROPERTY_KEYS) {
    const value = source[key];
    out[key] = typeof value === "string" && value.trim() !== "" ? value : null;
  }
  return out;
}

/**
 * Deterministic candidate key: `rs_<contact_id>_<compact-timestamp>`.
 *
 * The timestamp comes from the *event* (Resend's `updated_at` / `created_at`
 * for the contact state being reported), never from the clock at ingest —
 * that is what makes a Svix re-delivery, or a second scheduled pull that
 * sees the same contact state, produce the same key (A2).
 */
export function candidateEventId(contactId: string, eventTimestamp: string): string {
  const compact = eventTimestamp.replace(/[^0-9]/g, "");
  return `rs_${contactId}_${compact}`;
}

/** Read receipt locator for a candidate — a real Resend GET path, not prose. */
export function evidencePath(email: string, audienceId: string): string {
  return `resend:GET /contacts/${encodeURIComponent(email)}?audience_id=${audienceId}`;
}

export type BuildCandidateInput = {
  email: string;
  audienceId: string;
  audienceSlug: string;
  contactId: string;
  /** Resend's timestamp for the contact state being reported. */
  eventTimestamp: string;
  /** Raw `properties` bag from a Resend contact GET, if one was read. */
  rawProperties?: unknown;
  /** Ingest time. Defaults to now; only affects `received_at`, not the key. */
  receivedAt?: string;
};

/** Build one candidate event in the exact packet §A.2 shape. */
export function buildCandidateEvent(input: BuildCandidateInput): CandidateEvent {
  return {
    event_id: candidateEventId(input.contactId, input.eventTimestamp),
    received_at: input.receivedAt ?? new Date().toISOString(),
    email: input.email,
    audience: input.audienceSlug,
    resend_contact_id: input.contactId,
    properties: normalizeProperties(input.rawProperties),
    channel: "abdur.ai_subscribe",
    event: eventNameForSlug(input.audienceSlug),
    evidence: evidencePath(input.email, input.audienceId),
  };
}

/* ------------------------------------------------------------------ */
/* Durable append                                                      */
/* ------------------------------------------------------------------ */

/**
 * Vercel's filesystem is read-only, so the append-only log lives in
 * Supabase (`subscriber_candidates`, migration
 * `20260906000000_subscriber_candidates.sql`) and is materialised as JSONL
 * on demand by `scripts/export-candidates.mjs`. Access is service-role only;
 * RLS is enabled with no public policies, matching the W-1 tables.
 */
const BASE = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

export function candidateStoreConfigured(): boolean {
  return Boolean(BASE() && KEY());
}

export type AppendResult = "inserted" | "deduped";

/**
 * Insert one candidate event. A repeat `event_id` comes back as PostgREST
 * 409 / SQLSTATE 23505 and is an idempotent success ("deduped") — that is
 * acceptance A2. Throws on any other failure so the caller can return a
 * non-2xx and let Svix retry.
 */
export async function appendCandidateEvent(event: CandidateEvent): Promise<AppendResult> {
  if (!candidateStoreConfigured()) {
    throw new Error("candidate store not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  const res = await fetch(`${BASE()}/rest/v1/subscriber_candidates`, {
    method: "POST",
    headers: {
      apikey: KEY()!,
      Authorization: `Bearer ${KEY()}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      event_id: event.event_id,
      received_at: event.received_at,
      email: event.email,
      audience: event.audience,
      resend_contact_id: event.resend_contact_id,
      properties: event.properties,
      channel: event.channel,
      event: event.event,
      evidence: event.evidence,
    }),
    cache: "no-store",
  });
  if (res.ok) return "inserted";
  if (res.status === 409) {
    const body = await res.text().catch(() => "");
    if (body.includes("23505")) return "deduped";
  }
  throw new Error(`appendCandidateEvent HTTP ${res.status}: ${await res.text().catch(() => "")}`);
}

/**
 * Read a Resend contact's properties. Returns `undefined` when the read
 * failed — the caller must NOT persist an all-null candidate in that case,
 * because "we could not read it" and "it is genuinely empty" are different
 * facts and only the second one may be written down.
 */
export async function fetchContactProperties({
  email,
  audienceId,
  apiKey,
}: {
  email: string;
  audienceId: string;
  apiKey: string;
}): Promise<Record<string, unknown> | undefined> {
  try {
    const res = await fetch(
      `https://api.resend.com/contacts/${encodeURIComponent(email)}?audience_id=${audienceId}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[candidates] contact GET ${res.status} for ${email}: ${detail}`);
      return undefined;
    }
    const contact = (await res.json()) as { properties?: Record<string, unknown> };
    return contact.properties ?? {};
  } catch (err) {
    console.error(`[candidates] contact GET failed for ${email}: ${err instanceof Error ? err.message : String(err)}`);
    return undefined;
  }
}
