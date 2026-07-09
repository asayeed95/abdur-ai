# Blotato — the publishing hand

Blotato owns the **final scheduling and publishing** to social platforms (X, LinkedIn, IG, and more). Nothing in this OS posts to a platform directly; it hands an approved draft to Blotato with a future `scheduledTime`, which *is* the founder veto window (deletable until it fires).

> The Blotato MCP flaps. Use the **REST API** directly. It is verified live.

## Auth & base

- Base: `https://backend.blotato.com`
- Header: `blotato-api-key: <BLOTATO_API_KEY>` — key lives in Doppler `asec-production/prd_asec_collections`. **Never commit it, never put it in a draft, never log it.**

## Accounts (Blotato account ids — re-verify before a run)

| Account | Platform | id |
|---|---|---|
| `@abdur_sayeed` (personal/founder) | twitter | **20072** |
| `@mnemix_official` (project) | twitter | **18856** |
| Abdur | linkedin | **21401** |
| mnemix.ai | instagram | **48493** |
| asayeed95 | instagram | **48492** |

Re-verify anytime with `GET /v2/users/me/accounts`. (Older notes said X=18339 — that's STALE; 20072 is current.)

## Create a scheduled post

`POST /v2/posts`
```json
{
  "post": {
    "accountId": "18856",
    "target": { "targetType": "twitter" },
    "content": { "text": "…", "platform": "twitter", "mediaUrls": [] }
  },
  "scheduledTime": "2026-07-10T13:07:00Z"
}
```
→ `201 { "postSubmissionId": "…" }`. Keep the id — it's the veto handle.

**X threads:** put follow-up tweets in `content.additionalPosts`, and `mediaUrls: []` is **REQUIRED on every item** (the validator 400s if you omit it):
```json
"content": {
  "text": "1/ …", "platform": "twitter", "mediaUrls": [],
  "additionalPosts": [
    { "text": "2/ …", "mediaUrls": [] },
    { "text": "3/ …", "mediaUrls": [] }
  ]
}
```

**LinkedIn:** same call, `accountId: "21401"`, `target.targetType: "linkedin"`, `content.platform: "linkedin"`.

## Media (images/video for carousels + X images)

`POST /v2/media` with a base64 data URL — no public hosting needed:
```json
{ "url": "data:image/png;base64,<b64>" }
```
→ `201 { "url": "<blotato-cdn-url>" }`. Put that url in `content.mediaUrls`. Tested to ~20MB (`data:video/mp4;base64,…`).

## The veto window (schedule → review → fire-or-delete)

1. Schedule for **next morning** (e.g. 09:07 ET). The gap is the veto window.
2. Telegram/Slack the founder the `postSubmissionId` + fire time + "delete before fire to veto."
3. List queued: `GET /v2/schedules?limit=50` — each item has `id` (== `postSubmissionId`), `scheduledAt`, `account{id,username}`, full `draft`.
4. **Veto (delete):** `DELETE /v2/schedules/{id}` → 204.
5. **Reschedule/edit:** `PATCH /v2/schedules/{id}` body `{"patch":{"scheduledTime":"<future ISO>","draft":{…FULL draft…}}}` → 204. Must resend the entire draft object; `scheduledTime` must stay in the future.

> `GET /v2/schedules` is the only place `accountId` is exposed. `GET /v2/posts` returns only `{postSubmissionId,status}` — don't use it for queue inspection.

## Ledger coupling

- On schedule → append a `scheduled` line to `../../ledger/scheduled.jsonl` with `blotato_id`.
- On confirmed fire → append a `posted` line to `../../ledger/posted.jsonl` with the `permalink`.
- On veto → append a `rejected` line with `reason: "founder-veto"`.

## What Blotato does NOT do

- No replies/comments (that's the separate X-engage system).
- No Reddit/HN posting from this OS (human-fired only).
- It publishes; it does not decide. Approval happens upstream (Slack/Telegram) before anything reaches Blotato.
