# A0 IMPLEMENT PACKET — AGE-1402 Resend→ledger export (ship-lane)

> **LOCK 2026-09-06T18:55:30Z / 2:55 PM ET Sun Sep 6:** Orbit handoff `2026-09-06-orbit-to-forge-age-1402-resend-ledger-packet.md`. Schema authority: Prospector `2026-09-06-age-1402-crm-schema.md` (sha `2e365d23…`). Ledger `reports/prospector/accounts.jsonl` exists **empty (0 bytes)** — correct. **MERGE no** until packet review. **No outbound.** **No fabricated contacts.** **PRODUCTION_VERIFIED no** until Hermes E2E with a real test contact (Prospector+Hermes+Sentinel later). Do not steal hot eng / metering / #931 AGE-967 flag follow-up / #914. Forge **opens no PR** — writer lane on `asayeed95/abdur-ai`. **No CloudAgent** unless Orbit re-authorizes.

| field | value |
|---|---|
| assignment | **ROUTE-ENG-1402-RESEND-LEDGER** |
| linear parent | [AGE-1402](https://linear.app/agencyflow/issue/AGE-1402/gtm-crm-pipeline-contacts-stages-source-tracking) **Backlog** High — abdur.ai project |
| companion (optional) | AGE-1592 Done / MERGED #44 @ `fdebd2d7` — empty-backfill FAIL (201≠409); Done ≠ PV |
| repo | `asayeed95/abdur-ai` (not mnemix) |
| main tip (this run) | `fdebd2d718ed4056f74fcef8a0d2e960503c5e1b` |
| schema | `/workspace/northsun-ops/reports/prospector/2026-09-06-age-1402-crm-schema.md` |
| ledger | `/workspace/northsun-ops/reports/prospector/accounts.jsonl` (empty) |
| writer | Claude / Hermes writer lane — **no** CloudAgent default |
| MERGE | **no** until packet review + non-author review on PR |
| outbound / fake contacts | **forbidden** |
| PRODUCTION_VERIFIED | **BLOCKED** (Hermes E2E unpaid) |

## Goal

Durable path from Resend audience contacts (abdur.ai `POST /api/subscribe` ingress) → office candidate events → Prospector-promotable rows for `accounts.jsonl` at stage `inbound`. Interest only. Never invent WTP / qualified / UTMs.

## Recommended Linear children (Hermes/Orbit open — Forge does not mutate Linear)

| id (suggested) | title | slice |
|---|---|---|
| AGE-1402-A | Resend→office candidate export (webhook or scheduled pull) | **this packet primary** |
| AGE-1402-B | AGE-1592 leftover: empty attribution backfill (201≠409) | **optional companion** |

## Slice A — Export / webhook (primary)

### A.1 Problem

Subscribe lands contacts in Resend (TLDR / waitlist audiences). Office ledger is empty. No durable bridge exists. Prospector must not scrape Resend by hand forever; must not invent rows.

### A.2 Design (writer chooses one; prefer webhook if Resend supports contact.created for audience)

**Option W — Webhook (preferred if available)**  
1. Resend webhook → abdur.ai route (e.g. `app/api/resend/webhook/route.ts`) verifying Svix/Resend signature.  
2. On contact create/update for configured audiences: append **candidate event** (not ledger row) to an append-only store Prospector can read.  
3. Candidate shape (JSONL under office or abdur-ai artifact Prospector pulls):

```json
{
  "event_id": "rs_<resend_contact_id>_<ts>",
  "received_at": "ISO-8601Z",
  "email": "person@example.com",
  "audience": "tldr",
  "resend_contact_id": "...",
  "properties": {
    "source_path": null,
    "landing_path": null,
    "referrer": null,
    "utm_source": null,
    "utm_medium": null,
    "utm_campaign": null,
    "utm_content": null,
    "utm_term": null
  },
  "channel": "abdur.ai_subscribe",
  "event": "subscribe:tldr",
  "evidence": "path-or-url-to-receipt"
}
```

Empty property keys stay `null` — do not invent. Honeypot/min-fill never create Resend contacts → no candidate.

**Option P — Scheduled pull**  
Cron (GitHub Action or Worker) lists Resend audience contacts since cursor; same candidate JSONL; idempotent on `resend_contact_id` / email.

### A.3 Promote to ledger (Prospector — not this PR's runtime write)

Ship-lane may **emit candidates only**. Promotion into `accounts.jsonl` is Prospector:

- Map per schema §2 / §4.2  
- `stage: "inbound"`, `wtp: "unknown"`, `outbound.status: "none"`  
- `contact_id: ct_YYYYMMDD_<short>`  
- Never keep `*@example.com` Sentinel prove contacts as customers  
- Never load CAL-001 platform names as contacts

If engineering writes a promote helper, it must be **opt-in / dry-run default** and refuse example.com / empty email.

### A.4 Env honesty

Sentinel: audience IDs not in Doppler configs searched; Mac `.env.local` has `RESEND_API_KEY` + `RESEND_AUDIENCE_TLDR`. Writer must document required env (`RESEND_API_KEY`, audience IDs, webhook secret) in PR body — no secrets in git.

### A.5 Acceptance (Slice A)

| # | criterion |
|---|---|
| A1 | Candidate events append-only; no silent overwrite of filled first-touch fields |
| A2 | Idempotent on re-delivery / re-pull (same contact → one candidate key) |
| A3 | Honeypot/min-fill produce **zero** candidates |
| A4 | Unit/integration tests with fixtures — **no** live fake customer left in Resend or ledger |
| A5 | Docs: how Prospector promotes; PV still unpaid |
| A6 | No outbound send path; no HubSpot/Notion CRM |

## Slice B — Optional AGE-1592 empty-backfill fix (companion)

### B.1 Fact (Sentinel FAIL)

`app/api/subscribe/route.ts` @ `fdebd2d7` gates backfill on `res.status === 409`. Live Resend duplicate create returns **201** (same contact id), not 409 → backfill never runs. Manual `PATCH` does fill empty keys. Filled no-overwrite PASS.

Also: `isNewContact = res.ok` treats duplicate **201** as new → welcome may re-fire. Fix must address welcome gate.

### B.2 Ask (writer)

In `app/api/subscribe/route.ts`:

1. After successful create (`201`/`200`) **or** `409`, if attribution properties non-empty → always call existing `backfillAttribution` (GET then PATCH **empty keys only**).  
2. Welcome email: treat as new only when contact was actually created this request (e.g. parse body id + first-seen, or GET-before-create, or Resend header — **do not** use bare `res.ok`). Prefer: welcome only if pre-create GET 404, or if create response indicates new; never welcome on known existing.  
3. Tests: duplicate create path enters backfill; empty keys fill; filled keys untouched; welcome once.

Concrete guidance: `/workspace/northsun-ops/reports/forge/patches/AGE-1402/PATCH-B-backfill.md`

### B.3 Acceptance (Slice B)

| # | criterion |
|---|---|
| B1 | Re-subscribe with new empty→filled UTM keys backfills without overwriting filled |
| B2 | Welcome not re-sent on duplicate 201 |
| B3 | Sentinel can re-prove 2b; PV still unpaid until that prove |

## Out of scope

- Outbound / approval-queue send  
- HubSpot / Notion as CRM of record  
- Inventing WTP / qualified from subscribe alone  
- Hermes Socket Mode E2E / PRODUCTION_VERIFIED claim  
- AGE-1400 Fleet Standing Orders ratification  
- Stealing #931 / metering / mnemix hot eng  
- Reopening closed abdur-ai attribution PRs as the export vehicle (#38 OPEN is STALE vs #44 MERGED — do not revive #38 for this)

## Steal locks

Do not steal: AGE-967 #931, #914 DRAFT, metering, #862/#864/#860/#834/#851, abdur-ai #43/#39 unless Orbit reassigns.

## Writer handoff checklist

1. Open PR(s) on `asayeed95/abdur-ai` from this packet (Forge opens none).  
2. Prefer Slice A first; Slice B may ship same PR or follow-up.  
3. Cite schema + this packet in PR body.  
4. MERGE held for review.  
5. After land: Sentinel prove (backfill if B shipped); Hermes E2E real test contact; Prospector first real ledger row — **then** PV discussion (not automatic).

## Return

| key | value |
|---|---|
| packet | `/workspace/northsun-ops/reports/forge/2026-09-06-age-1402-resend-ledger-implement.md` |
| patch notes B | `/workspace/northsun-ops/reports/forge/patches/AGE-1402/PATCH-B-backfill.md` |
| PR opened by Forge | **no** |
| MERGE | **no** |
| CloudAgent | **no** |
| PV | **no** / BLOCKED |
