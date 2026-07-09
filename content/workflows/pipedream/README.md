# Pipedream — the orchestration layer

Pipedream is the **durable backbone**: cron schedules, webhooks, approval routing, retries, and calling Blotato. It is cloud-hosted, so nothing depends on a laptop being awake. This is the long-term home for orchestration — Pi5/Mac-mini are used only where local repo/filesystem/secret access is genuinely required (see the architecture principle in `../../README.md`).

## Why Pipedream owns orchestration (not Pi5)

- Cron/timer triggers on all tiers; unlimited workflow steps; arbitrary code steps (Node/Python/Go/Bash); 3000+ integrations.
- Already runs `x-publisher` and `x-engage` for us — this extends that pattern.
- **Cost note:** the FREE tier does NOT cover a multi-account daily system (verified refuted). Budget a **paid** tier. Until it's provisioned, the **Pi5 interim hands** (`content/workflows/` sibling; Pi5 cron) carry scheduling. Pi5 is the interim, Pipedream is the target.

## Secrets (Pipedream workspace env vars)

`BLOTATO_API_KEY`, `TELEGRAM_BOT_TOKEN`, `X_FOUNDER_*` (already present). Stored as workspace env vars, referenced as `{{env.NAME}}`. Never in code, never in a draft.

## The two workflows to build

Both follow: **cron → read approved draft from Slack → schedule via Blotato → notify Telegram → update ledger.** One per approval channel/account set.

### Workflow 1 — `mnemix-daily-content-hands`
Paste into the Pipedream AI builder:
```
Build a scheduled workflow "mnemix-daily-content-hands".
TRIGGER: cron daily 12:30 UTC (08:30 ET).
STEP 1 (Slack): read the most recent message in #mnemix-content starting with "APPROVED:". If none in the last 18h, STOP (buffer covers today). Parse the json into {x_text, x_thread[], linkedin_text}.
STEP 2 (Blotato X): POST https://backend.blotato.com/v2/posts, header blotato-api-key {{env.BLOTATO_API_KEY}}, accountId "18856", target.targetType "twitter", content.platform "twitter", content.mediaUrls [], additionalPosts = each thread tweet as {text, mediaUrls:[]}, scheduledTime tomorrow 13:07 UTC. Capture postSubmissionId.
STEP 3 (Blotato LinkedIn): same, accountId "21401", targetType "linkedin", platform "linkedin", scheduledTime tomorrow 14:07 UTC.
STEP 4 (Telegram): notify {{env.TELEGRAM_BOT_TOKEN}} founder chat: "🕘 Mnemix queued — X {step2.id}, LinkedIn {step3.id}. Delete in Blotato before fire to veto."
STEP 5 (buffer monitor): GET /v2/schedules?limit=50. If nothing for @mnemix_official in next 48h, Telegram RED: "⚠️ Mnemix buffer empty next 48h."
NEVER post to Reddit/HN. NEVER post immediately — always future scheduledTime (veto window).
```

### Workflow 2 — `abdur-daily-content-hands`
Same as above but: STEP 1 reads `#abdur-content`; STEP 2 uses X accountId `20072` (`@abdur_sayeed`); STEP 3 LinkedIn `21401`; buffer monitor checks `@abdur_sayeed`. Fire times can differ (e.g. X 15:07 UTC) so abdur.ai and Mnemix don't post the same minute.

## Retry & failure policy

- Blotato call fails → retry 2× with backoff; on final failure, Telegram the founder "⚠️ schedule failed for {project}: {error}. Nothing queued." and append nothing to `scheduled.jsonl` (so the buffer monitor catches the gap).
- Never silently swallow a failure — a fire-and-forget catch here would hide a missed posting day.

## Migration from Pi5 → Pipedream

When the paid Pipedream tier is live and both workflows are verified end-to-end (a real APPROVED: draft → scheduled in Blotato → Telegram received), **disable the Pi5 interim scheduler cron** so only one hand schedules. Until then, run exactly one of them to avoid double-scheduling (the ledger `id` dedup is the backstop, but don't rely on it — pick one active scheduler).

## What Pipedream does NOT own

- Draft generation (that's the Mac-mini/cloud brains — they need repo access).
- The approval decision (that's the human in Slack/Telegram).
- Reddit/HN posting (human-fired).
