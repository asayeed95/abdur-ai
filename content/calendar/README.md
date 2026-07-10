# Calendar — what fires when

The planned posting schedule, per project. One file per week (`2026-W28.md`, …) once the hands are live; until then this README carries the standing rhythm.

## Standing daily rhythm (all times ET)

| Time | What | Who |
|---|---|---|
| 08:06 | Mnemix Daily Content Brain drafts to Slack | Mac-mini launchd `content-brain-mnemix` (`workflows/local-brains/brain.sh mnemix`) |
| 08:30 | abdur.ai Daily Content Brain drafts to Slack | Mac-mini launchd `content-brain-abdur` (`workflows/local-brains/brain.sh abdur-ai`) |
| morning | founder reviews: APPROVE · EDIT · SKIP | Abdur |
| on approve | hands schedule next-morning fire via Blotato (veto window) | Mac-mini `hands-scheduler.sh` (every 30 min) → Pipedream durable |
| ~09:07 next day | `@mnemix_official` X (+ LinkedIn 10:07) fires | Blotato |
| ~10:07 next day | `@abdur_sayeed` X fires | Blotato |
| evening (20:00) | buffer check to Telegram; RED if next 48h has a gap | `buffer-monitor.sh` |

## Weekly texture (guideline, not law)

- **Mon–Fri:** the daily floor (one Mnemix + one abdur.ai post).
- **1–2×/week:** dockerfile.ai or heycli or mnemix-learning post (rotate; `@abdur_sayeed`).
- **~1×/week:** an IG carousel (after design look-approval).
- **Reddit/HN:** only when there's a genuinely strong fit, human-fired, ≤1 each/day.
- **Blog/TLDR:** when the week produced a story worth long-form — quality over cadence.
