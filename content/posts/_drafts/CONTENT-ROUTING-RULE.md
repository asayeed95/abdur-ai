# Content Routing Rule — abdur.ai

> **Status:** ACTIVE — all agents generating content for abdur.ai MUST follow this rule.
> **Created:** 2026-07-09

## THE RULE

All agent-generated content for abdur.ai goes to `_drafts/` first. No exceptions.

```
ALLOWED:
  ~/projects/abdur-ai/content/posts/_drafts/*.mdx   ← ALL generated content here

FORBIDDEN:
  ~/projects/abdur-ai/content/posts/*.mdx           ← published posts, human-only
  git push to main with content changes              ← draft branch only
  Cloudflare Pages deploy without Abdur's approval   ← never auto-deploy
  Direct writes to /tldr route                       ← draft-first, always
```

## Draft readiness checklist

A draft is "ready for review" when:
1. MDX file is in `_drafts/` with proper frontmatter (title, date, slug, excerpt)
2. Content self-reviewed against abdur-ai CLAUDE.md guidelines
3. TLDR summary (max 180 words) included in frontmatter
4. No secrets, API keys, or internal paths referenced
5. No unverified claims — every assertion backed by a source link or tool output

## Enforcement

- Add `[NEVER-SKIP]` rule to AGENTS.md: "All generated content goes to `content/posts/_drafts/` first. Never write to `content/posts/` or deploy without explicit approval."
- Pre-commit hook: reject commits by non-human authors touching `content/posts/*.mdx` (excluding `_drafts/`)
