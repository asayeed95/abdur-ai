# HeyCLI writing series (build-plan C-13)

**Linear:** AGE-3107 (parent lane AGE-2391). **Status:** draft #1 staged in `_drafts/`; nothing published.
**Related:** AGE-2893 (HeyCLI claims decision, `needs-decision`), AGE-426 (HeyCLI public launch gate), abdur-ai PR #58 (content-engine notes).

## What this is

A series on `/writing` about HeyCLI engineering. It has three jobs: show applied-AI craft with checkable evidence, grow the `tldr` list, and say nothing about HeyCLI that the repo can't back. HeyCLI is a soft mention in the content lane, never the pitch (AGE-2391 skeptic test).

## Why the series leads with receipts

The Daemon, which is what HeyCLI is now being built as, has not been shown running. `docs/daemon/DIFF-2026-09-17.md` on the `claude/age-1630-daemon-ultra-epic` branch of the private `remotecli` repo records "booted for 120 s total, ever" and no proven acceptance tests, and PR #728 (the epic) is an open draft. What is real and checkable today is the Remote-tier bridge on `main`, the locked design law in `NORTH-STAR.md`, and a body of honest engineering decisions. So: `reported` posts (with receipts) first, `designed` / `argued` posts labelled as such, and no post claims the Daemon works.

## Gate G1: no HeyCLI product claims until public copy is ratified

