# Content Operating System — law v2 (re-ratified 2026-09-01)

**Status:** re-ratified by the founder 2026-09-01 as the standing content law for abdur.ai. Supersedes
the 2026-07-09 *Marketing Alignment Plan* (Pipedream + Blotato era). Publishing rail is **Zernio**
(tracked under AGE-461). Nothing in this file authorizes a publish; it says how a publish is earned.

**Lineage:** July-9 plan → PR #3 (content OS scaffold, Blotato) → PR #6 (C-4 gated loop) → dual-brand
law + `claims_policy.py` on main (Aug) → PR #33 voice bundle (AGE-1216) → **this file**. #3/#6 remain
the implementation record for the ledger/routine machinery; where they say Blotato or Pipedream, read Zernio.

---

## 1. Non-negotiables

1. **Human voice wins.** Every post reads like Abdur writing normal English. No vendor-landing-page copy.
2. **Daily public output.** At least one post goes live every day from an owned account for an active project.
3. **Product floor.** The Northsun company voice on X posts at least once every day.
4. **abdur.ai is first-class.** Equal priority with the product. It is the founder/operator layer that
   makes the product believable.
5. **No blind duplicates.** Read the ledger and the recent published set before drafting, scheduling, or publishing.
6. **Trace everything.** Source, reason, draft history, approval state, destination, result — or it does not ship.
7. **Zernio is the only posting rail.** Agents do not invent a second publish path (no browser workarounds,
   no direct platform APIs, no Blotato — it is dead). Zernio `publish` is **not idempotent**: no retry
   without a dedupe check; there is no un-publish.
8. **Visibility.** Every draft, schedule, publish result, failure, and duplicate warning lands in Slack
   (`#northsun-agent-bridge`) — a card that lands only in a specialist chat is a miss, not done.
9. **Platform safety.** Reddit/HN are manual, human-fired surfaces. No automation without an explicitly approved pattern.
10. **Claims law.** `content/workflows/claims_policy.py` is the classifier: any price, benchmark, latency,
    customer, vendor, or identity claim it flags routes to founder review. No finding ≠ approval.
11. **Dual-brand law.** `content/brand/brand-map.json` is authoritative. Northsun = company and product.
    Mnemix = the Memory Lab / Forgetting Test only, attributed as *a free diagnostic from Northsun*.
    Frozen identifiers (repo slugs, env vars, handles) change only in a dedicated cutover.
12. **Visual lock.** Signal Noir is the visual system for social assets. Site tokens (Clay) are locked
    behind `docs/superpowers/specs/overrides.md`.

## 2. Accounts and rails

| Surface | Account | Voice | Rail | Where authorization lives |
|---|---|---|---|---|
| X | `@Abdur_sayeed` | founder, first person | Zernio profile (founder) | Grok box `settings.json` → `mcpCustomInstructions.zernio` |
| X | `@northsunai` | company voice **only** — never first person, incl. replies/DMs | Zernio profile (product) | same |
| LinkedIn | Abdur (personal) | founder authority, longer form | Zernio where supported, else staged manual | same |
| abdur.ai | `content/posts/` | canonical essays / TLDRs | git → Cloudflare deploy | founder merge + deploy |
| HN / Reddit | — | manual only | none | founder, per post |

