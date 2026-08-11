# mnemix 7cc55ef — DEC-TENANTS-RLS + migration 031 — enable RLS on tenants, close prod credential leak (#402)
**Receipts:** `git -C mnemix log -1 7cc55ef` (merged to main) — Abdur Rahman, 2026-07-07

* docs(decisions): DEC-TENANTS-RLS — enable RLS on tenants, close prod credential leak

Locks the tenants RLS/grant model (blocks PR #398). Founder shape via §D1/§D2,
Perplexity review reinforcements folded in, plus two corrections verified this
session:

- §D1 policy CORRECTED from the endorsed GUC-based 'Option C' to a role-branch:
  tenants is the auth ROOT (Workers reads it by api_key_hash before any tenant_id
  exists), so a GUC-scoped policy returns 0 rows at auth time and 401s every
  request. Working form: FOR ALL TO mnemix_app (unscoped service read) +
  auth.uid() owner policies for the dashboard. app.current_tenant_id GUC stays
  the mechanism for DATA tables only.
- Serialization pushback resolved by primary source: cd.yml has
  concurrency: deploy-production/cancel-in-progress:false, and NO workflow
  auto-applies migrations (manual Management-API, one at a time). So no
  cross-migration race; L6 governs intra-file DDL order (policy→enable→revoke).

Reinforcements: L5 SET-LOCAL/Hyperdrive connection-churn isolation invariant
(+ churn acceptance test); L6 DDL ordering + lock_timeout; sub-tenancy forward
hook (composite tenant_id,end_user_id on DATA tables, never on tenants — MaaS
positioning); (select auth.uid()) initPlan wrapping; Vault in the column-split
trigger; Squawk named explicitly; secret-rotation recommended as a follow-up.

Canonical path (docs/superpowers/specs/decisions/, alongside
DEC-MIGRATION-ROLLBACK) — NOT the repo-root decisions/ where two duplicates
from an earlier session still need reconciling (separate task).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FK5vUSGnghZ5ty3NbXSENd

* feat(migrations): 031 tenants RLS + down + runbook; DEC §D3; reconcile DEC-V1-RESOLVE

Migration 031 enables RLS on the tenants auth-root table and closes the
authenticated over-grant (anon closed by the 2026-07-06 stopgap). Verified
against prod schema + the 014 RLS-setup migration before writing:
- FOR ALL TO mnemix_app (NOBYPASSRLS) preserves the api_key_hash auth read
- authenticated scoped to user_id=(select auth.uid()), no secret-column grants
- mnemix_maint/service_role are BYPASSRLS → cross-tenant sweeps unaffected
- L7 DDL order (policy→enable→revoke), BEGIN/COMMIT + SET LOCAL timeouts;
  Squawk-clean (up+down), migration-lint clean

Three defects caught by adversarial verification (5-skeptic workflow) and fixed:
- portability: dropped enrichment_spend_cents/_cap_cents from the grant — 004
  only conditionally references them; granting aborts the txn on any DB where
  they were never created (fresh CI/staging) → leak left open in test envs
- down-migration leak: the down now REVOKEs authenticated grants BEFORE
  disabling RLS — else DISABLE RLS + remaining webhook_secret grant = every
  user can cross-tenant read/UPDATE webhook_secret (webhook hijack). Dashboard
  is intentionally locked out while rolled back
- provisioning blocker (DEC §D3): web/src/app/dashboard/layout.tsx self-provisions
  a tenant as authenticated (insert incl api_key_hash/plan + select('*'));
  031 breaks it. Kept 031 secure (no authenticated INSERT) and flagged
  server-side provisioning as a HARD BLOCKER before apply — not guessed into SQL

Also reconcile the duplicate repo-root decisions/DEC-V1-RESOLVE.md → tombstone
pointing at the canonical docs/superpowers/specs/decisions/DEC-V1-RESOLVE.md
(locked 2026-06-09); folded the #396 .resolve()-removal fact into the canonical
acceptance.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FK5vUSGnghZ5ty3NbXSENd

* fix: address CodeRabbit BLOCK items on PR #402

- DEC §D3: provision_tenant() must be idempotent — UNIQUE(user_id) +
  ON CONFLICT (user_id) DO NOTHING, return existing row
- DEC Constraints: rollback wording now matches the down migration
  (revoke grants FIRST, disable RLS second, restore NO grants)
- Runbook: added check #5 — real cross-tenant RLS isolation via
  request.jwt.claims for two distinct owners on granted columns
- 031 migration: operational note on tenants_service_all (no RLS
  backstop for mnemix_app on tenants; comment-only, SQL unchanged)

Rotation-as-rollout-gate item flagged for founder decision (reverses
a founder-scoped call in the DEC), not speculatively changed.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

* docs(dec): §D4 — secret rotation as a waivable rollout gate (CodeRabbit #402 item 3)

The bridge's 6d26872 addressed 4 of 5 CodeRabbit items but left the rotation
item as a bare founder-flag. Elevating it to an explicit rollout GATE (DEC §D4)
that is WAIVABLE — rotate tenant_secret/webhook_secret before applying 031, or
record a written founder waiver. This closes the door AND changes the locks:
the anon key exposed those secrets since inception, and RLS does not un-disclose
copied secrets. Framed as a founder decision with a default (rotate) + escape
(waiver), so it surfaces the call rather than reversing it. Runbook §Rollout +
acceptance updated; the stale 'follow-up / yes-no' framing removed.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FK5vUSGnghZ5ty3NbXSENd

* docs: fix 2 CodeRabbit consistency items on #402

- 031 header: runbook path 031-tenants-rls.md -> 031-tenants_rls.md (underscore)
- DEC §D2 example GRANT: drop enrichment_spend_cents/_cap_cents to match the
  shipped migration (they were removed for portability; the DEC block was stale)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FK5vUSGnghZ5ty3NbXSENd

* fix(test): seed Supabase roles + auth.uid() so migration 031 applies in the AGE container

Migration 031 (tenants RLS) is the first migration to reference `authenticated`,
`anon`, and `auth.uid()` — all Supabase-provisioned in prod but absent from the
bare pgvector testcontainer, so the AGE global-setup crashed with
`role "authenticated" does not exist` (42704), which also produced the
"No test files found" symptom (setup threw before tests loaded).

Seed the three Supabase roles + a stub `auth.uid()` up front — before the
migration set — exactly as the harness already seeds pgcrypto/vector/btree_gist.
This is a bare-image parity shim; the prod migration is unchanged. auth.uid()
reads the Supabase JWT-sub GUC (NULL when unset) so RLS-behaviour tests can set
it explicitly.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CnfT3Lfoef2FrKnUob1kKB

* fix(test): include migration 031 in the down/up round-trip (mnemix_app dependency)

With migration 031 in the full applied set, the w1-functional round-trip failed:
031 creates `tenants_service_all ... FOR ALL TO mnemix_app`, so 014's
`DROP ROLE mnemix_app` (down) now errors — the role is still referenced by that
policy. This is exactly the case the test's own comment anticipates ("policies/
grants TO mnemix_app must be downed before 014").

Add 031 to the round-trip: downed FIRST (LIFO, highest number) so its
mnemix_app-dependent policy is gone before 014's DROP ROLE, and re-applied LAST
so mnemix_app exists again (recreated by 014 up) when tenants_service_all is
recreated. 031's down/up are self-contained on `tenants` (auth.uid()/roles are
seeded in global-setup), independent of the 012–022 objects the test asserts.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CnfT3Lfoef2FrKnUob1kKB

---------

Co-authored-by: Claude Fable 5 <noreply@anthropic.com>
Co-authored-by: claude[bot] <41898282+claude[bot]@users.noreply.github.com>

**Used by:** _(none yet — pending draft)_