`docs/content-engine/README.md` (PR #58, still open) says: *"HeyCLI has no ratified public copy and no landing page yet — no HeyCLI product claims until that exists."* AGE-2893 is the open founder decision under `DEC-PUBLIC-CLAIMS`. AGE-426 adds a second gate: no amplification until a stranger can drive a real session ("activation before acquisition").

- **Post 1 clears G1.** It is a postmortem of a reconnect bug. It names the project and describes it only as an iOS app talking to a Node bridge over an authenticated WebSocket, the wording `/poppy` already carries.
- **Posts 2–5 and 7 stay in `_drafts/`** until G1 clears, because they describe product design or status.
- **Post 6 may clear G1 early** if written as research with no HeyCLI product claim. It would need the non-affiliation line and a re-check on current tool versions.
- **No HeyCLI social copy is sent.** It can be staged under `content/distribution/<slug>/`.

## Gate G2: receipts a reader can check, before any `reported` post is promoted

`content/posts/REGISTERS.md` defines a receipt as "something a reader could independently check". Codex flagged (PR #82, P2) that draft #1's receipts point only at a private repo. That is true, and it is not specific to this draft: most published `reported` posts cite private-repo paths, SHAs and PR numbers. So the house practice, labelled private-source receipts, and the register's wording are in tension. Reconciling them is the maintainer's call, and this series does not amend `REGISTERS.md`.

So a `reported` post whose receipts live only in a private repo is **not promoted** until one of these holds, and the promotion override says which:

1. **A public immutable artifact backs the receipts**, for example the public server repo from AGE-426 once it exists, or a verbatim evidence file committed to this public repo. Do not publish proprietary `app/` code beyond the short excerpts already in the post.
2. **The maintainer confirms** the labelled-private-receipts practice applies to this post.
3. **The post is re-registered** so it claims only what the shown code supports.

Either way the post says plainly which claims a reader can check from the code it shows and which rest on the private commit.

## The series

| # | Slug / working title | Register | Source (pin SHAs when drafting) | Gate |
|---|---|---|---|---|
| 1 | `the-auth-loop-that-took-two-bugs` | reported | remotecli `5215874` (2026-04-07, on `main`); review doc `af186b3` | clears G1; **G2 pending**; drafted |
| 2 | The audit that found the agent had booted for 120 seconds | reported | `docs/daemon/DIFF-2026-09-17.md`, `PATHS-2026-09-18.md` (epic branch) | G1 |
| 3 | A voice agent needs a bouncer: was that sentence for me? | designed | `NORTH-STAR.md` D.5/D.6 (Attention Gate) | G1 |
| 4 | The front desk never cooks: two loops for a talking agent | designed | `NORTH-STAR.md` D-R5..R7; ADR 2026-08-04 | G1 |
| 5 | Why my agent won't ride your Claude subscription | argued | D-R2; ADR 2026-09-17 | G1 |
| 6 | You can't join a live terminal session from outside. I tried. | reported | `docs/Research/2026-08-04-unknown-hunt-…` (epic branch) | may clear early (see above) |
| 7 | What is an executive agent for coding agents? | argued | D.1 sentence verbatim; links to 1–6 | G1; written last so it can link back |

A designed piece that opens with one real incident is `reported` (REGISTERS.md: the register is the strongest claim made), so post 4 keeps its incident as an ADR pointer or splits.

## Claims ledger (every draft is checked against this)

**Say:** the problem (live sessions invisible to the app); the locked D.1 sentence only verbatim; two loops and the Attention Gate as design; audit and postmortem stories; "only text crosses the wire" for the Remote tier only; the `/poppy` status wording ("In engineering").

**Never say:** any latency, threshold or speed-of-speech number (0.72/0.90/0.98, ≤800 ms, 150 vs 40 wpm, "five sessions" are internal targets, not measurements); "on-device" speech recognition or "audio never leaves your device"; TestFlight, App Store, pricing, "open source"; Codex, Grok or Aider as working workers; "voice remote", "remote control" as what it is, "for Claude Code" as scope, "Claude Code with a voice", "AI coding assistant", "run N sessions at once". Any post naming Claude Code carries: *HeyCLI is an independent project and is not affiliated with or endorsed by Anthropic. Claude and Claude Code are trademarks of Anthropic, PBC.* Do not publish the `design/*.jpeg` moodboards (provenance unverified). Quote only code from `server/` (the part AGE-426 will publish with fresh history) and short excerpts from `app/`; never quote the strategy docs in the private repo's history (`docs/Research/*`, `docs/memory/revenue-status.md`, `HEYCLI-FINALIZATION-REPORT.md`, `HUMAN-TODO.md`, `RETRO.md`).

## Known gaps

1. **Receipts point at a private repo** (gate G2 above). Readers can't open `5215874`. Each `reported` post therefore inlines verbatim excerpts, and the SHA is an audit trail, not proof. AGE-426's public repo starts with fresh history, so its SHAs will differ.
2. **`<ReceiptsBlock />` renders only where the MDX body contains the tag, and 8 of the 15 published `reported` posts do not include it.** `PostArticle` renders receipts only where the tag is present. Derived on 2026-10-09 from `content/posts/*.mdx` (not sampled): the eight without it are `the-health-check-that-became-a-retry-storm`, `the-meter-that-counted-cache-hits-as-cash`, `the-dashboard-query-rls-wouldnt-let-through`, `your-pager-is-not-your-customer`, `29-review-rounds-hardened-a-ci-gate-that-nothing-ran`, `the-analytics-call-that-couldnt-fail`, `meta-description-length-truncated-snippets` and `newsletter-signup-200-proves-less-than-you-think` (July to 3 October). The flagship and every post from 4 October on include it. Draft #1 includes the tag. The eight published posts are locked copy and are untouched here; see RETRO 2026-10-05.
3. **`content/voice/` is not in this checkout.** Voice is matched to the three most recent posts: first person, short declaratives, a bold **Short answer:** opener, question H2s, a FAQ, roughly 1,200–1,650 words.
4. **Merged is not published** (RETRO 2026-10-05): after any promotion, confirm the live URL returns 200.

## Pipeline for each post

1. Draft in `content/posts/_drafts/`. Verify every code excerpt is verbatim from its commit and every number traces to a commit message, doc or test. Re-read external sources (RFC 6455 §7.4.2 for post 1) before promotion.
2. Independent fresh-context review, as the last posts had.
3. Promote with `node scripts/tldr-publish.mjs <slug>`, set `date`, add a `content-publish-override:` entry citing the standing publish authorization, commit post and override only.
4. After deploy, confirm `/writing/<slug>` returns 200 and the receipts block renders.
5. Stage (never send) an X thread and LinkedIn note via the `content-hooks` skill.
6. Email list: use `<NewsletterCTA />` (the `tldr` audience). A dedicated HeyCLI list waits for ratified copy, since it would otherwise be an availability claim; AGE-285 tracks the heycli.ai waitlist.

## Draft #1: what was verified

- All five code blocks are byte-identical (whitespace-normalised, contiguous) to `5215874^` / `5215874`; checked by script.
- `description` 142 chars, `seo_title` 48, `tldr` 144 words, body about 1,290 words of prose.
- Promoted inside a throwaway copy of the repo and built: compiles, `/writing/<slug>` and `/aitldr/<slug>` generate, the receipts block renders five entries, `check-public-claims.py`, `check-brand.py` and `check:og` pass.
- Open for the reviewer: the client excerpts come from the proprietary `app/` (short, generic reconnect logic); RFC 6455 close-code statements need a re-read; `date` must be reset on promotion.

## Rollback

Delete the draft and this spec, and revert the C-13 row. Nothing here is published.
