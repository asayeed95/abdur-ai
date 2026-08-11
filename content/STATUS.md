# STATUS — what's wired now vs what needs a secret / API / your call

Updated 2026-07-22 (content-ops Slice 1). Green = works today, verified by a command this session. Yellow = needs a human decision/action. Red = needs wiring.

> **What changed 2026-07-22 (content-ops Slice 1 — task C-4; spec: Mnemix `docs/superpowers/specs/CONTENT-OPS-SYSTEM.md`, RATIFIED 2026-07-22):** the generation feed + one-yes morning batch landed. New: `gates.py` (deterministic H1–H6 claim/voice/dedup/scrub gates), `rc1_loop.py` (draft→gates→judge→revise, ≤3 iterations, `needs_human` on guard trip), `batchlib.py` + batch layer in `hands_scheduler.py` (ratified reply grammar incl. per-item verbs and `stop content` kill switch, (batch-id,item-id) idempotency, live-Blotato-queue spacing, risk auto-pause after 3 rail failures, `runs.jsonl`/`risk.jsonl`), `batch_assemble.py` + `r-c1.sh`/`r-c2-send.sh` (06:30 harvest+loop · 07:30 single batch message), installer rewired (per-project brain jobs superseded). 51 offline tests green. **Not armed:** launchd install remains founder-run (item 1 below); first LIVE release additionally gated on the D-7 parallel-lane cleanup (delete the old-account routines named in local-brains/README gotchas) and runs floor-only per D-8.

> **What changed 2026-07-16:** the content inbox now ingests ALL five portfolio repos.
> `local-brains/capture-repo-events.sh` (new) turns merged-to-main commits into permanent
> `sources/repo-events/*.md` records — cursor-tracked, dry-run-safe, **main-branch-only**
> (HEAD on these clones is usually an unmerged feature branch; capturing it would market
> unshipped work). First real run captured 25 records (mnemix 10, dockerfile-ai 10,
> mnemix-learning 3, abdur-ai 2, heycli 0 — heycli's wake-word/reconnect work is all
> unmerged, so it has nothing merged to talk about yet: honest). New brains
> `brain.sh dockerfile-ai` / `brain.sh heycli` (+ prompts) exist but are **manual-only, not
> launchd-scheduled**. Phase 2 (GitHub Action → Pipedream webhook) is a template only —
> `workflows/repo-delegation/`. Open decision: mnemix-learning feeds the abdur-ai brain vs
> its own slot. Strategy framing: `workflows/MARKETING-PIPELINE-V2-REDEFINITION-2026-07-16.md`.
> `.cursors/` is machine-local state, now gitignored — the cursor lives on whichever machine
> runs the capture (currently: Abdur's MacBook ran the first pass; if the Mac mini becomes
> the scheduled runner its own first run re-baselines to "last 15" and the filename-exists
> check dedupes the overlap).

> **What changed 2026-07-10:** the claude.ai account switch orphaned both cloud routines (404, empty routine list, no environments on the new account). The brains were rebuilt as **local Mac-mini jobs** (`workflows/local-brains/`) — which also matches the architecture principle: the Mac mini owns repo truth + draft generation. Old-account routines may still exist; delete them at claude.ai/code/routines (old login) to prevent double-drafting if that account's spend cap resets.

## 🟢 Implemented and verified now

- **The content OS** — this whole `content/` tree (PR #3): README, voice rules + banned-phrases machine block, ledger schema + dedup rules, routines, workflow specs, Clay + Signal Noir design systems, Higgsfield packets + prompt library, carousel/image/motion briefs, 5 starter drafts (all tweets weighted ≤280, lint clean).
- **Mnemix Daily Content Brain (local)** — `brain.sh mnemix`: gathers git log + recent channel drafts (dedup), generates via `claude -p` (no tools, no secrets in the model), passes 3 gates (json block, weighted ≤280, banned-phrases), posts to `#mnemix-content` for APPROVE·EDIT·SKIP. **Verified end-to-end: posted a real draft.** Publishes nothing.
- **abdur.ai Daily Content Brain (local)** — `brain.sh abdur-ai`, same pipeline, `[ABDUR.AI]`-tagged. **Verified end-to-end** (its first draft was a meta post about this very system — and its reject-gate correctly fired on an earlier draft that quoted banned phrases). Equal priority to Mnemix.
- **Hands-scheduler (built + dry-run verified)** — `hands_scheduler.py`: Slack `APPROVED:` → re-lint → Blotato next-morning schedule (veto window) → Telegram fire times → ledger append. Idempotent by Slack ts. `DRY_RUN=1` path verified against live Slack (0 approvals pending).
- **Buffer monitor (verified live)** — checks Blotato queue for both accounts, Telegrams status. **First live run correctly RED-alerted: nothing queued for the next 48h.**
- **Blotato REST publishing path** — re-verified live today (`GET /v2/schedules` 200). Telegram founder-DM path verified live.

## 🟡 Needs your action / decision

1. **Install the launchd jobs (one command, founder-run — the classifier correctly requires your hand for standing services):**
   ```
   ! bash ~/projects/abdur-ai/content/workflows/local-brains/install-launchd.sh
   ```
   Until run, the brains/hands/monitor only fire when started manually.
2. **The 48h buffer is EMPTY.** Two drafts are waiting in `#mnemix-content` (Mnemix + `[ABDUR.AI]`). Reply `APPROVED:` + the json block to one of each, and the hands will queue them (after the installer runs; or ask an agent to run `hands-scheduler.sh` once).
3. **Delete the orphaned cloud routines** on the OLD claude.ai account (claude.ai/code/routines) — prevents double-drafting later.
4. **Paid Pipedream tier** — still the durable orchestration target (`workflows/pipedream/` has both paste-ready builder prompts). Local hands are the interim.
5. **`#abdur-content` Slack channel** — optional; until created, everything routes to `#mnemix-content` with project tags.
6. **Design batches** — briefs ready; no mass production until you approve the first 1–2 designs.

## 🔴 Not yet wired

- **Pipedream workflows 1+2** (durable hands) — blocked on the paid-tier decision.

(Done since first draft of this list: Reddit/HN guided-packet generation added to both brain prompts (human-fire-only, quality-bar gated); ledger backfill — pillar-1 X + LinkedIn permalinks are in `posted.jsonl`; IG deliberately excluded, fire never verified. CodeRabbit Majors on PR #3 fixed: capture-not-generate NeuralSphere rule, exact claims/slugs, canonical asset path.)

## The end-to-end, once you run the installer

```
08:06/08:30  brains draft → Slack (gated: json, ≤280, banned-phrases)
morning      you: APPROVED: + json  (or EDIT / SKIP; silence = hold)
≤30 min      hands schedule Blotato next-morning fire → Telegram veto notice → ledger
next morning posts fire on @mnemix_official / @abdur_sayeed
20:00        buffer monitor: RED alert if the next 48h is empty
```

Everything in that loop is built and individually verified; the installer is the last wire.
