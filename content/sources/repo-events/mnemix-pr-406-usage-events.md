# mnemix PR #406 — usage_events metering ledger (merged 2026-07-09, commit 21326b0)
**Receipts:** counting-only, flag-gated ledger. Append-only enforced twice: RLS + role-aware trigger blocking UPDATE/DELETE. Review caught the enrichment meter double-counting cache hits as live Trestle/Twilio calls → `!cacheHit` guard. Best-effort: metering failure never breaks a request.
**Used by:** 2026-07-09 brain draft (approval slug `2026-07-09-mnemix-metering-ledger`), carousel C2.
