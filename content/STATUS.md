# STATUS — what's wired now vs what needs a secret / API / your call

Updated 2026-07-09. This is the honest state. Green = works today. Yellow = needs a human decision. Red = needs secrets/wiring before it runs.

## 🟢 Implemented and verified now

- **The content OS itself** — this whole `content/` tree: README, voice rules (+ banned-phrases lint list), ledger schema + dedup rules, workflow specs (Pipedream/Blotato/Slack-Telegram), routines, design systems + briefs, starter drafts. Committed to abdur-ai.
- **Mnemix Daily Content Brain** — cloud routine `trig_01EHoBCKX68iahC8hcGeiGvk`, daily **08:06 ET**. Reads locks + pillars + `git log`, dedups against `#mnemix-content`, drafts a locks-clean X thread + LinkedIn, posts to `#mnemix-content` for `APPROVE·EDIT·SKIP`. **Publishes nothing.** Verified: it produced a real, on-voice, char-verified draft on first run.
- **abdur.ai Daily Content Brain** — sibling cloud routine (created this session), daily. Drafts `@abdur_sayeed` operator-diary + TLDR/blog to Slack for approval. Publishes nothing.
- **Blotato REST publishing path** — verified live (accounts, thread shape, schedule/delete = veto window). Documented in `workflows/blotato/`.
- **Distribution blueprint** — mnemix repo PR #428 (`docs/marketing/CONTENT-AUTOMATION-BLUEPRINT.md`).

## 🟡 Needs your decision / approval

- **The "hands" (scheduler).** Decided: **B2 Pi5 interim tonight**, **B1 Pipedream durable target.** Pi5 cron is being wired (see 🔴). Pipedream workflows are spec'd + paste-ready in `workflows/pipedream/` but need the paid tier.
- **Paid Pipedream tier.** Free tier is refuted for this load. You provision it, then paste the two builder prompts.
- **`#abdur-content` Slack channel.** Doesn't exist yet — abdur.ai/dockerfile/heycli/mnemix-learning drafts route to `#mnemix-content` with a `[project]` tag until you create it.
- **Design batches.** Carousel/image/motion briefs are written, but **no mass production** until you approve the first 1–2 designs (the design gate).
- **Reddit / HN.** No auto-posting, ever, without your explicit approval of a specific manual/public-launch workflow. Guided drafts only.

## 🔴 Needs secrets / wiring before it runs

- **Pi5 interim hands cron** (task in flight). Reads `APPROVED:` drafts from Slack → schedules via Blotato → Telegrams fire times → writes `scheduled.jsonl`. Needs the Slack read token + `BLOTATO_API_KEY` + Telegram token (all already in Pi5's Doppler); the cron code + install is the remaining work.
- **Pipedream workflows 1 + 2.** Builder prompts ready; need the paid tier + a paste-build, and the workspace env vars (`BLOTATO_API_KEY`, `TELEGRAM_BOT_TOKEN`).
- **Ledger backfill.** The already-published pillar-1 "voice has no cookies" posts should be added as `posted.jsonl` lines so the dedup corpus reflects reality.
- **Cloud → hands handoff.** The brains draft to Slack (no local secrets in cloud); the hands (Pi5 now, Pipedream later) are what actually schedule. Until a hands lane runs, an approved draft must be hand-pushed to Blotato.

## The end-to-end, once the hands are live

```
brain (cloud, daily) → draft to Slack → you: APPROVE → hands (Pi5→Pipedream) →
Blotato schedule (veto window) → Telegram fire time → fires → ledger + permalink
```

Every box above the "hands" is 🟢 today. The hands are the last wire.
