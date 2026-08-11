# dockerfile-ai #99 — /health probes the real DB dependency (commit 66078c1)
**Receipts:** /health previously returned "ok" unconditionally — a health check that cannot say no. Now probes the actual DB dependency. One-query patch.
**Used by:** `drafts/dockerfile-ai/2026-07-09-STARTER.md`.
