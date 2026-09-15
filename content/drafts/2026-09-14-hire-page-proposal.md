# /hire refresh proposal — 2026-09-14

**Status:** PROPOSAL. Per session law, nothing here touches `app/` — this file is the proposal; the page edit is a separate, approved change.
**Current page:** `app/hire/page.tsx`, rebuilt from the v4 design reference on 2026-09-04 (build-plan H-3). The page is only ten days old, so this proposal is a delta, not a rebuild.
**Evidence base:** `app/hire/page.tsx` as read in full this session, plus `docs/superpowers/specs/build-plan.md` and git log. Anything not verifiable from this checkout is marked NOT VERIFIED.

---

## Verdict: structurally current, three dated claims need attention

The v4 rebuild holds up: literal status labels, the corrections narrative, the claims-policy-verbatim Northsun identity line, and the dual-brand law are all intact. Three items have aged or can now be strengthened:

### 1. `REPO_COUNTS` dateline (staleness by design, but due)

The block is dated "Counted in the repository · main · 2026-09-03" and the code comment says: *"If you change the dateline, re-run the counts."* Eleven days have passed and the Northsun repo is active; the counts (330 test files, 15 workflows, 16 packages, `@mnemix-ai/client` v0.2.2) are presumably close but NOT VERIFIED as of today — this session cannot touch that worktree.

**Proposed action:** Abdur (or a session with Northsun access) re-runs the `git ls-tree` counts against current `origin/main` and bumps the dateline. The page's own comment already encodes the rule; this proposal just flags that it's due.

### 2. Case-study status pill: "build in progress" understates it

The pill reads *"Design complete · four independent reviews · build in progress."* Per build-plan C-4, Content-ops Slice 1 is **code complete** (51 offline tests green, acceptance criteria mapped) and has been in `review` since 2026-07-22, with live release founder-gated. "Build in progress" was accurate when written; it now undersells the state by one phase.

**Proposed pill text:** *"Design complete · four independent reviews · first slice code-complete, in review"*

**Receipt:** build-plan C-4 row (status `review — 2026-07-22 (code complete on content/content-ops-slice1; launchd install + live release founder-gated)`).

### 3. September's shipped work is invisible on the page

Since the rebuild, this repo merged three things that belong in a "how I work" story and currently appear nowhere on /hire:

- **Claim registers enforced at build time** (C-10, 2026-09-04): every post on the site declares `reported` / `designed` / `argued`, a `reported` post without receipts fails the build. This is the strongest public proof of the "gates that fail loudly" card and it's one click away (`content/posts/REGISTERS.md`).
- **Analytics that actually records** (A-1, 2026-09-04): the previous conversion events were silent no-ops with no provider loaded — caught, fixed, and logged in RETRO. A live example of the "verify the substrate, not the name" card.
- **SEO/AEO sweep** (S-1, merge #49, 2026-09-10): 28 pages' snippets brought within SERP budget, including the invariant that /now's meta description derives from its rendered date.

**Proposed placement (choose one, my recommendation is the first):**
1. Add one sentence to the "gates that fail loudly" card in `WHAT_I_BUILD`: *"This site is the demo: a post that declares a reported claim without receipts fails its own build."* — receipt: `scripts/check-public-claims.py` + REGISTERS.md.
2. Or extend the case-study section with a "what shipped since" line listing the three items with dates.

## What I deliberately did NOT propose changing

- **The `SYSTEMS` cards.** Northsun "In development · SDK on npm · not GA", Relay "Deployed pilot · in review", BrowseFlow / HeyCLI "Working prototype", Dockerfile.ai "Shipped" — I cannot verify any status change from this checkout. Leave every label as-is until its owning repo says otherwise. NOT VERIFIED is a reason to keep the label, not to change it.
- **`REVIEW_FINDINGS` and the corrections narrative.** Historical record; historical claims don't expire.
- **`DELIVERY` dates and bodies.** Client history, unchanged by September.
- **`OPEN_TO_ROLES`.** Read from `lib/site.ts`; whether the badge shows is Abdur's call, not a content decision I can verify.
- **The OG/share card.** A hire-specific card shipped 2026-09-07 (merge #46) — already current.

## One-line summary for the commit message, if accepted

`content: /hire delta — case-study pill to code-complete, gates card gains build-enforced receipts line, repo-count dateline flagged for re-count`
