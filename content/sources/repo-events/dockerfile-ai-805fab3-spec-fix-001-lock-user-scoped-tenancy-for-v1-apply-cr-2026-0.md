# dockerfile-ai 805fab3 — SPEC-FIX-001: lock user-scoped tenancy for v1 (apply CR 2026-06-22 Option A) (#46)
**Receipts:** `git -C dockerfile-ai log -1 805fab3` (merged to main) — Abdur Rahman, 2026-07-02

Strip org-scoped tenancy from the v1 contract surface; user_id only.
- api-contract.md: generate idempotency key = (user_id, manifest_hash); drop
  org billing meter / org-scope auth / Pro-Team & workspace-org downgrade;
  add v1 tenancy note; Team tier marked DEFERRED (v2).
- events.md: subscription.*/starter_pack payloads carry userId (was orgId);
  tier enum "pro" only (team deferred); SSE auth user-scoped; tenancy note.
- subsystems.md: billing_tier=user plan; drop org_id input; Check/Update
  User (was Org); App builds use user credit registry; tenancy note.
- CR status -> RESOLVED; SPEC-FIX-001 status -> done (same commit).

Gates: validate-build-plan.mjs exit 0; check-phase.sh 3 --hard exit 0.

Co-authored-by: Claude Fable 5 <noreply@anthropic.com>

**Used by:** _(none yet — pending draft)_
