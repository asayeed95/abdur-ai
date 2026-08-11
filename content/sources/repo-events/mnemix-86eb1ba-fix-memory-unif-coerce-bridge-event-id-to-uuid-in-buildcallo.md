# mnemix 86eb1ba — fix(memory-unif): coerce bridge event_id to UUID in buildCallObserveJob (whole-pipeline) (#412)
**Receipts:** `git -C mnemix log -1 86eb1ba` (merged to main) — Abdur Rahman, 2026-07-07

PROD BUG (found by flipping ENABLE_MEMORY_UNIFICATION=1 and verifying live): the
calls/end bridge built the job with a RAW event_id "voice-call-<session>" and
relied on persistObserveIntake's sink-coercion. But the QStash worker
(/internal/observe/process) runs extractAndEmbedObserve + persistObserveMemories
on the job body DIRECTLY — it never calls persistObserveIntake — so the raw
event_id flowed into memory_observe_events.id / observe_event_id (uuid columns)
and the status flip, 22P02'ing downstream. Result: voice calls recorded at
ingested_raw but NEVER extracted → not recallable. The bridge caught nothing
(no throw), so it looked "live" while silently producing zero recallable memory.
Confirmed in prod: stuck ingested_raw events, control /v1/observe extracted fine,
no Sentry bridge error.

Fix: coerce event_id in buildCallObserveJob (now async) to a deterministic
tenant+session UUID — exactly like the /v1/observe route coerces before building
its job — so the WHOLE job (intake, extraction, memory persist, status flip,
QStash dedup id) carries one consistent UUID. The sink chokepoint in
persistObserveIntake stays as defense-in-depth (no-op now that both callers pass
UUIDs). callObserveEventId still returns the raw external key (the deterministic
coercion input).

- voice.ts: await buildCallObserveJob(...)
- tests: buildCallObserveJob async + event_id asserted as a UUID (not the raw
  string), deterministic per (tenant, session), job.event_id === observe.event_id

The flag was flipped back OFF (kill switch) the moment the break was verified;
re-flip only after this deploys and a live calls/end -> /v1/context recall passes.

tsc clean; voice+bridge+intake 45/45.


Claude-Session: https://claude.ai/code/session_01CnfT3Lfoef2FrKnUob1kKB

Co-authored-by: Claude Fable 5 <noreply@anthropic.com>

**Used by:** `posts/_drafts/the-flag-flip-that-recorded-nothing.mdx`.
