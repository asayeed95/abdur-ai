# mnemix migration incident — HNSW backfill client-timeout that committed server-side
**Receipts:** full-table UPDATE on the live HNSW-indexed memory table timed out the client but kept running and committed on the server; naive retry = same rewrite twice concurrently. Fix: split ADD COLUMN / batched backfill / CREATE INDEX into three transactions; check pg_stat_activity before any retry.
**Used by:** `drafts/mnemix/2026-07-09-STARTER.md`.
