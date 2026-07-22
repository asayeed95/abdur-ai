# mnemix 917c80a — fix(api): lock root manifest to public-only routes (#363)
**Receipts:** `git -C mnemix log -1 917c80a` (merged to main) — Abdur Rahman, 2026-07-12

* fix(api): lock root manifest to public-only routes

GET / previously enumerated every internal/legacy route (lookup, contacts,
bulk, interactions, feedback, governance, enrichment, merge, waitlist,
observe, context) to any unauthenticated caller. The public lock (CLAUDE.md)
is the 3 frozen v1 endpoints. Trim the manifest to those plus /health and /mcp.

Kept name/version/description (non-route meta). No internal route names remain.

Verified: tsc --noEmit clean; unit suite 502 passed / 1 skipped (85 files).

* fix(363): dedupe leftover comment header on root manifest

The old "Root — API info" comment survived alongside the new explanatory
block added by this PR. One header, not two.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>

---------

Co-authored-by: Claude Sonnet 5 <noreply@anthropic.com>

**Used by:** content/posts/_drafts/the-routes-that-should-never-have-been-public.mdx
