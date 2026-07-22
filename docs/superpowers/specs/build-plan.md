# build-plan.md — abdur.ai

The only todo list that counts for this repo. `PROCESS.md` explains the discipline; this file is the live task state. Every row: `status: todo | in-progress | blocked | review | done` + last-touched date. Status flips happen in the same commit as the work that caused them.

This file was (re)written 2026-07-08 during a build-discipline retrofit, cross-checked against the actual repo state (git log, file contents) rather than copied from `CLAUDE.md`'s original handoff prose — some of that prose predates work that has since shipped.

---

## Phase 1 — Finish Wiring & Launch (current)

### Done (verified, not just claimed)

| task-id | what | evidence | status |
|---|---|---|---|
| D-1 | Wire `/api/subscribe` to Resend audiences | `app/api/subscribe/route.ts` calls the Resend API with `RESEND_API_KEY` / per-list audience IDs; commit `7122c7f` | done — 2026-07-08 |
| D-2 | Generate OG cover image for flagship post | `public/blog/the-night-the-doctrine-failed/cover.jpg` exists; commit `fc4c370` | done — 2026-07-08 |
| D-3 | Replace `TODO_X_HANDLE` / `TODO_GITHUB_HANDLE` placeholders | `grep -r TODO_X_HANDLE\|TODO_GITHUB_HANDLE` returns nothing outside this doc's own history; `lib/site.ts` has real handles (`@asayeed95`, `github.com/asayeed95`) | done — 2026-07-08 |
| D-4 | Add the 3 backlog posts | `content/posts/voice-ai-memory-latency-is-a-dead-argument.mdx`, `cross-video-retention-pattern-detection.mdx`, `who-owns-the-architecture-when-ai-writes-the-code.mdx` all present alongside the flagship post; commit "content: publish three backlog posts" | done — 2026-07-08 |
| D-5 | Link Vercel project | `.vercel/project.json` present (`projectName: abdur-ai`) | done — 2026-07-08 (link only — see W-2 for live-deploy verification, which is NOT the same claim) |
| D-6 | Wire a real ESLint config so `npm run lint` runs headlessly | `eslint.config.mjs` added (flat config, `next/core-web-vitals` + `next/typescript`); repo previously had zero eslint config, which made `next lint` block on an interactive TTY prompt — unusable in CI/pre-commit | done — 2026-07-08 |

### Open

| task-id | what | notes | status |
|---|---|---|---|
| W-1 | Persist `/api/ingest/now` and `/api/ingest/ship` to Supabase | Both routes are currently documented stubs (`console.log`, `TODO(claude-code)` comment in `now/route.ts`). Schema is specified in `CLAUDE.md` §3 (`now_state`, `ship_log` tables, `profile_id` column for future multi-tenant). Wire the insert/upsert, call `revalidateTag('now')` / `revalidateTag('ship')`, then point `components/NowPanel.tsx` / `components/ShipLog.tsx` at Supabase with the seed data as empty-table fallback. | todo |
| W-2 | Verify production deploy is actually live | Partially verified 2026-07-22: `curl -sI https://abdur.ai` → HTTP/2 200, `/aitldr` → 200, `dig +short abdur.ai A` → `76.76.21.21` (correct Vercel record). Still open: `www` CNAME returned nothing on `dig +short www.abdur.ai CNAME`, and the three social-card validators from `CLAUDE.md` §7 have not been re-run. Homepage CDN cache `age` ≈ 19 days — consistent with no deploy/content change since the 2026-07-02 posts. | todo — deploy confirmed live; validators + www record remain |
| W-3 | (Optional, Phase 2 — deferred) Real Stripe checkout for the `Library` products | `components/Library.tsx` still seeds static `PRODUCTS` with no `/api/checkout` route. Explicitly optional per `CLAUDE.md` §8 — do not start without confirming it's actually next. | todo, low priority |
| C-1 | Publish-readiness review of the stalled launch postmortem (`the-last-fifteen-percent`, in `_drafts/` since 2026-06-28) | Verdict **READY** — `_drafts/the-last-fifteen-percent.REVIEW.md`: every claim verified against git history (`6ede7d1`, `82c5c59`, `ce3fa9c`, `452a959`); missing `tldr` field added (173w, ≤180). Open nits for the human publisher: frontmatter date (02:15) precedes its own fix commits (05:02–05:13); rename `.md` → `.mdx` on publish. Publishing itself is a human action per the CONTENT-ROUTING-RULE. | done — 2026-07-22 (publish gated on Abdur approval) |
| C-2 | "Mistakes TLDR" series: canonical format + first draft batch from repo-event sources | `content/workflows/mistakes-tldr/FORMAT.md` (format contract, pattern-id registry, selection criteria, 2–3/wk cadence, pre-publish checklist) + 8 drafts in `content/posts/_drafts/` (slugs dated 2026-07-22…29, patterns P-017…P-024, all lint-clean, `tldr` ≤180w, each traced to one repo-event record with `Used by:` flipped). Open: P-014 id contested between the launch draft and `mnemix-learning` records — reconcile before shipping either; P-009 undefined in-repo (do not reassign). Awaiting Abdur review per routing rule. | done — 2026-07-22 (publish gated on Abdur approval) |
| C-3 | Surface the series on the site (series badge/feed treatment, pattern index) | Wiring only — no locked files, no copy rewrites. Start once cadence is real (a few published entries). | todo |

## Phase 2 — Stripe + Library checkout (deferred)

Not started. See W-3 above — this whole phase is optional per the original handoff (`CLAUDE.md` §8) and should stay untouched until explicitly prioritized.

## Phase 3 — Notion CMS sync for posts (future)

Not started, not currently planned. Posts stay as MDX in `content/posts/` per `CLAUDE.md`'s "Architecture decisions you should NOT change."

---

## Explicitly out of scope for this build-discipline retrofit

Per the retrofit brief: no external market research, no from-zero blueprint, no 7-phase `/spec/*` pipeline (personas/journeys/ERD/api-contract/etc.) — this project doesn't have the data-model/auth/payments surface those exist to gate. If Phase 2 or 3 above actually kicks off, write real specs for *that* work at that time; don't manufacture specs for phases that aren't happening yet.
