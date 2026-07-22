# Local brains — the Mac-mini content loops

The daily generation + scheduling machinery, running **on this Mac mini** with local repo access and Doppler secrets. This replaced the claude.ai cloud routines on 2026-07-10 after an account switch silently orphaned them — a scar worth remembering: *cloud routines are owned by the login that created them; a re-login can strand the whole pipeline.* Local launchd jobs don't have that failure mode, and per the architecture principle the Mac mini owns draft generation anyway (repo truth lives here).

## The pieces

| Script | Job | Schedule (launchd) |
|---|---|---|
| `brain.sh mnemix` | generate ONE locks-clean Mnemix draft → post to Slack `#mnemix-content` for APPROVE·EDIT·SKIP | daily 08:06 local |
| `brain.sh abdur-ai` | generate ONE abdur.ai operator-diary draft (tagged `[ABDUR.AI]`) → same channel | daily 08:30 local |
| `brain.sh dockerfile-ai` | generate ONE Dockerfile.ai devlog draft (tagged `[DOCKERFILE.AI]`) → same channel | **manual only** — not launchd-scheduled yet (2026-07-16 repo-delegation redefinition; see `../repo-delegation/README.md`) |
| `brain.sh heycli` | generate ONE HeyCLI devlog draft (tagged `[HEYCLI]`) → same channel | **manual only** — same as above |
| `capture-repo-events.sh` | turn real commits across all 5 watched repos into permanent, cursor-tracked `content/sources/repo-events/*.md` records (dry-run safe by default) | **manual only** — not launchd-scheduled yet |
| `hands-scheduler.sh` | scan channel for founder `APPROVED:` messages → schedule via Blotato for a **next-morning fire (veto window)** → Telegram fire times → append `ledger/scheduled.jsonl` | every 30 min, 08:00–23:00 |
| `buffer-monitor.sh` | RED-alert Telegram if `@mnemix_official` or `@abdur_sayeed` has nothing queued in the next 48h | daily 20:00 local |
| `install-launchd.sh` | one-time installer for the original four jobs (**founder-run**) — does NOT yet install the two new brains or the capture script; needs a decision on cadence/fire-time first (see `../repo-delegation/README.md`) | — |

## Design rules encoded

- **The model gets no tools and no secrets.** `brain.sh` gathers all context (git log, ship-log, recent channel drafts for dedup) and does all I/O; `claude -p` only writes the draft. Prompts: `prompts/<project>.md` (locks + voice inline).
- **Three gates before Slack:** json block present → weighted tweet counts ≤280 → banned-phrases lint (`voice/banned-phrases.md` machine block). A reject never posts; the draft is kept in `~/Library/Logs/content-brains/*-draft.md` for post-mortem.
- **The hands publish only what a human approved** — a top-level `APPROVED: {json}` message in the channel — and always with a future `scheduledTime`, so the founder can still veto by deleting the schedule in Blotato. Idempotent via the ledger (Slack ts = id). Re-lints everything before scheduling (defense in depth).
- **Quiet hours:** hands exit outside 08:00–23:00 local.
- **`DRY_RUN=1`** on `hands_scheduler.py` exercises parse+gates with no Blotato/ledger/Telegram side effects.

## Routing (hands)

| project | X account | X fire (ET) | LinkedIn |
|---|---|---|---|
| mnemix | `@mnemix_official` 18856 | 09:07 | 21401 @ 10:07 (if `linkedin_text`) |
| abdur-ai | `@abdur_sayeed` 20072 | 10:07 | 21401 @ 11:07 |
| dockerfile-ai | `@abdur_sayeed` 20072 | 11:07 | — |
| heycli | `@abdur_sayeed` 20072 | 11:07 | — |
| mnemix-learning | `@abdur_sayeed` 20072 (hands_scheduler ROUTES supports it if an APPROVED draft carries this project key) | 11:07 | — |

*mnemix-learning has a route but **no brain**: nothing generates drafts for it daily. Recommendation (open decision, see `../repo-delegation/README.md`): keep it that way — feed its captured `sources/repo-events/` records into the abdur-ai brain's context so MOLL stories surface as operator-diary angles instead of a 4th daily slot on the same account.*

## Install / operate

```bash
# one-time (founder): installs the 4 launchd jobs
bash ~/projects/abdur-ai/content/workflows/local-brains/install-launchd.sh
# manual run any time:
bash .../brain.sh mnemix            # extra Mnemix draft
bash .../brain.sh abdur-ai --test   # test-tagged draft
bash .../buffer-monitor.sh          # instant buffer check
# logs:
ls ~/Library/Logs/content-brains/
```

Secrets come from Doppler `asec-production/prd_asec_collections` at runtime (`SLACK_BOT_TOKEN`, `BLOTATO_API_KEY`, `TELEGRAM_BOT_TOKEN`, `ABDUR_TELEGRAM_CHAT_ID`) — never stored in the repo or the plists.

## Known gotchas (paid for, don't repeat)

- urllib POST needs an explicit `Content-Type: application/json` header — Telegram 400s on the form-encoded default.
- `VAR=$(… | while … grep -q …)` under `set -e` dies when the last grep finds nothing — `|| true` the substitution.
- The old cloud routines (`trig_01EHoBCKX68iahC8hcGeiGvk`, `trig_01Ya6Thx9G84dUhyzY1JTaM7`) may still exist under the PREVIOUS claude.ai account. If that account's spend cap resets they could revive and double-draft — delete them at claude.ai/code/routines while logged into the old account.
