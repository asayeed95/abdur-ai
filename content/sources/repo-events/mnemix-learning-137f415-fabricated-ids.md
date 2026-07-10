# mnemix-learning 137f415 — compute-don't-emit scar ids (11 fabricated ids corrected)
**Receipts:** audit found 11 RETRO scar entries with fabricated hash ids — agents emitted id-shaped strings that were never the sha256 of anything, in the ledger whose job is honesty. Fix: ids computed by a script from scar content; the model can't write the field (P-018).
**Used by:** `drafts/mnemix-learning/2026-07-09-STARTER.md`.
