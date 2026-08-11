# mnemix 8d31501 — feat(linear): make the webhook worth it for coding agents (#423)
**Receipts:** `git -C mnemix log -1 8d31501` (merged to main) — Abdur Rahman, 2026-07-09

* feat(linear): make the webhook worth it for coding agents

Closes the gap where the Linear webhook was live but low-value: 5 of 9
subscribed resourceTypes (IssueLabel/ProjectLabel/Attachment/ProjectUpdate/
IssueSLA) were silently dropped, there was no idempotency, and no active
health monitoring for the write-once signing secret.

- Handle every subscribed resourceType instead of silently dropping 4 of
  them; add a dedicated IssueSLA handler (its own envelope shape, verified
  against the installed @linear/sdk v86 type definitions, not guessed).
- Alert Telegram when a new Issue has neither delegate nor assignee (the
  ~10x recurring "stalls silently in Backlog" mistake) and when an SLA event
  fires on a delegate-owned (agent-routed) issue — the latter is IssueSLA's
  first consumer, unlocked by the 2026-07 Business plan upgrade.
- Add delivery idempotency (Redis SETNX keyed on type+action+entityId+
  timestamp, since neither envelope carries a dedicated delivery id) so a
  Linear redelivery can't double-fire an alert.
- Add an hourly cron + GET /webhooks/linear/health that actively compares
  prod's LINEAR_WEBHOOK_SECRET against Linear's live config and flags
  drift/disabled/stale-delivery, instead of waiting for a delivery to fail
  and land in Linear's own (previously unmonitored) delivery-failure log.
- Extract the duplicated Telegram-alert fetch (cost-governor.ts,
  qdrant-capacity.ts) into src/utils/telegram.ts now that a third call site
  needs it.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FsUESz3VU2EutS2Tv3pYAa

* fix: address CodeRabbit BLOCK items on PR #423

Applied fixes:
- Extend dedup TTL 600s -> 7h. Linear's real retry backoff is 1min/1h/6h
  (linear.app/developers/webhooks); the old TTL expired before the 1h and 6h
  retries, letting them bypass dedup and re-fire alerts.
- Add Sentry.captureException to the three Redis fail-open catch blocks in
  cache.ts's webhook bookkeeping — this subsystem's entire job is
  observability, so a persistent Redis outage there must not go unnoticed.
- Fix a real ordering bug CodeRabbit's review surfaced while checking its
  test-coverage suggestion: the route claimed the dedup key BEFORE calling
  dispatchWebhook, so a genuine handler throw (which 500s specifically so
  Linear retries) would have its own retry misclassified as a duplicate and
  silently dropped. Added releaseLinearWebhookDelivery, called in the route's
  catch block.
- Add a 10s AbortSignal timeout to the Linear GraphQL health-check fetch.
- Harden the secret-drift check: a falsy `secret` from Linear is now reported
  as "cannot verify" rather than the more specific (and here false) "drifted".
- Make handleIssue's delegate/assignee detection read both the flat *Id field
  and the nested object's .id, instead of only the flat field.

Two Major findings verified and NOT applied, with evidence in the PR reply:
- "webhooks.nodes.secret can't be used for drift detection" — contradicted by
  a live round-trip this session: fetched the secret via GraphQL with our
  personal LINEAR_API_KEY, used it to HMAC-sign a synthetic delivery, and
  prod accepted it. CodeRabbit's citations describe OAuth-app-scoped access,
  not a full-access personal key.
- "delegateId/assigneeId are nested objects, not flat fields" — the installed
  @linear/sdk v86.0.0 IssueWebhookPayload type declares both the flat *Id
  field and the expanded object simultaneously (standard for its GraphQL
  codegen). Hardened to read both anyway (see handler.ts change above) since
  the only verification was against synthetic test payloads.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FsUESz3VU2EutS2Tv3pYAa

* fix: address PR #423 review findings — Linear-Delivery dedup + non-blocking alerts

Two items were still genuinely outstanding after the earlier CodeRabbit-fix
commit (fd15932): the dedup key ignored Linear's own Linear-Delivery UUID
header (verified against linear.app/developers/webhooks) in favor of a
synthetic type/action/entityId/timestamp key, and Telegram alerts were awaited
before acking Linear, risking its 5s timeout and re-firing alerts on retry.
Both fixed; Telegram dispatch now runs via executionCtx.waitUntil.

TTL extension, Sentry capture on Redis bookkeeping, the GraphQL fetch timeout,
and nested delegate/assignee reads were already shipped in fd15932 — no
change needed. The secret-drift removal ask is not applied: fd15932 already
recorded an empirical counter-verification (fetched secret used to HMAC-sign
a synthetic delivery, accepted by prod) and hardened the one real false-positive
risk (a falsy secret now reports "cannot verify", not "drifted"). Duplicate-
delivery handled:true, the unauthenticated health endpoint, and the no-alert
on a never-seen-but-configured webhook are left as documented decisions inline
(no consumer reads the first, no shared-secret convention exists for the
second, and the third needs a webhook creation timestamp not currently
fetched) rather than fixed, per this review round's own escape hatches.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YbTsArt7mhutySQcUUVfgk

* fix(linear): bound webhook bookkeeping and sanitize alerts

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011pbESUrtkvsMjZd54gAE6H

* fix: address CodeRabbit BLOCK items on PR #423

- dispatchTelegramAlerts: report per-alert send failures to Sentry
  (service: linear-webhook, op: telegram-alert), matching the
  bookkeeping error-reporting pattern in src/services/cache.ts;
  warn log kept as secondary context.
- linear-webhook.test.ts: 'reports last_seen after a delivery lands'
  now captures waitUntil promises and awaits them before asserting
  on /health, removing the microtask-ordering dependency.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

* fix(linear): address CodeRabbit review on PR #423 (Sentry visibility on Telegram send failures)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011pbESUrtkvsMjZd54gAE6H

---------

Co-authored-by: Claude Sonnet 5 <noreply@anthropic.com>
Co-authored-by: claude[bot] <41898282+claude[bot]@users.noreply.github.com>

**Used by:** _(none yet — pending draft)_
