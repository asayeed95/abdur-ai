# Content Operating System

This directory is the **single source of truth** for how real work becomes truthful, published content across the portfolio. If you are an agent (or a human) about to write, schedule, or post *anything* public, you start here.

The mission, in one sentence: **turn real work into honest content, document where it came from, never duplicate a post, get it approved by a human, and publish it through the right tool — keeping abdur.ai and Mnemix visible every single day without sounding like a robot.**

Projects covered: **Mnemix · abdur.ai · dockerfile.ai · heycli · mnemix-learning**.

---

## The one non-negotiable: every post traces to real work

No post exists without a source. Before a draft is written, it points back to a **repo change, screenshot, transcript, TLDR, bug, demo, decision, research note, or build log**. If you can't name the source, there is no post. This is what makes the content truthful instead of hype — and it's rule #7 of the founder's directive, not a nice-to-have.

Sources live in `sources/`. Every draft's frontmatter carries a `source:` field pointing at one.

---

## Two publishing surfaces — do not confuse them

| You are drafting… | It goes to… | Approved copy lands in… | Published via… |
|---|---|---|---|
| **A blog post / TLDR for the abdur.ai site** (MDX, long-form) | `posts/_drafts/*.mdx` | `posts/*.mdx` (human-only, per CONTENT-ROUTING-RULE) | the Next.js site → `/aitldr` feed on deploy |
| **A social post** (X thread, LinkedIn, IG carousel) for any project | `drafts/<project>/` | `approved/<project>/` | Pipedream → Blotato → the platform |

The abdur.ai **site blog** already has a governing rule: **[NEVER-SKIP] all agent blog content goes to `posts/_drafts/` first; `posts/*.mdx` is human-only; never auto-deploy** (`posts/_drafts/CONTENT-ROUTING-RULE.md`). That rule stands. This OS wraps the **social + cross-project** pipeline around it.

---

## The loop (every piece of content walks this path)

```
1. CAPTURE   real work → sources/  (repo-events, screenshots, tldrs, transcripts, research, design-refs)
2. DEDUPE    read ledger/ + drafts/ + approved/ + published/ BEFORE writing. Already covered? Stop.
3. DRAFT     write to drafts/<project>/ (social) or posts/_drafts/ (abdur.ai blog),
             in Abdur's voice (voice/), traceable to a source, with frontmatter.
4. APPROVE   push to Slack/Telegram → human replies APPROVE · EDIT · SKIP.
5. SCHEDULE  on APPROVE → move to approved/<project>/ → Pipedream schedules via Blotato
             (veto window: deletable until fire).
6. PUBLISH   Blotato fires → move to published/<project>/ → append to ledger/posted.jsonl.
7. RECORD    every state change writes a ledger line. The ledger is the memory.
```

Nothing skips step 2 (dedupe) or step 4 (human approval). Nothing auto-posts to Reddit or Hacker News (see below).

---

## Who owns what

| Owner | Responsibility |
|---|---|
| **Mac-mini agents** (this repo, Pi5, cloud brains) | repo truth, source capture, draft generation, `content/` updates, duplicate checks |
| **Pipedream** | schedules, webhooks, approval routing, retries, alerts, calling Blotato |
| **Blotato** | final social scheduling/publishing to X, LinkedIn, IG, etc. |
| **Slack / Telegram** | human approval, veto, edits, failure alerts, daily summaries, publish confirmations |
| **This content directory** | memory, traceability, source refs, duplicate prevention, cross-agent continuity |

**Architecture principle (locked 2026-07-09):** Pipedream is the durable **orchestration layer** — schedules, webhooks, approvals, retries, calling Blotato. Pi5 / Mac-mini are used **only where local repo, filesystem, or secret access is required** (source capture, draft generation from private repos, the interim scheduler until Pipedream owns it). Don't build long-term orchestration on Pi5 that Pipedream should own.

---

## Directory map

