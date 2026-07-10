# Mnemix carousel batch 01 — IG/FB (Signal Noir)

> **DO NOT MASS-PRODUCE.** Build the first 1–2 designs, get founder approval on the look, then batch the rest. This file is briefs, not a green light.

System: Signal Noir (`../mnemix-design-system.md`). Template: `../higgsfield-prompts/carousel-card.md`. Account: IG `@mnemix.ai` (Blotato 48493). Every carousel supports a named angle; captions end with the exact closer + mnemix.ai.

---

## C1 — "Serial tests lie" (angle: race conditions / recall collapse)
**Supports:** `mnemix:docs/marketing/LAUNCH-PACK-pillar2-concurrency-race.md` (staged, mnemix PR #426; receipt = PR #253 / commit cc3ac469). 4 cards:
1. `100% recall in tests.` / `~20% in production.` — big Geist Mono numbers, cyan on #09090b. *Visual: two stat panels, second one dimmed/broken.*
2. `Zero errors. Every request returned 200.` — the silent-failure card. *Visual: a row of green 200s, rose #fb7185 hairline underneath.*
3. `The race: N concurrent calls, N entities, one identifier row. Last writer wins.` *Visual: simple diagram — many nodes collapsing into one row, orphans faded.*
4. `The fix: INSERT … ON CONFLICT DO UPDATE … RETURNING entity_id.` + closer. *Visual: single code line, cyan accent.*
**Caption:** the pillar-2 caption (already approved in the launch pack).

## C2 — "Count before you charge" (angle: build discipline / audit trails)
**Supports:** the 2026-07-09 metering-ledger draft in #mnemix-content (Daily Content Brain; receipt = mnemix PR #406 `usage_events`). Slug on approval: `2026-07-09-mnemix-metering-ledger`.
1. `It counts every recall. It charges nobody. On purpose.`
2. `Append-only ≠ RLS alone. A future migration can silently un-protect the table.` *Visual: one gate icon → two gate icons.*
3. `Second gate: a role-aware trigger blocks UPDATE/DELETE regardless of RLS.`
4. `Bug caught in review: cache hits billed as vendor calls. Gate on !cacheHit.` + closer.
**Caption:** condensed LinkedIn variant from the metering draft.

## C3 — "Your agent forgets everyone" (angle: agent memory failures — evergreen)
**Supports:** follow-on to `mnemix:docs/marketing/LAUNCH-PACK-pillar1-voice-has-no-cookies.md` (published 2026-07-08/09: X 2074843614056751191, LinkedIn 7480623481857101824) — new framing required, NOT a repeat of the pillar-1 text.
1. `Every call is a stranger. Voice has no cookies.`
2. `Your CRM knows them. Your agent doesn't. The context lives in silos the call can't reach.`
3. `One call before every interaction: who is this, what matters.` *Visual: NeuralSphere with one highlighted node.*
4. Closer card.
**Caption:** fresh copy required at queue time (dedup vs pillar-1 posted text).

---

Pre-flight per carousel: locks clean (no invented numbers/vendors/prices) · banned-phrases lint · founder approval on cards 1–2 of C1 before batching C2/C3.
