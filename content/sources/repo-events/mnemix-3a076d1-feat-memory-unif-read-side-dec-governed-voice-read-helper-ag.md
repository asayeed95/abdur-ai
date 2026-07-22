# mnemix 3a076d1 — feat(memory-unif): read-side DEC + governed voice-read helper (AGE-288, 1/2) (#430)
**Receipts:** `git -C mnemix log -1 3a076d1` (merged to main) — Abdur Rahman, 2026-07-11

* feat(memory-unif): read-side DEC + governed voice-read helper (AGE-288, part 1/2)

Phase 2 of memory unification: the READ side — /v1/recall_and_enrich surfaces
governed memory so a voice agent sees what chat/CLI agents taught Mnemix.

DEC-MEMORY-UNIFICATION-READSIDE locks the design. The load-bearing finding:
the Phase-2 deferral assumed Voyage query-embedding in the <300ms hot path,
but RecallAndEnrichRequestSchema carries NO query text — so there is nothing
to embed and no vector search to run. The read is two single-digit-ms indexed
SQL queries (phone → entity_identifiers, entity → top-N ACTIVE structured
memory_objects under idx_memory_objects_tenant_entity_live).

- voice-read.ts: findEntityIdByPhone + getGovernedFactsForEntity +
  getGovernedVoiceFacts. Active-window idiom matches /v1/context exactly
  (superseded + bi-temporal validity), minus the embedding_vec filter (vector-
  search-only; would hide facts persisted during an embedder outage). Verbatim
  excluded by design. Budget-agnostic module: the route wraps it in a hard
  50ms budget + fail-open (part 2/2, Codex — route wiring, flag, cache, bench).
- tests: 6 covering the exact SQL idioms, unknown-caller short-circuit, limits.

Part 2/2 (Codex): wire into /v1/recall_and_enrich behind
ENABLE_MEMORY_UNIFICATION_READ (default OFF), additive memory.facts field,
50ms race + fail-open, optional Redis cache, flag-off byte-identical tests.

tsc clean; voice-read tests 6/6.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01CnfT3Lfoef2FrKnUob1kKB

* fix: address CodeRabbit BLOCK items on PR #430

Spell out the exact deleted/revoked/expired suppression contract in
DEC-MEMORY-UNIFICATION-READSIDE §D1 (deletion is physical via
deleteEntityCascade; revocation = supersession/valid_to closure; RLS per
migration 009), and close the expiry→sweep window by adding the
expires_at guard to the governed voice-read predicate + test.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

* fix: address CodeRabbit BLOCK items on PR #430

- Drop the unverified 'single-digit-ms' benchmark claim from the DEC and
  the voice-read module header; state the 50ms in-route acceptance budget
  (§D3) instead, per the no-invented-benchmarks guideline.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---------

Co-authored-by: Claude Fable 5 <noreply@anthropic.com>
Co-authored-by: claude[bot] <41898282+claude[bot]@users.noreply.github.com>

**Used by:** _(none yet — pending draft)_
