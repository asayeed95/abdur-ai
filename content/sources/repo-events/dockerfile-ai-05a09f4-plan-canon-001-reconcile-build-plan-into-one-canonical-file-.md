# dockerfile-ai 05a09f4 — PLAN-CANON-001: reconcile build-plan into one canonical file + add wave rows (status fields) (#43)
**Receipts:** `git -C dockerfile-ai log -1 05a09f4` (merged to main) — Abdur Rahman, 2026-07-02

Reconciles the 3 divergent build-plan copies (origin/main base + BE-VERIFY-002 from be-verify-002-provider + FE-*-001 statuses from fe-phase5-web) into one canonical file, adds an honest bare status field to every row, and adds all wave rows from the path-to-paid-launch + launch-readiness-critic plans (48 tasks total).

Honest status mapping: SPEC/IA/DB/CONTRACT + 6 BE-* + EVAL-001 = done (files verified present on this branch); BE-HTTP-001/BE-WORKER-001 = in-progress (WIP on backend/http-realtime-worker-wip); 5 FE-*-001 = review (PR pending); BE-VERIFY-002 = review NOT done — its code/test outputs live on PR #42, not on main (status-honesty).

Plan-doc IDs adapted to the id regex ^[A-Z][A-Z0-9-]*-[0-9]{3}$: SECURE-SPEND-001a/b -> 001/002, GROWTH-001a/b -> 001/002, SEC-REVIEW-42 -> SEC-REVIEW-001. Founder decisions FD-1/2/3 are not tasks -> folded into acceptance/notes, never depends-on. ENGINE-FIX-001 re-tagged phase 3 -> 4 (server code).

OUT-OF-LANE (flagged for review): fixed an identical case-insensitive /TODO/i false-positive in scripts/validate-build-plan.mjs, scripts/validate-phase-constraints.mjs, and scripts/build-plan-to-json.mjs. These three CI judges rejected the PROCESS.md:220-sanctioned bare status value 'todo' (case-insensitive match on the lowercase token). Fix makes TODO/TBD markers case-SENSITIVE (uppercase) so real template boilerplate is still caught while the legitimate lowercase status validates. No honesty enforcement weakened. Necessary because adding the status vocabulary is impossible to validate otherwise.

Gates: node scripts/validate-build-plan.mjs PASS; ./scripts/check-phase.sh 3 --hard PASS (status-honesty green); validate-phase-constraints PASS; markdownlint PASS; conftest OPA 30/30 PASS.

Co-authored-by: Claude Fable 5 <noreply@anthropic.com>

**Used by:** _(none yet — pending draft)_