Account status (paused / recovery / authorized) is set by the founder in that config, never in a
content file. If this table and the live config disagree, the live config wins and this table gets fixed.
`@Abdur_sayeed` is **authorized** for ordinary founder posts through the Zernio founder profile (founder,
2026-09-02; supersedes the 2026-08-23 PAUSED state — PR #33 updated to match). Browser posting, direct API,
OAuth re-connection, and account changes on that handle remain banned.

## 3. System of record — what actually exists in this repo

```text
content/
  README.md                       ← this law
  brand/brand-map.json            ← dual-brand law (machine-readable)
  workflows/claims_policy.py      ← claims classifier (shared by site checker + social gate)
  workflows/attribution/          ← funnel/ICP attribution pipeline
  posts/                          ← PUBLISHED site essays (MDX). Human merge only.
  posts/_drafts/                  ← generated site drafts. The ONLY place agents write site content.
  distribution/<slug>/            ← per-post launch packages + rendered assets (LinkedIn/IG/OG)
  ship-log.json                   ← shipped receipts
  applications/                   ← application documents (historical evidence, preserved as written)
```

Pending, carried by open PRs — do not re-create in parallel:

- `content/voice/` — voice profiles + banned phrases, hash-versioned (**PR #33**, AGE-1216). Until it
  merges, the banned-phrase list in §6 below is the interim gate.
- `content/ledger/*.jsonl`, `content/calendar/`, `content/routines/` — scaffolded in **PR #3/#6**; rebase
  onto this law before merging (rail name, account map, brand law).

## 4. Content record — minimum metadata

Every social post gets a record before it can go live (frontmatter of the draft file, or a ledger row):

```yaml
id:              YYYYMMDD-project-channel-short-slug   # e.g. 20260901-northsun-x-recall-race
project:         northsun | abdur-ai | heycli | dockerfile-ai
pillar:
channel:         x | linkedin | instagram | threads | tiktok | shorts | site
account:
status:          draft | approved | scheduled | published | rejected | failed
source_type:     repo_commit | pr | issue | screenshot | transcript | tldr | demo | opinion | research
source_refs:     []        # URLs / commit SHAs / file paths — required, no placeholders at approval time
why_this_post:
voice_notes:
duplicate_check: {result: pass|near|dup, against: [ids]}
claims_check:    {result: pass|flagged, findings: []}
approval:        {by: founder|veto-window, at: ISO8601, evidence: slack ts}
scheduled_at:
published_at:
zernio_post_id:            # replaces blotato_job_id
run_id:                    # replaces pipedream_run_id — the loop/agent run that produced it
canonical_url:
metrics_snapshot:
```

Body sections: **Source · Reason · Draft (exact copy) · Variants · Approval trail · Postmortem.**

## 5. Daily loop

**Morning sweep (07:30 ET).** Read the ledger (posted + scheduled), last-24h commits/PRs/issues across
the four repos, new screenshots/transcripts/TLDRs, and Slack instructions. Produce a daily brief:
what happened · what is postable · what cannot be claimed yet · which account needs content today ·
whether the product floor is already covered.

**Drafts (3–7).** Default mix: 2 product, 2 abdur.ai, 1 heycli/dockerfile.ai, optional event-driven extra.
Each draft passes, in order: brand check → claims check → banned phrases → duplicate check → source
trace → platform fit. A failure routes to `needs_human`; nothing rewrites itself past a claims finding.

**Approval and veto.**
- Low-risk daily posts: notify by 08:00 ET, schedule 11:00–14:00 ET, 30–90 min veto window in Slack.
- Explicit approval required for: launch claims, comparisons, public replies, anything on HN/Reddit,
  anything irreversible, anything with a claims finding.
- Missing approval ⇒ stays `approved-draft` or `scheduled-with-veto`. Never blind-published.
- Reply grammar (ratified 2026-07-22, PR #6): `yes / yes but → confirm / no / skip / release / edit / drop`;
  echo before act; `stop content` is the kill switch.

**Publish (Zernio).** Read ledger → dedupe → post approval card → wait for gate → `posts_create` on the
explicit profile → write `zernio_post_id` + status → post result to Slack. One publish attempt per
record; a retry requires a fresh dedupe against `zernio_post_id`.

**End-of-day audit (20:00 ET).** Verify: ≥1 post went out · product floor met · every published URL
recorded · failures logged · tomorrow has a backup draft. If the floor is at risk, generate one
low-risk post from documented repo material and send an urgent veto card. It still needs the gate.

## 6. Voice law (interim until PR #33 lands)

Direct. Specific. Slightly raw when the truth calls for it. Technical, not academic. Honest about what
broke. No fake authority. Short enough to feel native to the platform.

Banned: *unlock the power of · seamlessly · revolutionize · game-changing · cutting-edge · leverage AI ·
supercharge your workflow · in today's fast-paced world · we're excited to announce · empower teams ·
next-generation platform* — plus every retired identity phrase in `claims_policy.RETIRED_PHRASES`.

Identity and closer are verbatim from `brand-map.json` or absent. Rewrite test: if it sounds like a vendor
landing page, rewrite it the way Abdur would say it at 2 AM while debugging the actual system.

## 7. Pillars

- **Northsun (product):** agent memory failures (races, identity collapse, recall degradation) ·
  engineering receipts (bi-temporal data, evidence refs, validator-validation) · founder build logs ·
  15-second demo moments · technical TLDRs. Memory Lab / Forgetting Test content is Mnemix, attributed.
- **abdur.ai:** operator diary · agent architecture (Claude Code, Codex, Hermes, the Grok fleet, Zernio) ·
  build discipline / anti-vibe-coding · founder POV · design and content systems.
- **HeyCLI:** terminal-first workflows · remote command execution · agent tooling · "one command did the work" clips.
- **Dockerfile.ai:** reproducible builds · before/after environments · infra explainers · visual carousels.
  (Lane status undecided — pillar retained, no daily quota.)

## 8. Loops by system (who owns what)

| Loop | Owner | Notes |
|---|---|---|
| Source capture, drafts, ledger writes, local gates | Hermes + Agora (Grok fleet) | repo/file-system truth; Codex manages Hermes |
| Approval routing, veto cards, timeouts, audit | Slack `#northsun-agent-bridge` via Agora | replaces the Pipedream orchestration layer |
| Publishing | **Zernio** (`posts_create`, explicit profile) | Agora owns publish; Orbit publishes from the founder 1:1 if a specialist card is blocked |
| Inbound events (comments, mentions, failed publish) | Agora `zernio-inbound` webhook | logs to `northsun-ops/reports/agora/zernio-events/` |
| Site essays / TLDRs | abdur.ai lane (Claude Code) → `posts/_drafts/` | human merge + deploy only |
| Visual assets | Signal Noir batches → `distribution/<slug>/` | briefs weekly; immediate for launches |
| Memory / dedupe / continuity | the ledger + this directory | read before every draft and schedule |

## 9. Metrics

Operational: daily floor met · product floor met · % records with complete metadata · duplicates blocked ·
publish failures resolved <24h · backlog depth per project.
Content: X impressions/follows/replies · LinkedIn impressions/comments · short-form views/saves ·
site visits · subscribes (`RESEND_AUDIENCE_*`).
Quality: % passing voice gate without rewrite · % with real source refs · % tied to a real build/demo/lesson ·
founder override rate because copy sounded fake.

## 10. Build order (what is still open)

1. ~~content/ system~~ — exists (this repo). 2. Voice files — **PR #33**. 3. Ledgers — rebase from PR #3/#6.
4. Duplicate checker — PR #6 `gates.py`, port `blotato` spacing → Zernio. 5. Slack approval batch — PR #6
`batchlib.py`. 6. Floor rescue — last. 7. Zernio schedules — only after 1–6 are green. No step
publishes anything on its own.
