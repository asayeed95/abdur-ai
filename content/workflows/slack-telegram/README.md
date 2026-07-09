# Slack / Telegram — the human gate

Slack and Telegram own **human approval, veto, edits, failure alerts, daily summaries, and publish confirmations.** Nothing goes live without passing through here. This is the safety valve that makes "automated generation" safe: we automate the *drafting*, never the *publishing decision*.

## Channels

| Surface | Use | Where |
|---|---|---|
| Slack `#mnemix-content` (`C0BAMF2P4L8`) | Mnemix draft approval | founder + agents |
| Slack `#abdur-content` *(create if missing)* | abdur.ai + dockerfile.ai + heycli + mnemix-learning draft approval | founder + agents |
| Telegram (founder DM, `@claudeismental_bot`) | mirror of approvals + failure alerts + daily summary + publish confirmations | founder only, outbound |

> If `#abdur-content` doesn't exist yet, drafts for non-Mnemix projects route to `#mnemix-content` with a `[project]` tag until the channel is created (see STATUS.md).

## The draft message format (what the brain posts)

Every draft posted for review has:
1. **One-line angle summary** + proposed fire time.
2. **Human-readable** X + LinkedIn (or blog) variants, with char counts on tweets.
3. A fenced ` ```json ` block: `{ "x_text", "x_thread": [...], "linkedin_text" }` (+ `account`, `project`, `source`).
4. The action line: **`APPROVE (reply APPROVED: + the json) · EDIT (reply with changes) · SKIP (reply SKIP)`.**

The json block is the machine contract — the scheduler parses it. Keep the shape stable.

## The approval contract (how a human acts)

| Reply | Meaning | What the scheduler does |
|---|---|---|
| `APPROVED:` + the json block | ship it | parse json → schedule via Blotato for the veto window → append `scheduled.jsonl` |
| `EDIT: <changes>` or an edited json | change then ship | apply edits, re-post for a final confirm, then schedule |
| `SKIP` (optionally `SKIP: <reason>`) | kill this draft | append `rejected.jsonl` with the reason; never regenerate this angle |

A draft with **no reply within the veto window does NOT auto-publish.** Silence = hold. (Publishing only ever happens from an explicit `APPROVED:`.)

## Alerts the founder gets on Telegram

- **Scheduled:** "🕘 Queued for tomorrow AM — X {id}, LinkedIn {id}. Delete in Blotato before fire to veto."
- **Published:** "✅ Posted: {permalink}."
- **Failure:** "⚠️ Blotato schedule failed for {id}: {error}. Nothing queued." (retry policy in `../pipedream/`)
- **Buffer empty:** "⚠️ Content buffer empty for next 48h — hand-queue one." (the guaranteed-daily backstop)
- **Daily summary (evening):** what posted today, what's queued for tomorrow, what's awaiting approval, per project + per account. This is the audit visibility.

## Reddit / HN (guided, human-fired)

When a draft includes a Reddit or HN idea, the brain posts a **ready-to-post packet** to Slack — subreddit or "Show HN" framing, title, body, best time window, seed comment — clearly labeled **human-fire-only**. The scheduler never touches it. A human posts it and stays in the thread. Cap ≤1 each/day.

## Guarantees this layer enforces

- Mnemix appears **every day** via `@mnemix_official` — if no Mnemix post is queued for tomorrow by the evening summary, the summary flags it RED.
- abdur.ai is **equal priority** — the same daily check applies to `@abdur_sayeed`.
- No secret ever appears in a Slack/Telegram message (keys, webhook URLs, tokens are forbidden in draft bodies).