```
content/
  README.md              ← you are here
  STATUS.md              ← what's implemented NOW vs needs secrets / APIs / approval
  calendar/              ← planned posting schedule (what fires when, per project)
  ledger/                ← the memory. Append-only. dedupe reads this first.
    README.md            ← ledger schema + dedup rules
    posted.jsonl         ← everything that went live
    scheduled.jsonl      ← queued in Blotato, not yet fired
    rejected.jsonl       ← SKIP'd / vetoed drafts (so we don't regenerate them)
    duplicate-candidates.jsonl  ← flagged near-dupes for human check
  sources/               ← raw material. Every draft cites one of these.
    repo-events/ screenshots/ tldrs/ transcripts/ research/ design-refs/
  drafts/<project>/      ← social drafts awaiting approval
  approved/<project>/    ← approved, handed to the scheduler
  published/<project>/   ← went live (archive + proof)
  voice/                 ← how every agent must write. READ BEFORE DRAFTING.
    abdur-voice.md banned-phrases.md examples-good.md examples-bad.md
  design/                ← visual briefs. Every visual supports a content angle.
    abdur-ai-design-system.md mnemix-design-system.md
    higgsfield-prompts/ carousel-briefs/ motion-briefs/ image-briefs/
  workflows/             ← the automation specs
    pipedream/ blotato/ slack-telegram/
  posts/                 ← abdur.ai SITE blog (existing; MDX → /aitldr). posts/_drafts/ = agent staging.
  distribution/          ← per-post distribution assets (existing)
  ship-log.json          ← the abdur.ai homepage ship log (existing)
```

---

## Accounts & channels (where content actually goes)

**X accounts** (both matter):
- `@abdur_sayeed` — **personal / founder-operator voice.** abdur.ai content, cross-project operator diary, lessons. Blotato account id `20072`.
- `@mnemix_official` — **project voice.** Mnemix must appear here **every day.** Blotato account id `18856`.

Other Blotato accounts: LinkedIn (Abdur) `21401` · IG mnemix.ai `48493` · IG asayeed95 `48492`. *Re-verify ids at schedule time — see `workflows/blotato/`.*

**Approval channels (Slack):** `#mnemix-content` (`C0BAMF2P4L8`) for Mnemix; abdur.ai + other projects route to their own content channel (see `workflows/slack-telegram/`). Telegram (founder DM) mirrors approvals + carries failure alerts and the daily summary.

---

## Hard rules (from the founder directive — violate none)

1. **Keep drafting constantly** for abdur.ai — TLDRs, posts, blogs, project updates, build logs. The queue is never empty.
2. **abdur.ai is not secondary.** It is the public founder/operator/media layer for every project. Equal priority to Mnemix.
3. **Mnemix shows up every day**, especially through `@mnemix_official`.
4. **Truth, clearly told.** No fake hype. No robotic SaaS voice. No fabricated claims. No "AI will change everything" filler. Sound like Abdur — see `voice/`.
5. **Every idea is traceable** to a real source (rule at the top of this doc).
6. **Dedupe before you draft.** Read `ledger/` + `drafts/` + `approved/` + `published/`. Never repeat a live angle.
7. **Human approval before anything goes live.** APPROVE · EDIT · SKIP through Slack/Telegram.
8. **Never auto-post to Reddit or Hacker News.** Prepare *guided* drafts only (sub/thread/timing/seed comment). A human fires them, stays in the thread. Both platforms ban automation — auto-posting burns the reputation. Cap ≤1 each/day. Only override with explicit founder approval of a specific manual/public-launch workflow.
9. **Never publish a secret.** No API keys, tokens, webhook URLs, internal paths, or unscrubbed transcripts in any draft or committed source.
10. **Never claim a number a command didn't produce.** Verify-before-report applies to content too — a benchmark, a latency, a user count you can't point to is a lie, cut it.

---

## Quick start for an agent

1. Read `voice/abdur-voice.md` + `voice/banned-phrases.md`. Non-optional.
2. Pick a source from `sources/` (or capture one from real work first).
3. Run the dedup check (`ledger/README.md` tells you how).
4. Draft to `drafts/<project>/` (social) or `posts/_drafts/` (abdur.ai blog), with a `source:` ref.
5. Hand to approval (`workflows/slack-telegram/`).
6. Let Pipedream + Blotato schedule/publish on approval. Record every step in `ledger/`.

If anything is ambiguous, check `STATUS.md` — it says exactly what is wired now and what still needs a secret, an API, or Abdur's decision.

*Last updated 2026-07-09.*
