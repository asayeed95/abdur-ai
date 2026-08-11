# mnemix PR #253 — resolveEntity scatter-race fix (commit cc3ac469, 2026-06-16)
**Receipts:** concurrent first-contact bursts (25 calls, same new caller) collapsed recall to ~20% with zero errors — every request 200. Read-then-write minted N entities; trailing upserts fought one identifier row, last-writer-wins, orphaning the rest. Fix: atomic `INSERT … ON CONFLICT DO UPDATE … RETURNING entity_id`. Numbers are from OUR OWN testing of OUR OWN bug.
**Used by:** pillar-2 launch pack (`mnemix:docs/marketing/LAUNCH-PACK-pillar2-concurrency-race.md`, PR #426), carousel C1, X-image X2.
