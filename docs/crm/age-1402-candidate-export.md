# AGE-1402 — Resend → office candidate export

**Linear:** [AGE-1402](https://linear.app/agencyflow/issue/AGE-1402/gtm-crm-pipeline-contacts-stages-source-tracking) (Slice A)
**Implement packet:** `reports/forge/2026-09-06-age-1402-resend-ledger-implement.md`
**Schema authority:** `reports/prospector/2026-09-06-age-1402-crm-schema.md` (sha `2e365d23…`)

**PRODUCTION_VERIFIED: no — BLOCKED.** Nothing in this document is a claim
that the path has run in production. PV waits on a Hermes E2E with a real
test contact, per the packet. Merged ≠ deployed ≠ verified.

---

## What this ships

A durable, append-only bridge from Resend audience contacts to
**candidate events** that Prospector can promote into the account ledger.

```
Visitor → AttributionCapture → POST /api/subscribe → Resend contact create
                                                        │
                                        Resend webhook  ▼  contact.created / contact.updated
                                             POST /api/resend/webhook
                                                        │  (verify signature, read properties)
                                                        ▼
                                     subscriber_candidates  (append-only)
                                                        │
                                 npm run candidates:export ▼  JSONL
                                                        │
                             Prospector promotes ──────▶ reports/prospector/accounts.jsonl
```

The ship lane stops at the JSONL. **It never writes `accounts.jsonl`** —
promotion is a Prospector judgement, not an automatic export.

## Why a webhook (Option W), not a scheduled pull

Resend supports `contact.created` and `contact.updated` webhook events for
audience contacts
([docs](https://resend.com/docs/webhooks/event-types)), so Option W in the
packet is viable and was taken: no polling window, no cursor to keep, and a
new subscriber becomes a candidate within seconds.

Two consequences worth knowing:

1. **The webhook payload carries no custom properties.** It has `id`,
   `audience_id`, `email`, timestamps and `unsubscribed` — not the eight
   attribution properties. The route therefore reads them back with
   `GET /contacts/:email?audience_id=…`. If that read *fails*, the route
   returns 500 and records nothing, because "we could not read it" and "it
   is genuinely empty" are different facts and only the second may be
   written down. Svix retries; the deterministic `event_id` makes the retry
   idempotent.
2. **CSV imports do not fire `contact.created`** (Resend's own note). Bulk
   imports will not appear as candidates.

### Known gap — contacts created before the webhook existed

Contacts already on an audience when the webhook was configured emit no
event and therefore produce no candidate. That backlog is a one-time seed,
not an ongoing scrape: `npm run subscribers:sources` already reads those
contacts, and Prospector can promote them by hand with a Resend GET receipt
as `evidence`. A scheduled-pull backfill (packet Option P) is *not* in this
PR.

## Candidate event shape

Exactly the packet §A.2 shape. One row per observed contact state:

```json
{
  "event_id": "rs_e169aa45-1ecf-4183-9955-b1499d5701d3_20260906120000000",
  "received_at": "2026-09-06T12:00:05.000Z",
  "email": "person@example.org",
  "audience": "tldr",
  "resend_contact_id": "e169aa45-1ecf-4183-9955-b1499d5701d3",
  "properties": {
    "source_path": "/writing/the-night-the-doctrine-failed",
    "landing_path": null,
    "referrer": null,
    "utm_source": "hn",
    "utm_medium": null,
    "utm_campaign": null,
    "utm_content": null,
    "utm_term": null
  },
  "channel": "abdur.ai_subscribe",
  "event": "subscribe:tldr",
  "evidence": "resend:GET /contacts/person%40example.org?audience_id=…"
}
```

A candidate carries **no** `stage`, `wtp`, `qualified`, or `outbound` field.
Those are ledger vocabulary and belong to Prospector. Interest ≠ qualified.

### Invariants

| # | Invariant | How it holds |
|---|---|---|
| A1 | Append-only; a filled first-touch value is never overwritten | `subscriber_candidates` is INSERT-only. Nothing in the app issues an UPDATE. A later `contact.updated` adds a row; it does not edit the earlier one. |
| A2 | Idempotent on re-delivery | `event_id = rs_<contact_id>_<event timestamp>`, derived from Resend's own timestamp, never the ingest clock. A duplicate hits the primary key, comes back 23505, and is reported as `deduped`. |
| A3 | Honeypot / min-fill produce zero candidates | Those requests never reach Resend at all (`/api/subscribe` returns a silent `{ok:true}`), so no contact is created and no webhook fires. |
| — | Empty attribution stays null | `normalizeProperties` writes `null` for missing/blank/non-string values. Nothing is inferred. |
| — | Unsubscribed contacts produce no candidate | Not inbound interest. Acked 202, ignored. |
| — | Audiences this site does not own are ignored | Only `RESEND_AUDIENCE_{TLDR,ASEC,MNEMIX}` map to a slug. |

## Storage: why Supabase and not a file

The packet says "append-only JSONL." abdur.ai runs on Vercel, where the
filesystem is read-only outside an ephemeral `/tmp` — a route cannot append
to a repo file. So the append-only log lives in Supabase
(`supabase/migrations/20260906000000_subscriber_candidates.sql`, RLS enabled
with no public policies, service-role access only — the posture W-1 already
established), and the JSONL is **materialised on demand**:

```bash
npm run candidates:export                          # JSONL to stdout
node scripts/export-candidates.mjs --since 2026-09-01
node scripts/export-candidates.mjs --latest-per-contact
node scripts/export-candidates.mjs --out /tmp/candidates.jsonl   # append-only, dedupes on event_id
```

The export is read-only against the database and must never be pointed at
`accounts.jsonl`.

## How Prospector promotes a candidate (A5)

Manual, per-row, and a judgement call — there is no promote helper in this
PR by design.

1. Export the window: `node scripts/export-candidates.mjs --since <cursor> --latest-per-contact`.
2. **Reject** before anything else:
   - any `*@example.com` / `*@example.org` address (Sentinel prove contacts are never ledger customers),
   - an empty or malformed email,
   - a CAL-001 platform name — platforms are not contacts until a *person* from them enters.
3. For each surviving candidate, if `resend_contact_id` (or `email`) already
   has a row in `accounts.jsonl`, append to `sources.touches[]` — never
   rewrite `sources.first_touch`.
4. Otherwise write one new ledger row per schema §2:
   - `contact_id: ct_YYYYMMDD_<short>`
   - `stage: "inbound"`, `stage_reason: "subscribe:<list> accepted by Resend"`, `stage_receipt: AGE-1402`
   - `sources.first_touch.{channel,event,evidence}` ← the candidate's fields verbatim
   - the eight attribution keys ← `properties.*`, **nulls copied as nulls**
   - `wtp: "unknown"`, `outbound.status: "none"`, `suppression: false`, `owner: "Prospector"`
   - `next_action` dated — no forever-`inbound` row without a weekly refresh note
5. Leaving `inbound` for `qualified` / `pilot_ready` still requires a named
   person, a `failure_class`, and a `quoted_failure`. A subscribe is interest
   and nothing more.

## Required environment

Values live in Doppler / Vercel project env. **Never in git.**

| Name | Used for |
|---|---|
| `RESEND_API_KEY` | reading the contact's attribution properties |
| `RESEND_WEBHOOK_SECRET` | Svix signature verification (`whsec_…`, shown once at webhook creation) |
| `RESEND_AUDIENCE_TLDR` / `_ASEC` / `_MNEMIX` | audience id → list slug; an unlisted audience is ignored |
| `NEXT_PUBLIC_SUPABASE_URL` | candidate store |
| `SUPABASE_SERVICE_ROLE_KEY` | candidate store (bypasses RLS — server-only) |

Any one missing → the route returns **503 and records nothing**, rather than
silently dropping events.

## Deploy checklist (not done in this PR)

1. Apply `supabase/migrations/20260906000000_subscriber_candidates.sql`.
2. Set `RESEND_WEBHOOK_SECRET` in Vercel.
3. Create the Resend webhook → `https://abdur.ai/api/resend/webhook`,
   events `contact.created` + `contact.updated`.
4. Hermes E2E with a **real** test contact, then delete it from the audience.
5. Only then may PV be discussed. It is not automatic.

## Out of scope, deliberately

No outbound send path. No approval-queue send. No HubSpot or Notion as CRM
of record. No promote helper. No inferred WTP, qualification, or UTM. No
write to `reports/prospector/accounts.jsonl` from any code in this repo.
