# dockerfile-ai abdf998 — feat(eval): EVAL-001 standing greenlight gate (the DEC-027 moat metric) (#39)
**Receipts:** `git -C dockerfile-ai log -1 abdf998` (merged to main) — Abdur Rahman, 2026-06-23

The golden success-rate gate the ultra-review flagged missing. Designed via a
judge-panel workflow; built + calibrated against real providers.

- SHA-pinned OFFLINE golden corpus (8 real Node/Python repos: express, prisma,
  turborepo monorepo, nest, fastapi, flask, requests, psycopg2) vendored via
  vendor-corpus.mjs; fixture-fetcher reads snapshots hermetically (RETRO: live
  github-fetcher has no subdir support + flakes on 60-req/hr).
- run-eval.mts: corpus x providers through the REAL generateFromUrl pipeline,
  4 strictly-nested honesty-guarded layers (generation, schema+structure, lint,
  build), K-sample MAJORITY for LLM jitter, infra/rate-limit retried+excluded
  (distinct from content fail), env-model drift guard, prod-switch dominance,
  --launch-gate. Supersedes eval-generation.mts.
- HONESTY (DEC-017): buildVerified read ONLY from verifyDockerfile (null =>
  SKIPPED-PENDING, never a pass); launch gate HONESTLY RED until BE-VERIFY-002;
  meta-check fails if buildLayerActive claimed without real builds.
- structure-checks.ts (typed, unit-tested): multi-stage/pinned(+distroless)/
  non-root/cache-order(+package*.json glob)/runtime-match/no-spurious-EXPOSE
  (library-only). thresholds.json externalizes all bars (data, not code).
- CI: eval-gate job (skips until GEMINI_API_KEY secret set); vitest.config excludes
  the corpus from test discovery; check-phase excludes corpus from doctrine greps.
- build-plan EVAL-001 task; CR to reconcile §165 HardenedBundle vs the flat schema.

Verified: 77 unit tests pass; gate runs end-to-end + bites; structure-check
false-negatives (EXPOSE, distroless, glob) found via live runs + fixed + unit-tested.
CALIBRATION-PENDING: hard bars are design targets; confirm against one clean K=3
baseline (free-tier daily quota exhausted today) before making CI a REQUIRED check.

Co-authored-by: Claude Opus 4.8 <noreply@anthropic.com>

**Used by:** _(none yet — pending draft)_
