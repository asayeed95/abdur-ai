# mnemix 21326b0 — feat(usage): usage_events metering ledger — counting only, flag-gated (§M2) (#406)
**Receipts:** `git -C mnemix log -1 21326b0` (merged to main) — Abdur Rahman, 2026-07-08

* feat(usage): usage_events metering ledger — counting only, flag-gated (DEC-USAGE-METERING §M2)

The counting substrate for usage-based pricing. Records billable usage per
tenant; CHARGES NO ONE (the Stripe path is a separate, founder-gated effort).

- migration 032: usage_events (append-only, RLS-scoped by app.current_tenant_id
  like memory_objects — tenant data, not the tenants auth-root), integer
  micro-dollar (µ$) money per the money rule, aggregation index. Squawk + lint
  clean; down + runbook included. NOT applied to prod (gated on founder go).
- src/services/usage.ts: recordUsageEvent — best-effort (a metering failure
  returns false and never throws, so it can't break/slow a user request),
  ENABLE_USAGE_METERING flag (default off = no-op).
- recall wiring: /v1/recall_and_enrich emits a 'recall' meter (the primary value
  metric per pricing-strategy-2026) + an 'enrichment_query' meter when vendors
  were called — both via scheduleBackground/waitUntil, zero hot-path latency.

Tests: 5 usage-service unit tests (flag gating, insert shape, µ$ integer cost,
best-effort no-throw). Typecheck + full unit suite green (581 passed).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FK5vUSGnghZ5ty3NbXSENd

* fix(usage): append-only RLS + meter CHECK + positional test asserts (CodeRabbit #406)

- Major: usage_events RLS had no FOR clause → a tenant could UPDATE/DELETE its own
  billing history. Split into INSERT + SELECT policies ONLY; no UPDATE/DELETE policy,
  so append-only is enforced for mnemix_app (NOBYPASSRLS) too. maint/service_role
  (BYPASSRLS) retain admin correction/retention ability.
- meter column now CHECK (meter IN ('recall','enrichment_query','observe_write')) so
  a typo can't create an un-billable phantom meter.
- tests: assert positional column binding (values[0..5]) instead of toContain, so a
  column-order regression is caught. down migration drops all three policies.

Squawk + migration-lint clean; usage tests 5/5.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FK5vUSGnghZ5ty3NbXSENd

* fix(usage): address CodeRabbit findings — cache-hit double-count bug + append-only trigger + Sentry (PR #406)

Real correctness bug caught: the enrichment_query meter counted cache hits as
if they were live vendor lookups. sourcesCalled is populated from EITHER a
cache hit (Object.keys(cachedEnrichment)) OR a live race — a cache hit makes
zero real Trestle/Twilio requests (that cost was already counted on the
request that originally populated the cache). Fixed: gate on !cacheHit.
Added 3 route tests (live-call emits both meters, cache-hit emits recall only,
flag-off emits nothing) — this path had zero test coverage before.

Also addressed:
- usage_events append-only enforcement: RLS already denied mnemix_app
  UPDATE/DELETE (no policy for those commands), but that's bypassed entirely
  by BYPASSRLS roles and would silently stop protecting the table if a future
  migration ever mis-granted mnemix_app write access. Added a role-aware
  BEFORE UPDATE OR DELETE trigger as a second, independent gate — NOT
  unconditional, since mnemix_maint/service_role are BYPASSRLS specifically to
  retain legitimate admin correction/retention-sweep ability; the trigger
  allows those roles through and blocks everyone else. Down migration drops
  the function explicitly (DROP TABLE cascades the trigger, not the function).
- Sentry.captureException added to recordUsageEvent's catch path, matching
  the pattern used elsewhere in this codebase.
- Runbook: fixed stale policy-count (1 -> 2, insert+select split).
- Documented (not silently dropped) a real but disproportionate-for-now
  finding: no idempotency key on recordUsageEvent means a client HTTP retry
  could double-count. Acceptable because this ledger is display-only right
  now (DEC-USAGE-METERING §M2) — revisit when the Stripe charging path (§M4)
  is built, where exact-once accounting actually matters.

Squawk clean (1 accepted ban-drop-table warning, standard for any down
migration removing a new table), migration-lint clean, typecheck clean,
604/605 unit tests pass.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FK5vUSGnghZ5ty3NbXSENd

* fix(usage): rename the pre-existing orphan usage_events table before creating the canonical one (D3, founder decision)

Applying this migration hit a real conflict: a different usage_events table
already lives in prod (kind/cost_cents/sub_tenant_id/provider/request_id
schema, no migration file anywhere created it, no current code reads it, 12
rows, last write 2026-04-25). Founder decision: preserve, don't destroy --
we're in a disclosed-secret posture (DEC-TENANTS-RLS SD4), don't destroy data
we don't fully understand.

- Up migration: ALTER TABLE IF EXISTS usage_events RENAME TO
  usage_events_legacy_20260425 (metadata-only, near-instant, no data rewrite)
  before CREATE TABLE usage_events under the canonical design. IF EXISTS makes
  this a no-op on any environment that never had the orphan (fresh DB/CI/staging).
- Down migration: symmetric -- drops the new table, then renames the legacy
  table back to usage_events, fully restoring pre-apply state.
- Runbook: documents the rename, adds post-apply verification that the orphan
  survived (12 rows, present under the legacy name) and that the canonical
  table has the NEW schema, and a follow-up note (archive/drop the legacy
  table after 90 days of zero queries -- separate decision, not this one).

Squawk flags both the rename and the down-migration's drop (expected --
renaming/dropping tables always triggers these; both intentional and already
justified, matching the existing accepted-warning pattern in this file).
Migration-lint clean, typecheck clean, 604/605 unit tests pass.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FK5vUSGnghZ5ty3NbXSENd

---------

Co-authored-by: Claude Fable 5 <noreply@anthropic.com>

**Used by:** content/posts/_drafts/the-meter-that-counted-cache-hits-as-cash.mdx
