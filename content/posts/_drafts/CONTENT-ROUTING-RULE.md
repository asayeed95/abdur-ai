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

- `[NEVER-SKIP]` rule in AGENTS.md: "All generated content goes to `content/posts/_drafts/` first. Never write to `content/posts/` or deploy without explicit approval."
- Pre-commit gate (`scripts/check-phase.sh`): any staged `.mdx` file directly under `content/posts/` (i.e. NOT in `_drafts/`) requires a matching `content-publish-override:` entry in `docs/superpowers/specs/overrides.md`, same mechanism already used for the design-token lock. **Not** author-detection — this repo's AI-authored and human-authored commits share the identical git author identity (`abdur@asec.co`), so gating on commit author cannot distinguish them. The override file is the actual enforcement point.
