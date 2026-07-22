# Local brains — the Mac-mini content loops

The daily generation + scheduling machinery, running **on this Mac mini** with local repo access and Doppler secrets. This replaced the claude.ai cloud routines on 2026-07-10 after an account switch silently orphaned them — a scar worth remembering: *cloud routines are owned by the login that created them; a re-login can strand the whole pipeline.* Local launchd jobs don't have that failure mode, and per the architecture principle the Mac mini owns draft generation anyway (repo truth lives here).

## The pieces

| Script | Job | Schedule (launchd) |
|---|---|---|
| `r-c1.sh` | **R-C1 (Slice 1):** fetch-first harvest (all 5 repos) → capture → L-C1 loop per priority project (brain `--emit-only` → `gates.py` H1–H6 → judge → revise, ≤3) → item jsons in `content/drafts/<project>/` | daily 06:30 local (host-pinned via `RC1_HOST`) |
| `r-c2-send.sh` → `batch_assemble.py` | **R-C2 (Slice 1):** assemble the ONE morning batch (manifest `content/drafts/BATCH-<date>.json`) + send to Slack (reply channel) with Telegram mirror; carries ≤2 re-offers; floor-only per D-8 | daily 07:30 local |
| `brain.sh mnemix` | generate ONE locks-clean Mnemix draft → post to Slack `#mnemix-content` for APPROVE·EDIT·SKIP | **superseded by content-rc1** — manual runs still work |
| `brain.sh abdur-ai` | generate ONE abdur.ai operator-diary draft (tagged `[ABDUR.AI]`) → same channel | **superseded by content-rc1** — manual runs still work |
| `brain.sh dockerfile-ai` | generate ONE Dockerfile.ai devlog draft (tagged `[DOCKERFILE.AI]`) → same channel | **manual only** — not launchd-scheduled yet (2026-07-16 repo-delegation redefinition; see `../repo-delegation/README.md`) |
| `brain.sh heycli` | generate ONE HeyCLI devlog draft (tagged `[HEYCLI]`) → same channel | **manual only** — same as above |
| `capture-repo-events.sh` | turn real commits across all 5 watched repos into permanent, cursor-tracked `content/sources/repo-events/*.md` records (dry-run safe by default) | invoked by `r-c1.sh` daily; manual runs stay dry-run-safe |
| `hands-scheduler.sh` | scan channel for **batch replies** (yes · yes but · no · skip · release/edit/drop · confirm · stop/resume content) AND founder `APPROVED:` messages → Blotato schedule with veto window, live-queue spacing, risk auto-pause → ledger | every 30 min, 08:00–23:00 |
| `buffer-monitor.sh` | RED-alert Telegram if `@mnemix_official` or `@abdur_sayeed` has nothing queued in the next 48h | daily 20:00 local |
| `install-launchd.sh` | one-time installer (**founder-run**): `content-rc1` 06:30 · `content-rc2-send` 07:30 · hands · buffer-monitor; removes the superseded per-project brain jobs. dockerfile-ai/heycli brains stay manual (see `../repo-delegation/README.md`) | — |

## Content-ops Slice 1 (2026-07-22 — spec: Mnemix `docs/superpowers/specs/CONTENT-OPS-SYSTEM.md`, RATIFIED)

- **Loop law (§2.1):** L-C1 = deterministic `gates.py` (H1 banned · H2 claim allow-list · H3 seed + orphan-number incl. spelled numbers · H4 format · H5 ledger dedup with gate-computed keywords · H6 scrub) + a fresh-context judge (`prompts/judge.md`, arithmetic re-checked by the loop) · 3-iteration guard · guard-trip ⇒ `needs_human`, releasable ONLY by per-item verbs. Loops never schedule, never post, never re-arm.
- **Batch grammar (§4.3):** `yes` · `yes but <edits>` (LLM merge → repost → `confirm`; unconfirmed 2h ⇒ untouched items release, edited hold) · `no` · `skip <ids>` (the token `skip` anywhere in a yes-reply wins) · `release/edit/drop <id>` · `stop content` / `resume content`. Bot echoes its parse before acting. Slack is the only reply channel until AGE-148 activates.
- **Release law (§4.4):** fire times from the manifest (09:07 / 09:37 / 10:07 ET defaults), late approvals recompute ≥30 min out, ≥15-min spacing checked against the LIVE Blotato queue per account id (any lane), quiet hours 07:00–23:00 ET, floor-only volume per D-8 until activation is fixed.
- **State files:** `content/drafts/BATCH-<date>.json` (manifest) · `ledger/runs.jsonl` (run visibility) · `ledger/risk.jsonl` + `.risk-state.json` (3 consecutive rail failures ⇒ auto-pause) · `.paused` (kill switch flag) — the dotfiles are machine-local, gitignored.
- **Tests:** `tests/test_gates.py` · `tests/test_batchlib.py` · `tests/test_hands_smoke.py` (51 cases, stdlib-only, no network — run each with plain `python3`).
- **Runner note:** the judge reads `~/Projects/content-ops/BRAND-VOICE-PROFILE.md`; if absent on the runner it falls back to `voice/abdur-voice.md` and labels the scorecard `fallback-voice-law` — sync `content-ops/` to the mini for full-fidelity judging (spec D-3).

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
