# /now refresh proposal — 2026-09-14

**Status:** PROPOSAL. Per session law, nothing here touches `app/` — this file is the proposal; the page edit is a separate, approved change.
**Current page:** `app/now/page.tsx`, static copy, `UPDATED = "June 27, 2026"` — roughly eleven weeks stale as of this writing.
**Evidence base:** only what this repo's own docs and git history show. Anything I could not verify from this checkout is marked NOT VERIFIED.

---

## What actually shipped since the June 27 snapshot (verified in this repo)

**September (per `docs/superpowers/specs/build-plan.md` and git log):**

- 2026-09-04 — `/writing` is now the canonical post surface: index, per-post pages, RSS, JSON-LD, and sitemap moved; `/aitldr/*` still serves but emits `rel=canonical` at `/writing`. Posts declare one of three claim registers (`reported` / `designed` / `argued`), enforced at build time. (build-plan C-10)
- 2026-09-04 — Four `reported` Mistakes TLDR pieces published, each with receipts in frontmatter (build-plan C-11); six more drafts remain in `_drafts/` awaiting review.
- 2026-09-04 — `/api/ingest/now` and `/api/ingest/ship` now persist to Supabase with RLS and idempotent retried-delivery handling; live-verified. Not yet deployed. (build-plan W-1)
- 2026-09-04 — Site-wide clock-resolved light theme with a tri-state toggle (build-plan H-2); `/hire` rebuilt from the v4 design reference with repo counts re-verified against `origin/main` (H-3).
- 2026-09-04 — Analytics wired for real: `@vercel/analytics` with a typed `trackEvent` wrapper; the old `window.plausible`/`window.va` call sites were silent no-ops. (build-plan A-1, RETRO.md)
- 2026-09-05 — Subscribe flow hardened: clock-skew-safe min-fill, restored welcome email, subscriber attribution as contact properties (merge #44, A-2).
- 2026-09-07 — `/hire` serves the current ATS résumé and emits a hire-specific OG/Twitter share card (merges #46, #48).
- 2026-09-10 — SEO/AEO pass: 28 pages' SERP snippets brought within budget; `/now`'s meta description now derives from the rendered snapshot date so the snippet can never claim freshness the page does not show (merge #49, S-1).

**August (per post frontmatter in `content/posts/`):** three evidence-discipline pieces published — the phone-keying failure class (Aug 23), the synthetic-pager evidence-states piece (Aug 22), and the CI gate that nothing ran (Aug 25).

**NOT VERIFIED:** anything shipped in the other portfolio repos (Northsun, HeyCLI, Dockerfile.ai) since June — this session is forbidden from touching those worktrees, so their recent state is invisible from here. The June 27 bullets about the Northsun warm path and heycli idle cost may be stale; I cannot confirm or refute them from this repo.

---

## Proposed new /now copy (drop-in structure, same sections as current)

> **Last updated · September 14, 2026**
>
> **This week**
> **The 2026-09-14 essay batch.** Six essays in review, all in the evidence-before-claims register system: memory as governance, the two-clocks fact model, erasure that survives caches, the review gates behind a twenty-session agent practice, the phone-as-viewport session model, and the claims rule itself. Drafts sit in review; publishing is a human decision.
>
> **Recently shipped**
> - `/writing` is the canonical post surface now, with claim registers enforced at build time — a post that can't type its claims doesn't compile.
> - Four receipted postmortems from the CI-gate lane, plus three August evidence-discipline pieces.
> - The ingest webhooks persist for real (Supabase, RLS, idempotent retries) — awaiting deploy.
> - Site-wide light theme that resolves on the visitor's clock; a rebuilt /hire page whose status labels are literal.
> - Analytics that actually records (the previous call sites were silent no-ops — now in RETRO).
>
> **What's next**
> - Deploy the September stack (W-1 routes, C-10 surface, H-2 theme, A-1 analytics) — everything above marked 2026-09-04 is merged but intentionally undeployed.
> - The remaining six Mistakes TLDR drafts through review.
> - Promote the BEAD write-up from draft to published once the essay batch clears review.

**Copy notes for whoever edits the page:**
- Keep the S-1 invariant: `UPDATED` stays the single source for both the rendered date and the meta description (`app/now/page.tsx` lines 6–15).
- The June 27 bullets on Retention Lab clustering and the BEAD post promise can be retired: BEAD is now written (draft b), and Retention Lab has no verified September signal from this repo.
- Every bullet above maps to a build-plan row or commit SHA; do not add bullets from memory.

---

## Structural suggestion (optional, not part of the copy)

W-1's `now_state` table exists precisely to make this page data-driven. Once the ingest routes deploy, the static-copy page could render from `now_state` with the snapshot date derived from the row's `updated_at` — making "stale /now page" mechanically impossible rather than a discipline problem. That is a wiring proposal, not a copy one; it deserves its own task-id if Abdur wants it.
