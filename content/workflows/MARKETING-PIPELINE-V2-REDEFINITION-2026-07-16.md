# Marketing Pipeline v2 — Redefinition (2026-07-16)

**What this is:** Abdur's raw idea, restated in precise words and structured lists, BEFORE implementation. Planning-only. Builds on the existing Content OS (`content/README.md`) — nothing here replaces the loop, the ledger, the voice rules, or the human gate. It extends them.

**One-sentence definition:**
> A continuously running, event-driven marketing system that watches real work (Linear tasks, PRs, commits) and real conversations (X, Reddit, HN), turns both into source-traceable drafts — original posts AND contextual replies — routes every draft through human approval, and publishes via Pipedream→Blotato across X (heavy), LinkedIn (medium), IG/FB/TikTok (light, visual), with the whole thing packaged as a reusable Agent Skill so any project (Mnemix first, then abdur.ai, Dockerfile.ai, HeyCLI) can run the same machine.

---

## 1 · The two content engines (name them properly)

1. **PROOF ENGINE (outbound / "we did a thing")** — dev-work-driven. Triggers: Linear issue state changes, merged PRs, notable commits, releases. Output: build-log posts, devlog threads, feature announcements, TLDRs. Two tracks per project (per the locked routine): use-case content for end users; build/devlog content for indie hackers in plain language.
2. **CONVERSATION ENGINE (inbound / "they're talking about our space")** — listening-driven. Triggers: keyword hits on X (exists today — the Telegram digest bot), Reddit threads, HN posts about agents/memory/context. Output: reply drafts, comment drafts, quote-tweet drafts — contextual, non-salesy, in Abdur's voice.

Everything below serves one of these two engines.

## 2 · Pipeline stages (the canonical vocabulary)

WATCH → INGEST → PROCESS → DRAFT → GATE → DELIVER → RECORD → LEARN

1. **WATCH** — standing listeners/webhooks that notice events (no LLM).
2. **INGEST** — normalize each event into a source record in `content/sources/` (repo-events, social-signals) with timestamps, permalinks, raw text.
3. **PROCESS** — LLM (local or hosted) classifies + prioritizes: is this post-worthy? which engine, project, platform, format, angle? Dedupe against `ledger/` before anything is drafted.
4. **DRAFT** — generate platform-shaped copy (or image/video brief) in Abdur's voice with a `source:` ref. Drafts land in `drafts/<project>/`.
5. **GATE** — human APPROVE · EDIT · SKIP via Slack/Telegram. Silence = hold. No exceptions.
6. **DELIVER** — Pipedream schedules via Blotato with a future fire time (veto window). Reddit/HN: guided packet only, human fires.
7. **RECORD** — every state change appends to `ledger/*.jsonl`. The ledger is the memory and the dedupe substrate.
8. **LEARN** — weekly: engagement stats per post → what angles/platforms/formats work → feed back into PROCESS priorities.

## 3 · Watchers (the standing inputs)

| Watcher | Source | Mechanism | Status |
|---|---|---|---|
| W1 Linear watcher | Linear issues/projects (Agencyflow workspace) | Linear webhook → Pipedream | NEW |
| W2 PR watcher | GitHub PRs merged (Mnemix, dockerfile-ai, remotecli, abdur-ai) | GitHub webhook → Pipedream | NEW (git log scan exists in brain.sh — upgrade) |
| W3 Commit/release watcher | Notable commits, tags, releases | GitHub webhook / daily git scan | PARTIAL (brain.sh git log) |
| W4 X listener | Keywords: agents, memory, context, + competitor terms | EXISTS — bot digesting to Telegram | LIVE — wire its output into `sources/social-signals/` |
| W5 Reddit listener | Target subs (r/LocalLLaMA, r/MachineLearning, r/SaaS, agent subs) | Reddit API (compliant, read-only) → Pipedream | NEW |
| W6 HN listener | Algolia HN API keyword search | Pipedream cron | NEW |
| W7 Buffer monitor | Blotato queue depth per account | EXISTS (buffer-monitor.sh) | LIVE |

## 4 · Processors (the brains)

1. **Signal classifier** — scores each ingested item: relevance, reply-worthiness, freshness window, risk (controversial? competitor bait?). Cheap model / local LLM is fine here.
2. **Angle planner** — maps a source to angle + platform + format + track (use-case vs devlog), checks ledger for duplicate angles.
3. **Draft writer** — the existing `claude -p` no-tools/no-secrets pattern (brain.sh). One writer per engine: proof-writer, reply-writer.
4. **Format expander** — approved text angle → image brief / carousel brief / reel script (design briefs already exist in `content/design/`). Video for TikTok/Reels only where a visual actually adds something.
5. **Three gates before Slack (existing, keep):** json block present → weighted counts ≤280 → banned-phrases lint.

## 5 · Delivery matrix (channel weights, stated plainly)

