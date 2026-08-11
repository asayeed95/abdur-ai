# abdur.ai TLDR / blog routine — `@abdur_sayeed` + the site

**abdur.ai is the public founder/operator/media layer for every project — equal priority to Mnemix, not an afterthought.** This routine keeps it fed: TLDRs, posts, blogs, project updates, build logs — constantly.

## Owner

The **abdur.ai Daily Content Brain** (cloud routine — sibling to the Mnemix brain). Generates for `@abdur_sayeed` (X) and the abdur.ai blog. Founder approves; hands schedule.

## Two output types

| Type | Where it drafts | Where it publishes |
|---|---|---|
| **Social** (X operator-diary post/thread) | `../drafts/abdur-ai/` | Blotato → `@abdur_sayeed` (`20072`) |
| **Blog / TLDR** (long-form MDX) | `../posts/_drafts/*.mdx` | human approves → `../posts/*.mdx` → `/aitldr` on deploy |

The blog path obeys the existing **[NEVER-SKIP] CONTENT-ROUTING-RULE**: agent content → `_drafts/` only; `posts/*.mdx` is human-only; never auto-deploy.

## Source material

Real cross-project work: `content/ship-log.json`, recent commits across the portfolio, incident post-mortems, research notes, decisions, transcripts. The operator diary is *about* the actual building.

## Pillars

Operator diary · AI-agent workflows · Claude Code / Perplexity / Pipedream / Blotato / Mac-mini orchestration · anti-vibe-coding discipline · practical AI engineering · founder lessons · design/process/content systems · TLDRs and blogs.

## Voice

The person, not a brand. Normal English, direct, specific, honest about the messy parts. The scar-with-receipts pattern (see `../voice/examples-good.md` #4) is the abdur.ai spine. Usually no CTA — the story is the value.

## Loop

1. Brain reads ship-log + cross-project milestones, dedups against `#abdur-content` + `../ledger/`.
2. For a **social** angle → X draft to `../drafts/abdur-ai/`. For a **blog/TLDR** angle → MDX draft to `../posts/_drafts/` with full frontmatter (title, slug, date, description, tags, source).
3. Send to `#abdur-content` for `APPROVE · EDIT · SKIP`.
4. Social → scheduled via Blotato. Blog → human moves `_drafts/` → `posts/` and deploys.
5. Ledger the result.

## Daily guarantee

`@abdur_sayeed` gets at least one queued post every day. The blog cadence is looser (quality over frequency) but the pipeline never sits empty — there's always a draft in `_drafts/` or `../drafts/abdur-ai/` moving toward approval.
