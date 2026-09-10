import { NextResponse } from "next/server";
import {
  appendCandidateEvent,
  audienceSlugMap,
  buildCandidateEvent,
  candidateStoreConfigured,
  fetchContactProperties,
} from "@/lib/candidates";
import { readSvixHeaders, verifySvixSignature } from "@/lib/svix";

// node:crypto for the Svix HMAC — this route cannot run on the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Contact events this route acts on. Everything else is acknowledged, ignored. */
const HANDLED_EVENTS = new Set(["contact.created", "contact.updated"]);

type ResendContactEvent = {
  type?: string;
  created_at?: string;
  data?: {
    id?: string;
    audience_id?: string;
    email?: string;
    created_at?: string;
    updated_at?: string;
    unsubscribed?: boolean;
  };
};

/**
 * POST /api/resend/webhook — AGE-1402 Slice A (Option W).
 *
 * Resend `contact.created` / `contact.updated` for an audience this site
 * owns becomes ONE append-only candidate event (see `lib/candidates.ts`).
 * This route emits candidates only: it never writes
 * `reports/prospector/accounts.jsonl`, never sends mail, and never invents
 * an attribution value.
 *
 * Status contract, chosen for how Svix retries:
 *  - 401 bad/missing signature — permanent, no retry wanted.
 *  - 202 accepted-and-ignored (event type we do not handle, an audience we
 *    do not own, an unsubscribed contact). Not an error; do not retry.
 *  - 500 we could not read the contact or could not persist — Svix retries,
 *    and the deterministic `event_id` makes the retry idempotent.
 */
export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  if (!secret || !apiKey || !candidateStoreConfigured()) {
    console.error("[resend-webhook] missing RESEND_WEBHOOK_SECRET / RESEND_API_KEY / Supabase config");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  // Raw text: re-serialising the JSON would change the signed bytes.
  const raw = await req.text();
  const verdict = verifySvixSignature({ secret, headers: readSvixHeaders(req.headers), body: raw });
  if (!verdict.ok) {
    console.error(`[resend-webhook] signature rejected: ${verdict.reason}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: ResendContactEvent;
  try {
    payload = JSON.parse(raw) as ResendContactEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = payload.type ?? "";
  if (!HANDLED_EVENTS.has(type)) {
    return NextResponse.json({ ok: true, ignored: "event_type" }, { status: 202 });
  }

  const data = payload.data ?? {};
  const { id: contactId, audience_id: audienceId, email } = data;
  if (!contactId || !audienceId || !email) {
    // A contact event without these is not something we can attribute.
    return NextResponse.json({ ok: true, ignored: "incomplete_payload" }, { status: 202 });
  }

  const audienceSlug = audienceSlugMap()[audienceId];
  if (!audienceSlug) {
    return NextResponse.json({ ok: true, ignored: "unknown_audience" }, { status: 202 });
  }

  // An unsubscribed contact is not inbound interest. No candidate.
  if (data.unsubscribed === true) {
    return NextResponse.json({ ok: true, ignored: "unsubscribed" }, { status: 202 });
  }

  // The webhook payload carries no custom properties, so attribution is read
  // back from the contact. A FAILED read must not be recorded as "empty
  // attribution" — that would write a fact we do not have. Retry instead.
  const rawProperties = await fetchContactProperties({ email, audienceId, apiKey });
  if (rawProperties === undefined) {
    return NextResponse.json({ error: "Could not read contact" }, { status: 500 });
  }

  // Timestamp from the event, not the clock: that is what makes a
  // re-delivery collapse onto the same event_id.
  const eventTimestamp =
    (type === "contact.created" ? data.created_at : data.updated_at) ??
    data.updated_at ??
    data.created_at ??
    payload.created_at ??
    "";
  if (!eventTimestamp) {
    return NextResponse.json({ ok: true, ignored: "no_event_timestamp" }, { status: 202 });
  }

  const candidate = buildCandidateEvent({
    email,
    audienceId,
    audienceSlug,
    contactId,
    eventTimestamp,
    rawProperties,
  });

  try {
    const result = await appendCandidateEvent(candidate);
    return NextResponse.json({ ok: true, event_id: candidate.event_id, result });
  } catch (err) {
    console.error(`[resend-webhook] append failed: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Could not record candidate" }, { status: 500 });
  }
}
