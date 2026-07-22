# mnemix 6dcc316 — fix(linear): bound webhook Redis retries on /health + retry-stability comment fix (post-#423 follow-up) (#431)
**Receipts:** `git -C mnemix log -1 6dcc316` (merged to main) — Abdur Rahman, 2026-07-11

* fix(linear): bound webhook Redis retries

* fix(linear): restore per-request Redis timeout via signal FACTORY

Codex's review on PR #431 surfaced the piece both prior designs missed:
@upstash/redis accepts `signal: () => AbortSignal.timeout(ms)` — a factory the
requester invokes PER REQUEST (verified in the installed SDK:
error-8y4qG0W2.d.mts:132 types `AbortSignal | (() => AbortSignal)`; the
requester branches on `typeof signal === "function"` and calls it per command).

That dissolves the tradeoff the previous two implementations were stuck on:
- the original static `AbortSignal.timeout()` was a shared creation-anchored
  fuse — it bounded nothing per-call and aborted late post-ack bookkeeping
  writes on slow requests (why it was removed);
- the retry-only replacement fixed the fuse footgun but left a silently-hung
  request able to stall the awaited claim past Linear's 5s deadline.

The factory form gives per-command bounding with zero fuse sharing: awaited
claim worst case = 2 attempts × 1.5s + 150ms ≈ 3.15s, and each detached
bookkeeping write gets its own fresh fuse. Config regression tests now assert
the signal is a function producing a fresh, non-aborted AbortSignal.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YbTsArt7mhutySQcUUVfgk

* fix(linear): only a null SETNX reply may classify a delivery as duplicate

Codex's handoff review surfaced a real hazard in the merged #423 code: when a
STATIC AbortSignal fires mid-request, @upstash/redis does not throw — it
fabricates a synthetic 200 Response whose result is "Aborted"
(chunk-IH7W44G6.mjs: `else if (requestOptions.signal?.aborted)` branch). Under
`result === 'OK'`, that resolution read as "duplicate" and a legitimate first
delivery was silently dropped — fail-CLOSED on timeout, the worst mode for a
webhook whose whole design is fail-open.

The signal-FACTORY form this PR uses is immune (the SDK's factory branch
`throw error_` lands in the fail-open catch), but the classification logic
shouldn't depend on which signal form is configured: only null — SETNX's one
legitimate key-exists reply — may classify a delivery as a duplicate. Any
other non-OK reply is an indeterminate write: fail open and Sentry it.
Regression test pins the "Aborted"-resolution case to fail-open.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YbTsArt7mhutySQcUUVfgk

---------

Co-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>

**Used by:** `content/posts/_drafts/the-health-check-that-became-a-retry-storm.mdx`
