# dockerfile-ai ef70551 — feat(generation): Vertex AI prod provider (@ai-sdk/google-vertex) (#37)
**Receipts:** `git -C dockerfile-ai log -1 ef70551` (merged to main) — Abdur Rahman, 2026-06-23

createVertexProvider() behind the same LlmProvider seam — the PROD path
(aiplatform.googleapis.com, GCP project + ADC/service-account), distinct from the
free AI-Studio dev provider. D4 timeout; auth via google-auth-library (no key read
or stored by this code).

PROVEN LIVE: Vertex gemini-2.5-pro on dockerfile-ai-500312 (billing on, ADC) ->
3/3 heuristic pass (multi-stage, pinned, non-root, cached) on node/python/native.
Eval harness includes vertex when GOOGLE_VERTEX_PROJECT/GOOGLE_CLOUD_PROJECT set;
gated integration test added. gemini-3.x is GA on Vertex and may be the better prod
default — pick from Wave-6 benchmark data, not locked here.

tsc clean; 58 unit tests pass. env.example: GOOGLE_VERTEX_PROJECT/LOCATION + VERTEX_MODEL.

Co-authored-by: Claude Opus 4.8 <noreply@anthropic.com>

**Used by:** _(none yet — pending draft)_
