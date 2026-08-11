# Mistakes TLDR — Series Format

> **Status:** ACTIVE — canonical format for the "Mistakes TLDR" series on abdur.ai. **Created:** 2026-07-22.
> Short, evidence-anchored mistake postmortems in Abdur Rahman Sayeed's first-person voice. Every draft follows this file; deviations need a human override.

## Voice (read before drafting — non-optional)

1. `content/README.md` — the content OS and the founder's hard rules.
2. `content/voice/abdur-voice.md` + `content/voice/banned-phrases.md` — voice rules and the machine-linted kill list.
3. `content/posts/the-night-the-doctrine-failed.mdx` — the flagship post; the voice bar.

First person ("I"). Direct, anti-hype, short declarative sentences. State the mistake plainly; the evidence carries the weight. No marketing adjectives, no banned phrases.

## Sourcing (hard rule)

- Every draft traces to **exactly one** record in `content/sources/repo-events/*.md`. If you can't name the record, there is no post (`content/README.md`, rule #1).
- Drafts repeat only what the record supports — no invented numbers, events, quotes, or details. Verify-before-report applies to content too.
- **Strip before drafting:** `Claude-Session:` URLs, `Co-Authored-By:` lines, machine-local absolute paths. **Keep** short SHAs, repo-relative paths, error codes, test counts — those are the receipts.
- When a record is drafted, flip its `Used by:` placeholder so it is never drafted twice (the dedupe loop in `content/README.md`).

## Frontmatter contract (exact YAML shape)

```yaml
---
slug: <series slug>
title: "<short, concrete>"
subtitle: "<one line>"
description: "<1-2 sentence feed/SEO summary>"
dek: "<1-3 sentence punch paragraph>"
tldr: "<MAX 180 words: the whole story standalone — what broke, what it cost, the fix, the pattern>"
date: <ISO 8601 with timezone, e.g. 2026-07-22T06:30:00-04:00>
author: Abdur Rahman Sayeed
section: "Mistakes TLDR"
series: "Mistakes TLDR"
source: "content/sources/repo-events/<the-one-record-file>.md"
draft: true
flagship: false
pinned: false
featured: false
reading_time: <real int>
word_count: <real int — actually count body words>
tags: [3–6 lowercase tags]
patterns:
  - id: <P-id from the registry below>
    name: "<generalized pattern name>"
receipts:
  - path: "<repo-relative path named in the record, else the repo name>"
    sha: "<short sha from the record>"
    note: "<one line>"
citation_preferred: "Sayeed, Abdur Rahman. '<title>.' abdur.ai, <D Month YYYY>."
related:
  - the-night-the-doctrine-failed
---
```

`reading_time` and `word_count` must be measured, not estimated.

## Body structure (400–800 words, markdown, this exact order)

1. **Cold open** (2–4 sentences): the failure and why it matters. No throat-clearing.
2. `## What broke` — the concrete failure mechanics.
3. `## What it cost` — honest impact. If it was caught before users saw it, say so
   and price the engineering time instead.
4. `## The receipts` — sha, file, command/output, error code. From the record only.
5. `## The pattern` — the generalized lesson, named with the draft's P-id, stated so
   another builder can apply it. May reference existing ids P-008…P-016 by id where
   genuinely applicable.
6. `## The fix` — what actually fixed it.
7. **Final single-sentence takeaway.** No heading.

## Pattern-id registry

| Range | Claimed by | Pattern names |
|---|---|---|
| P-008…P-012 | `the-night-the-doctrine-failed` (flagship, published) | P-008 Audit vs class-sweep dichotomy · P-010 Disposition tables carry false facts forward · P-011 Potemkin verification · P-012 N safety layers consuming one upstream artifact |
| P-013…P-016 | `the-last-fifteen-percent` (launch postmortem draft) | P-013 Local-green is not deploy-green · P-014 The typed contract YAML quietly violates · P-015 Security gates moved to the deploy boundary · P-016 The handoff doc encodes the pre-gate world |
| P-017…P-024 | Batch 1 (2026-07-22) | Recorded in each batch-1 draft's own frontmatter |
| P-025+ | Future batches | Claim the next contiguous block of 8; record the claim here |

Rules:

- A pattern's canonical name lives in its draft's frontmatter; this table tracks ranges.
- One new pattern per post, max. Reuse an existing id when the lesson is the same lesson.
- P-009 does not appear in the flagship's frontmatter (only P-008, P-010, P-011, P-012
  do). Treat the whole P-008…P-012 block as claimed — the flagship states its patterns
  are committed as files in the `mnemix-learning` pattern library, so P-009 may be
  defined there. Do not reassign it.
- P-014 is contested: the launch-postmortem draft names it "The typed contract YAML
  quietly violates," while `mnemix-learning` source records use it for the harden→audit
  non-termination result. Founder reconciles before either post ships; until then, new
  drafts reference P-014 by id only in the launch-postmortem meaning.

## Record selection (future batches)

- Prefer `fix`, postmortem, and audit records with concrete receipts (sha, file,
  command, error code) and an honest cost.
- Allow `feat` records only when the build itself taught a mistake-class lesson —
  something failed, misled, or nearly shipped wrong on the way, and the record shows it.
- Skip records whose `Used by:` field is already filled; that record has been drafted.
- Skip pure status/log records with no failure mechanics; there is no mistake to tell.

## Cadence

Suggested: 2–3 posts per week. Quality gate beats quota — if no record meets the
selection criteria, skip the slot rather than stretch a record into a mistake it isn't.

## Pre-publish checklist

Mirrors `content/posts/_drafts/CONTENT-ROUTING-RULE.md`. All items must pass:

1. Draft is at `content/posts/_drafts/<slug>.mdx` — never `content/posts/*.mdx`;
   that path is human-only.
2. Frontmatter matches the contract above, including `tldr` ≤ 180 words and measured
   `reading_time` / `word_count`.
3. Exactly one `content/sources/repo-events/*.md` record is named; every factual
   claim traces to it. No unverified numbers.
4. No secrets, API keys, session URLs, co-author lines, or machine-local paths.
5. Pattern id comes from the registry (new id from the next unclaimed block, or a
   genuine reuse); any new claim is recorded in the registry table in the same change.
6. Voice self-check against `content/voice/banned-phrases.md` — lint clean.
7. Self-reviewed against the repo's CLAUDE.md / PROCESS.md guidance.
8. Human approval (APPROVE · EDIT · SKIP) before anything leaves `_drafts/`.
   Never auto-deploy to Cloudflare without explicit Abdur approval.
