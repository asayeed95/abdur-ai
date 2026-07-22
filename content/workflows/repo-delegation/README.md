# Repo delegation — the "one inbox, multiple outbound" wiring

Confirms and formalizes what Abdur named on 2026-07-16: **`abdur-ai/content/` is the single
marketing inbox for the whole portfolio.** Every watched repo delegates its real work IN
(commits, PRs, decisions); the same inbox fans drafts OUT to the right account/platform per
project. This doc is the inbound half. Outbound fan-out already exists — see the routing table
in `../local-brains/README.md`.

Companion to `../../MARKETING-PIPELINE-V2-REDEFINITION-2026-07-16.md` §3 (Watchers W1–W3) —
this is those watchers made concrete and buildable today.

## The split: two ways in, by maturity

### Phase 1 — LOCAL (buildable today, zero new infra) — **this is what's drafted in this PR**

The Mac mini already has local clones of every portfolio repo (that's the existing
architecture principle: Mac-mini owns repo truth). `brain.sh` already proves this — it `cd`s
into `~/projects/mnemix` and runs `git log` directly. `capture-repo-events.sh`
(`../local-brains/capture-repo-events.sh`) generalizes that from "2 hardcoded projects, last
15 commits, thrown away after one prompt" into "N watched repos, cursor-tracked, written as
permanent, structured `sources/repo-events/*.md` records" — matching the existing file format
(see `sources/repo-events/mnemix-learning-137f415-fabricated-ids.md` for the pattern this
mirrors).

No GitHub webhook, no Pipedream dependency, no new secret. Runs via the same launchd pattern
as the existing brains (not yet installed — founder-run, per `STATUS.md`).

**Truth gate (added in review):** capture reads each repo's **local `main`/`master` branch,
never HEAD.** Day-to-day these clones sit on feature branches (verified 2026-07-16: 4 of 5
were), and HEAD there is unmerged work — recording it would let a draft claim something that
never landed. Merged / deployed / verified are separate states; this inbox ingests merged-to-
main only. Consequence: work becomes marketing material when it MERGES, not when it's
committed on a branch — if local main is behind origin, capture happens after the next pull
(late, never wrong).

### Phase 2 — CLOUD (once the Pipedream paid tier lands — `STATUS.md` item 4)

`notify-content-os.yml.template` in this directory is the future version: each repo's GitHub
Actions posts a compact JSON payload to a Pipedream webhook on `push`/`pull_request: closed`
(merged)/`release`. Pipedream normalizes it into the same `sources/repo-events/*.md` shape and
commits it via the GitHub Contents API. This matters once repos live outside this machine (a
contributor's laptop, CI) or once we want event capture to survive the Mac mini being asleep.

**Not installed anywhere yet.** It's a template so the shape is agreed before it's wired into
five repos' `.github/workflows/`. Migrate the same way the existing Pi5→Pipedream note
describes: verify Phase 2 end-to-end on one repo, then retire Phase 1's cron for that repo,
one at a time. Don't run both for the same repo (double-capture risk — the filename-exists
check in `capture-repo-events.sh` guards this, but cleaner to just pick one per repo).

## Watched repos (Phase 1 — proposed, needs Abdur's confirm)

| Key | Local path | Product | Outbound account today |
|---|---|---|---|
| `mnemix` | `~/projects/mnemix` | Mnemix | `@mnemix_official` (existing) |
| `abdur-ai` | `~/projects/abdur-ai` | abdur.ai | `@abdur_sayeed` (existing) |
| `dockerfile-ai` | `~/projects/dockerfile-ai` | Dockerfile.ai | `@abdur_sayeed` — NEW, needs a prompt + brain.sh case (drafted this PR) |
| `heycli` | `~/projects/remotecli` | HeyCLI | `@abdur_sayeed` — NEW, needs a prompt + brain.sh case (drafted this PR) |
| `mnemix-learning` | `~/projects/mnemix-learning` | GODDESS/MOLL doctrine | **open question below** |

### Open question: does mnemix-learning get its own daily brain, or feed abdur-ai's?

mnemix-learning is the doctrine/failure-ledger repo (MOLL) — its commits (`gate(scar-id):`,
`freeze:`, `savepoint:`) are operator-diary material about *how the system builds things*, not
a product with its own audience. Recommendation: don't give it a third `@abdur_sayeed` slot at
11:07 — instead, feed its captured `sources/repo-events/mnemix-learning-*.md` records into the
**abdur-ai brain's** context (it already reads `ship-log.json`; add mnemix-learning source
files to that same input) so MOLL stories surface as abdur.ai operator-diary angles instead of
competing for a separate fire time. **Needs Abdur's call before Phase 1 ships** — flagged, not
decided.

## What's actually in this PR vs. what still needs a decision

| | Status |
|---|---|
| `capture-repo-events.sh` (Phase 1 script) | **Live-run for real** (2026-07-16) — main-branch-only after a review found HEAD would've captured unmerged work. 25 records captured across 5 repos. |
| `prompts/dockerfile-ai.md`, `prompts/heycli.md` | Drafted, locks sourced only from verified repo/notes facts |
| `brain.sh` case statement extended | Drafted, **+ now reads unused `sources/repo-events/` records as preferred material** (was previously raw `git log` only, and ignored the sources folder entirely — including the 6 records that predated this work) |
| `hands_scheduler.py` `mark_source_used()` | **Wired + unit-tested** (5 cases: dry-run no-op, real replace, already-used left alone, path-traversal refused, bare-sha no-op) — closes the loop so a scheduled draft's source can't be redrafted |
| `notify-content-os.yml.template` (Phase 2) | Drafted, **not installed in any repo** |
| mnemix-learning routing decision | **Open — needs Abdur** (it now HAS unused captured records — 3 of them — sharpening the question) |
| Slack routing for the 2 new projects | Currently `#mnemix-content` with `[project]` tag per existing fallback rule — `#abdur-content` still not created |
| launchd install | **Not run** — still founder-gated per `STATUS.md` |

## End-to-end loop, now actually closed

```
capture-repo-events.sh (merged-to-main only)
  -> content/sources/repo-events/<project>-<sha>-<slug>.md  [Used by: placeholder]
       -> brain.sh <project>  (offers UNUSED records first, raw git log as fallback)
            -> Slack draft, human APPROVE/EDIT/SKIP
                 -> hands_scheduler.py schedules via Blotato
                      -> mark_source_used()  [Used by: <project> draft scheduled ... ledger id ...]
                           -> tomorrow's brain.sh run no longer offers this record
```
Current real numbers (2026-07-16 run): mnemix 10 unused, dockerfile-ai 10 unused, mnemix-learning 3 unused, abdur-ai 2 unused, heycli 0 unused (all its real work is still on unmerged branches — correctly excluded, not a bug).