| Platform | Weight | Engine(s) | Format | Mechanism |
|---|---|---|---|---|
| X @mnemix_official | HEAVY — daily, non-negotiable | Proof + Conversation (replies/QTs) | text, threads, occasional image | Blotato (18856) |
| X @abdur_sayeed | HEAVY — daily | Proof (operator diary) + Conversation | text, threads | Blotato (20072) |
| LinkedIn (Abdur) | MEDIUM — several/wk | Proof (longer form) | text, doc posts, image | Blotato (21401) |
| Instagram (both accts) | LIGHT | Proof visual | carousels, reels | Blotato (48493/48492) — fire path never verified; verify before relying |
| Facebook | LIGHT | mirror of IG | image/video | Blotato (acct id TBD) |
| TikTok | LIGHT | devlog reels | video | Blotato (acct TBD) |
| Reddit | GUIDED ONLY | Conversation | comment/post packets | HUMAN FIRES — never automated (hard rule 8 + refusal floor) |
| HN | GUIDED ONLY | Conversation + Show HN | packets | HUMAN FIRES — never automated |

## 6 · Non-negotiable guardrails (carried forward, none weakened)

1. Every post traces to a real source; no source → no post.
2. Dedupe against the ledger before drafting.
3. Human APPROVE before anything goes live. Replies/comments included — engagement is MORE sensitive than original posts, not less.
4. Reddit + HN are never auto-posted. Packets only, ≤1/day each, human stays in the thread.
5. Replies must add value and be transparently from us (our named accounts) — no astroturfing, no fake accounts, no undisclosed bots. X automation rules apply to reply automation; keep human-in-loop.
6. No secrets in drafts, messages, or committed sources; keys live in Doppler.
7. No claim a command didn't produce. Public-truth lock applies (no "Baylio uses Mnemix"-class present-tense claims about parked projects).
8. Voice: `voice/abdur-voice.md` + banned-phrases lint. Blunt, casual, human. No robotic SaaS copy.
9. Mnemix appears daily; abdur.ai equal priority; parked projects don't get campaigns.

## 7 · Loops & routines (the schedule, consolidated)

| Time (ET) | Routine | Engine |
|---|---|---|
| 08:06 / 08:30 | Proof brains draft (mnemix, abdur-ai) — EXISTS | Proof |
| every 2–4h, 08–23 | Conversation sweep: classify new W4–W6 signals → reply drafts to Slack | Conversation |
| every 30 min, 08–23 | Hands-scheduler: APPROVED → Blotato — EXISTS | both |
| on webhook | W1/W2 events → source capture → (if significant) immediate draft | Proof |
| 20:00 | Buffer monitor — EXISTS | both |
| evening | Daily summary to Telegram — spec'd | both |
| weekly (Sun) | LEARN pass: engagement report → angle priorities; ledger hygiene | both |

## 8 · Skill-ification (make it portable)

Package the whole machine as an Agent Skill: **`content-engine`** (working name).
- **SKILL.md** — the doctrine: stages, guardrails, voice-file contract, approval contract, ledger schema.
- **Parameterized per project:** accounts map, channels map, keyword lists, voice file path, project priorities — a single `engine.config.yaml` per project.
- **Scripts:** watchers (webhook receivers/pollers), classifier prompt, writer prompts, linters, hands-scheduler — the local-brains pattern generalized.
- **Install target:** works under Claude Code / Cowork skills; Codex/Manus/Perplexity get the same doctrine as a briefing doc (they can't run launchd, but can follow the SKILL contract when drafting).
- Reuse path: Mnemix (now) → abdur.ai (same repo) → Dockerfile.ai → HeyCLI.

## 9 · Open decisions (Abdur's call, blocking implementation order)

1. **Pipedream paid tier** — still the blocker for durable cloud hands (STATUS.md item 4). Local hands carry until then.
2. **Reply volume policy** — max replies/day per account (suggest: 5/day X, 2/day LinkedIn to stay credible and inside platform norms).
3. **Video pipeline tooling** — what renders reels? (HeyGen HyperFrames MCP is connected; Higgsfield prompts exist for stills.)
4. **X listener bot** — where does it run today, and what's its output format? Needs a formal handoff into `sources/social-signals/`.
5. **FB/TikTok Blotato accounts** — connect + verify before promising delivery there.
6. **IG fire path** — never verified; verify or drop from v2 launch scope.
7. **Master plan artifact** — the "Portfolio Marketing Master Plan" content needs to be exported from claude.ai into this repo so its per-project strategy overrides/refines this doc.

## 10 · Implementation order (once decisions land)

1. Wire W4 (existing X bot) output → `sources/social-signals/` + signal classifier + reply-writer → Slack gate. (Highest leverage: engine already half-built.)
2. W2 GitHub PR webhook → source capture → proof-writer trigger on merge.
3. W1 Linear webhook (needs Linear MCP/auth reconnected).
4. W5/W6 Reddit + HN listeners → guided-packet generator.
5. Format expander (image/carousel) using existing design briefs; then video.
6. Extract everything into the `content-engine` skill; port to abdur.ai config.
