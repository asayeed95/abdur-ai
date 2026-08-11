# Daily posting routine (master loop)

Runs every morning. Produces at least one approved post per priority account. This is the loop the cloud brains + the Pi5/Pipedream hands execute together.

## Steps

1. **Capture / refresh sources.** Pull the latest real work into `../sources/`: recent commits & PR titles (`repo-events/`), any new screenshots, TLDRs, transcripts, research notes. Every post that follows must cite one.
2. **Dedupe.** For each target project, run the dedup check (`../ledger/README.md`): read `posted.jsonl` + `scheduled.jsonl`, skim `rejected.jsonl`. Don't re-pitch a live or vetoed angle.
3. **Draft in voice.** Write to `../drafts/<project>/` (social) or `../posts/_drafts/` (abdur.ai blog). Obey `../voice/`. Cite a source in frontmatter. Count tweet chars (≤280).
4. **Send for approval.** Post the draft to the project's Slack channel with the `APPROVE · EDIT · SKIP` format (`../workflows/slack-telegram/`). Mirror to Telegram.
5. **On APPROVED:** move the draft to `../approved/<project>/`, hand the json to the scheduler (Pipedream, or Pi5 interim), which schedules via Blotato for the veto window and appends `scheduled.jsonl`.
6. **On fire:** the scheduler moves it to `../published/<project>/`, appends `posted.jsonl`, and Telegrams the permalink.
7. **Evening summary.** Post the daily audit to Telegram: what posted, what's queued for tomorrow, what's awaiting approval — per account. **If `@mnemix_official` or `@abdur_sayeed` has nothing queued for the next 48h, flag RED** and hand-queue one.

## Priority accounts (both, every day)

- `@mnemix_official` — Mnemix must appear daily.
- `@abdur_sayeed` — abdur.ai / operator diary, equal priority.

## Reddit / HN

If a draft has a Reddit/HN angle, produce a **guided packet** into Slack (sub/Show-HN framing, title, body, timing, seed comment), labeled human-fire-only. Never auto-post. ≤1 each/day.

## The one rule that makes it "guaranteed daily"

Keep the X/LinkedIn buffer ≥2 days deep. Draft ahead. A bad day never produces a zero because yesterday's approved post is already queued to fire.
