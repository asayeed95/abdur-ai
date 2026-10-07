# Overrides — design/content lock exceptions

Every edit to `tailwind.config.ts` / `app/globals.css` or rewrite of existing
copy needs an entry here before it ships.

---

design-token-override: 2026-08-23 — AITLDR-LAYOUT-001 residual (AGE-886).
Founder-directed DEMO, explicitly unlocked: add `--aitldr-*` CSS variables
(`--aitldr-measure`, `--aitldr-title-to-date`, `--aitldr-date-size`,
`--aitldr-date-tracking`, `--aitldr-figure-max`) and their consumer classes
(`.aitldr-measure`, `.aitldr-dateline`, `.aitldr-figure`) to
`app/globals.css`. Locked Clay tokens (palette, fonts, existing prose rules)
untouched; `tailwind.config.ts` untouched; no post copy changed. Not a
design-system lock — Revenue still owns reader accept.

design-token-override: 2026-08-23 — SUBSCRIBE-002 voice (founder-directed).
Abdur supplied the exact Subscribe-form + welcome-email copy for the TLDR
list. `components/Subscribe.tsx`: eyebrow → "The logbook, not the pitch.",
body paragraph → "When I learn it the hard way, you get the TLDR the same
week. Pager is not the customer. The number is not the person. More of
that as I write it. Not a product tour. Not a waitlist for a platform that
is not done.", button idle label → "Subscribe" (arrow dropped), success
message → "You're on the list. Next lesson hits email when it ships." The
old h2 headline ("Get the TLDR in your inbox.") is removed at the founder's
direction (he specified Eyebrow + Body + Button + Success, no headline).
`app/api/subscribe/route.ts` welcome-email body rewritten in the same
voice; no closer, no price, no northsun.ai link. No claims rewritten —
"Pager is not the customer" / "The number is not the person" reference
already-published posts. `tailwind.config.ts` / `app/globals.css` / post
copy untouched.

```yaml
- task-id: <id from build-plan.md>
  design-token-override: <locked-file>   # write the real filename; placeholder is deliberately non-matching so this example can never satisfy the gate
  reason: <why this specific change is warranted — not "needed a color">
  approved-by: <name/date>
```

`scripts/check-phase.sh` looks for a `design-token-override:` line naming the exact locked file that's staged. A vague or missing entry does not pass the gate.

```yaml
- task-id: <id from build-plan.md>
  content-publish-override: content/posts/<slug>.mdx   # exact published path (the <slug> placeholder cannot match a real staged file)
  reason: <why this is going straight to published, not through _drafts/>
  approved-by: <name/date>
```

`scripts/check-phase.sh` looks for a `content-publish-override:` line naming the exact published-path file that's staged. A vague or missing entry does not pass the gate.

## Active founder-authorized public-truth correction

The founder-locked Public Value, Trust, and Mnemix Readiness Rule (2026-07-29)
requires every public claim and offer to be demonstrably true. These are
corrections to already-public TLDRs, not new content or a bypass of review.

- task-id: C-7
  content-publish-override: content/posts/voice-ai-memory-latency-is-a-dead-argument.mdx
  reason: Replace an unverified latency benchmark with the canonical evidence-bound design target.
  approved-by: Abdur / founder-locked public-truth rule / 2026-07-29
- task-id: C-7
  content-publish-override: content/posts/who-owns-the-architecture-when-ai-writes-the-code.mdx
  reason: Remove an unverified latency benchmark from a public technical claim.
  approved-by: Abdur / founder-locked public-truth rule / 2026-07-29

## C-10 — register system on the four already-published posts

Founder instruction, live session 2026-09-04: every post declares its register
(`reported` / `designed` / `argued`) in frontmatter. These four are already
public; the edits add `register:` (plus `status_note:` where the default would
misstate the piece) and, on the flagship, remove a retired branding phrase the
claims gate flags. No argument, evidence, or conclusion in any post is changed.

- task-id: C-10
  content-publish-override: content/posts/the-night-the-doctrine-failed.mdx
  reason: Add `register: reported`; drop retired branding phrase 'contextual intelligence platform' (claims_policy RETIRED_PHRASES).
  approved-by: Abdur / live session / 2026-09-04
- task-id: C-10
  content-publish-override: content/posts/cross-video-retention-pattern-detection.mdx
  reason: Add `register: designed` + status_note — the post describes work being built, not shipped.
  approved-by: Abdur / live session / 2026-09-04
- task-id: C-10
  content-publish-override: content/posts/voice-ai-memory-latency-is-a-dead-argument.mdx
  reason: Add `register: argued` + status_note naming the latency figure as a design target, not a measurement.
  approved-by: Abdur / live session / 2026-09-04
- task-id: C-10
  content-publish-override: content/posts/who-owns-the-architecture-when-ai-writes-the-code.mdx
  reason: Add `register: argued`.
  approved-by: Abdur / live session / 2026-09-04

## C-11 — publish four Mistakes TLDR drafts

Founder instruction, live session 2026-09-04: "Pick 4 drafts from
content/posts/_drafts, finish them, publish." This is the explicit human
publish action CONTENT-ROUTING-RULE.md reserves. All four are `register:
reported` and carry a `receipts:` block with commit SHAs and PR numbers; each
was read end-to-end and verified against the C-2 draft-readiness checklist
before promotion. Drafts carrying the contested P-014 pattern id (see
build-plan C-2) were deliberately not selected.

- task-id: C-11
  content-publish-override: content/posts/29-review-rounds-hardened-a-ci-gate-that-nothing-ran.mdx
  reason: Reported, receipts at 6a7442f1. Also corrected an X handle that disagreed with lib/site.ts.
  approved-by: Abdur / live session / 2026-09-04
- task-id: C-11
  content-publish-override: content/posts/the-dashboard-query-rls-wouldnt-let-through.mdx
  reason: Reported, receipts at aee3f57 / PR #433, root cause verified live before the fix.
  approved-by: Abdur / live session / 2026-09-04
- task-id: C-11
  content-publish-override: content/posts/the-health-check-that-became-a-retry-storm.mdx
  reason: Reported, receipts at 6dcc316 / PR #431, SDK behaviour verified against the installed build.
  approved-by: Abdur / live session / 2026-09-04
- task-id: C-11
  content-publish-override: content/posts/the-meter-that-counted-cache-hits-as-cash.mdx
  reason: Reported, receipts at 21326b0 / PR #406.
  approved-by: Abdur / live session / 2026-09-04

## H-2 — site-wide light theme (clock-resolved)

Founder decision, live session 2026-09-04, on the /hire v4 design reference
(`docs/hire-page/hire-v4/`). The site gains a light theme, resolved per visitor:
an explicit choice in `localStorage["abdur-theme"]` wins; otherwise the local
clock (light 06:00–17:59, dark 18:00–05:59); otherwise dark. The toggle is
tri-state (Auto → Light → Dark → Auto) and lives in the site-wide nav.

This cannot be done without editing both locked files. Tailwind compiles the
palette to hex literals, and a literal cannot be re-themed at runtime — the
colours must become `rgb(var(--c-*) / <alpha-value>)` so the channel values can
be swapped per theme while opacity utilities (`border-clay/40`, `bg-bg/85`)
keep working.

**Dark output is unchanged, and that is verified, not asserted.** Both builds
were compiled and their stylesheets compared with the token vars resolved to
their dark channel values: 436/436 compiled CSS rules identical, 0 differing.
A pixel diff of three pages agreed — 114 of 2,048,000 px, every one inside the
`animate-pulse-clay` dot caught mid-cycle (bbox x39-46 y24-31), max channel
delta 10.

- task-id: H-2
  design-token-override: tailwind.config.ts
  reason: Palette hex literals -> rgb(var(--c-*) / <alpha-value>) so a light theme can swap channel values at runtime. Dark values verified byte-identical (436/436 compiled rules).
  approved-by: Abdur / live session / 2026-09-04
- task-id: H-2
  design-token-override: app/globals.css
  reason: Channel triples in :root (dark, and the no-JS fallback), a :root[data-theme="light"] block, per-theme color-scheme, and the two hardcoded selection/focus hexes made theme-aware.
  approved-by: Abdur / live session / 2026-09-04


## SUBSCRIBE-002 — record carried from main (2026-08-23)

design-token-override: 2026-08-23 — SUBSCRIBE-002 second list (founder-directed).
Extend the welcome to the mnemix-beta (Northsun waitlist) list: a second
real Resend send with now-vs-later copy — logbook now, Northsun when it
opens, no price, no access-now claim. `app/api/subscribe/route.ts`
`sendWelcomeEmail` now branches per list. Homepage waitlist copy matched:
`components/NorthsunWaitlistForm.tsx` button drops the arrow and the
success line becomes "Logbook now, Northsun when it opens.";
`components/MnemixSection.tsx` adds one now-vs-later line above the form.
Welcome-email copy is shipped verbatim per founder direction (subjects
"You're on the logbook" / "You're on the list"; bodies as written; no
eyebrow, no h1, no closer, no price, no archive link). Required
public-truth values untouched (identity h2, verbatim closer blockquote,
`NorthsunWaitlistForm`, `mnemix-beta` list id). No closer added on emails;
no price; no northsun.ai link. `tailwind.config.ts` / `app/globals.css` /
post copy untouched.

## C-10 (rebase) — registers on the two posts main published after the branch point

Discovered while rebasing onto `origin/main@d9257e9` (2026-09-04): main carries
two posts published in August that this branch had never seen. The register
gate refused the build on both, correctly. Registers assigned from each post's
own text; the `reported` post's receipts are lifted verbatim from claims the
body already makes, not authored.

- task-id: C-10
  content-publish-override: content/posts/your-pager-is-not-your-customer.mdx
  reason: Add `register: reported` + a receipts block transcribed from the body's own Sentry first-seen timestamp and re-check date. No prose changed.
  approved-by: Abdur / "go ahead" live session / 2026-09-04
- task-id: C-10
  content-publish-override: content/posts/the-number-is-not-the-person.mdx
  reason: Add `register: argued` + status_note — the post is grounded in public vendor docs and explicitly declines to claim an incident. No prose changed.
  approved-by: Abdur / "go ahead" live session / 2026-09-04


## C-11 (review) — Editor's note on the three new posts whose bodies predate the rename

Same pattern main applied to the two August posts: one italic note at the top
naming the rename, no body prose changed. Raised by review on #39.

- task-id: C-11
  content-publish-override: content/posts/the-dashboard-query-rls-wouldnt-let-through.mdx
  reason: Add main's verbatim Editor's note (Mnemix → Northsun rename). No other change.
  approved-by: Abdur / "do all the work" live session / 2026-09-05
- task-id: C-11
  content-publish-override: content/posts/the-health-check-that-became-a-retry-storm.mdx
  reason: Add main's verbatim Editor's note. No other change.
  approved-by: Abdur / "do all the work" live session / 2026-09-05
- task-id: C-11
  content-publish-override: content/posts/the-meter-that-counted-cache-hits-as-cash.mdx
  reason: Add main's verbatim Editor's note. No other change.
  approved-by: Abdur / "do all the work" live session / 2026-09-05

## S-1 — SEO/AEO audit: meta descriptions and SERP titles

A live audit of abdur.ai (2026-09-10) found 12 of 15 pages shipping meta
descriptions past Google's ~155-character truncation (worst: 293) and four
`<title>` values past ~60 (worst: 88). Every SERP snippet the site owns was
being cut mid-sentence.

These edits touch post frontmatter only — `description` (the meta tag) is
rewritten as a complete thought within budget, and the previous longer copy is
preserved verbatim as `dek` where a post had none, so index-card teasers are
unchanged. Four posts gain an optional `seo_title`, used for `<title>` only;
every article's h1 and body prose are untouched.

- task-id: S-1
  content-publish-override: content/posts/29-review-rounds-hardened-a-ci-gate-that-nothing-ran.mdx
  reason: description 248 -> 150; seo_title added (SERP title was 64).
  approved-by: Abdur / "go with your recommendation" live session / 2026-09-10
- task-id: S-1
  content-publish-override: content/posts/cross-video-retention-pattern-detection.mdx
  reason: description 237 -> 149; seo_title added (SERP title was 78).
  approved-by: Abdur / "go with your recommendation" live session / 2026-09-10
- task-id: S-1
  content-publish-override: content/posts/the-dashboard-query-rls-wouldnt-let-through.mdx
  reason: description 271 -> 152.
  approved-by: Abdur / "go with your recommendation" live session / 2026-09-10
- task-id: S-1
  content-publish-override: content/posts/the-health-check-that-became-a-retry-storm.mdx
  reason: description 266 -> 146.
  approved-by: Abdur / "go with your recommendation" live session / 2026-09-10
- task-id: S-1
  content-publish-override: content/posts/the-meter-that-counted-cache-hits-as-cash.mdx
  reason: description 242 -> 148.
  approved-by: Abdur / "go with your recommendation" live session / 2026-09-10
- task-id: S-1
  content-publish-override: content/posts/the-night-the-doctrine-failed.mdx
  reason: description 164 -> 144.
  approved-by: Abdur / "go with your recommendation" live session / 2026-09-10
- task-id: S-1
  content-publish-override: content/posts/the-number-is-not-the-person.mdx
  reason: description 253 -> 148; prior copy preserved verbatim as the post's first dek.
  approved-by: Abdur / "go with your recommendation" live session / 2026-09-10
- task-id: S-1
  content-publish-override: content/posts/voice-ai-memory-latency-is-a-dead-argument.mdx
  reason: description 206 -> 141 with no latency figure; seo_title added (SERP title was 72).
  approved-by: Abdur / "go with your recommendation" live session / 2026-09-10
- task-id: S-1
  content-publish-override: content/posts/who-owns-the-architecture-when-ai-writes-the-code.mdx
  reason: description 217 -> 151; seo_title added (SERP title was 88, the worst on the site).
  approved-by: Abdur / "go with your recommendation" live session / 2026-09-10
- task-id: S-1
  content-publish-override: content/posts/your-pager-is-not-your-customer.mdx
  reason: description 194 -> 147.
  approved-by: Abdur / "go with your recommendation" live session / 2026-09-10
- task-id: P-1 (AGE-2394)
  copy-override: components/Hero.tsx, components/About.tsx, app/about/page.tsx (meta description), lib/site.ts (SITE.location)
  reason: current address is Prospect Park, NJ (West New York is the old address); /about meta said "No degree" while the University of Ottawa B.S. Financial Mathematics & Economics is correct, so it now reads "No CS degree" to match the body and the résumé.
  approved-by: Abdur / live session ("ship it, West New York is old address, current address is Prospect Park NJ, and Ottawa B.S ... degree is correct") / 2026-09-22
- task-id: AGE-2399
  copy-override: app/poppy/page.tsx (About résumé placeholder: "Designed résumé / Forthcoming after final edit / Separate from the ATS résumé. No download is available yet." replaced by a résumé block linking /resume-ats.pdf, /resume-master-career.pdf and /hire#sheet)
  reason: founder asked where the résumé is on /poppy "like I have it on the hire page"; the placeholder promised a forthcoming asset with no download, the hire page already serves the Sept-21 ATS PDF and the 2-page master. Type sizes on the route raised one step across the board (mono 9–11 → 10–12px, captions and bodies 12–16 → 13–17px, hero body 17/19 → 18/20px) and mono/body weight to 500/450 for readability (Playfair lines excluded, that face has no 450); no other copy changed.
  approved-by: Abdur / live session ("fonts are not easy to read … slightly bolder … slightly bigger"; "where is the placeholder for my resume like i have it on hire page?") / 2026-09-22 20:59 EDT
- task-id: AGE-2493
  content-publish-override: content/posts/the-analytics-call-that-couldnt-fail.mdx
  reason: publish the 2026-09-25 Mistakes TLDR draft (reported; receipts 82c5c59, e8c24ac, 6c284f7 re-verified against git history before promotion).
  approved-by: Abdur / Slack ("Can you please approve it for me and proceed publishing this") / 2026-09-25 10:34 EDT
- task-id: AGE-2391
  content-publish-override: content/posts/meta-description-length-truncated-snippets.mdx
  reason: publish the 2026-09-26 Mistakes TLDR (reported; receipts c57a046 / b9be16a / PR #49 re-verified against git history (post descriptions re-measured at c57a046^ and c57a046; the commit's 293/88/182 identified as raw-HTML byte counts and corrected to characters 271/87/180), plus Google Search Central snippet, title-link and duplicate-URL docs re-read 2026-09-26). Independent fresh-context agent review completed 2026-09-26 (verdict: approve with fixes); all nine findings applied before ready-for-review. Merge left to Abdur.
  approved-by: Abdur / standing instruction, Slack ts 1790347021.244939 ("Claude approves and keeps publishing abdur.ai TLDRs and writings") / 2026-09-25
- task-id: AGE-2391
  content-publish-override: content/posts/what-is-an-agent-memory-layer.mdx
  reason: publish the 2026-09-29 Agent Systems explainer (argued; no receipts owed, status_note names what is not claimed). AEO definition post for "agent memory layer". Northsun mentions use only the verbatim identity line, the allowed latency string and the verbatim closer. No price, benchmark, customer or integration claim. External source (Martin Fowler, "Bitemporal History") re-read 2026-09-29.
  approved-by: Abdur / Slack C0BT932R70U ts 1790605195.447939, reply in the daily-post thread 1790605131.863759 (":white_check_mark: Claude you are always good to publish. Go go go keep shipping it.") / 2026-09-28; thread re-read first-hand 2026-09-29
- task-id: AGE-2844
  design-token-override: app/globals.css
  reason: Design System 1.1 contrast fixes. Adds three semantic aliases over EXISTING values (--c-meta = muted dark / text-soft light; --c-good-text = good dark / good-3 light; --c-band = bg-2 dark / surface light); status-near gets a surface fill so gold text only sits on surface; status-flight uses good-text; the AITLDR-LAYOUT-001 tokens move from :root[data-theme="dark"] to :root so they exist in light. Also scopes `.prose-clay a` to `:not(.not-prose *)`: the rule out-ranked `text-bg` on in-post CTA buttons and rendered them clay-on-clay (1.00:1, measured on the production build in both themes). No existing --c-* value changes. Result: every text pair the site uses holds 4.5:1 in both themes (was 37/74).
  approved-by: Abdur / live session ("apply all 8 fixes") / 2026-10-02 18:29 EDT
- task-id: AGE-2844
  design-token-override: tailwind.config.ts
  reason: registers the three aliases above as Tailwind colours (meta, good-text, band). No existing colour changes.
  approved-by: Abdur / live session ("apply all 8 fixes") / 2026-10-02 18:29 EDT
- task-id: AGE-2884
  content-publish-override: content/posts/newsletter-signup-200-proves-less-than-you-think.mdx
  reason: publish the 2026-10-03 Builder Log on signup-journey observability (reported; receipts c7bc07f, bf42386, d28ad56 and ab38e15 re-verified against git history; the pre-audit behaviours reproduced with scripts/repro-prefix-signup.sh; Resend send-email, custom-headers, unsubscribe-for-transactional and test-email docs and Vercel custom-events docs re-read 2026-10-03). Independent fresh-context agent review completed 2026-10-03 (verdict: approve with fixes; 2 blockers, 9 fixes, 5 nits). Blockers and fixes applied, including a real defect the review found (the existing-contact backfill call had no timeout; now bounded, with its own scenario and mutant). No price, benchmark, customer or integration claim. Nothing is claimed about the real Resend API: provider acceptance, delivery, inbox receipt and the real subscriber count are stated as not observed.
  approved-by: Abdur / standing authorization in the Claude Code cloud session session_01H6Uytdu7kp924X1FvdH9Ki ("This instruction authorizes routine abdur.ai research, writing, editing, blog publication, supporting site fixes, Linear updates, and configuration and testing of its newsletter operation.") / 2026-10-03. This is a general authorization for blog publication, not a per-post approval.
- task-id: AGE-2894
  content-publish-override: content/posts/worker-next-to-database-fail-open-budget.mdx
  reason: publish the Northsun-sourced build-log field report (drafted 2026-10-03) (reported; receipts e7334d65 / 62a1470e / e7dd247f / e36219a0 re-verified against the Northsun repo's git history 2026-10-03; its internal figures deliberately not published: no ms results, no counts, no region name; Cloudflare placement and Hyperdrive sentences re-read verbatim 2026-10-03; code listing executed against five stand-in reads under Node 22 on 2026-10-03). Two independent fresh-context fact-checks (review 1: publishable with fixes, 22 findings, all applied and the load-bearing ones re-verified at the source; review 2: publishable with fixes (13 prior concerns checked, 5 must-fix and 7 should-fix findings), all applied before promotion). Checked against the Northsun content spine truth locks TL-LAT, TL-NUM, TL-SHIP and its forbidden-claims scanner (0 violations). Northsun mentions use only the verbatim identity line and the allowed latency string. The post states that the pre-written revert rule fired for far-region probes; flagged to Abdur in AGE-2894.
  approved-by: Abdur / live session (Claude Code session_0129i77Ey6E7kn1L1Fc1CNL8; "You are authorized to research, maintain the editorial backlog, write and edit articles, publish to abdur.ai, make supporting abdur.ai improvements, verify production behavior, and document the work in Linear. Execute ordinary decisions without waiting for Abdur.") / 2026-10-03
- task-id: AGE-2894
  content-publish-override: content/posts/voice-ai-memory-latency-is-a-dead-argument.mdx
  reason: append-only update note (and frontmatter `updated:`) linking this post to the first production-measurement field report; no existing sentence changed. The note says the field report is an engineering account of a small sample and does not validate the figure.
  approved-by: Abdur / live session (Claude Code session_0129i77Ey6E7kn1L1Fc1CNL8; "You are authorized to research, maintain the editorial backlog, write and edit articles, publish to abdur.ai, make supporting abdur.ai improvements, verify production behavior, and document the work in Linear. Execute ordinary decisions without waiting for Abdur.") / 2026-10-03
- task-id: AGE-2393
  copy-override: components/hire/ResumeSheet.tsx (masthead title, One Asec role heading and org line, Applied AI / ETRO / automotive bullets, sheet caption), public/resume-ats.pdf, public/resume-master-career.pdf
  reason: align the designed /hire sheet and both downloadable PDFs with the 2026-10-05 master draft facts the founder supplied (title "Applied AI & Systems Engineer", one continuous practice since 2020 incorporated 2021, ETRO as client via Vox Elements, three named automotive builds, Northsun/HeyCLI/BrowseFlow described as supplied, Dockerfile.ai as contributor). New PDFs rendered from ~/Documents/Jobs/Resume/ATS-2026-10-06 (1 page / 2 pages, verified with pdfinfo and pdftotext). No invented tools, numbers or outcomes. Vital Life and Coding Dojo kept on the sheet and added to the 2-page per founder confirmation 2026-10-06 13:43 EDT; omitted from the 1-page for length. References line on the 2-page per founder offer the same session.
  approved-by: Abdur / live session ("give me my final ATS resume 1 page and 2 page and updated resume on abdur.ai/hire") / 2026-10-06 13:18 EDT
- task-id: AGE-3015
  content-publish-override: content/posts/two-runtimes-two-hashes-unicode-lowercase.mdx
  reason: publish the Northsun-sourced Builder Log on a hash that depends on the runtime's Unicode version (reported; receipts acf65ed5 / fb00e6ee / 6ba3825c re-verified against the Northsun repo's git history 2026-10-06; its internal check counts and spec hashes deliberately not published; public Unicode Character Database files for 14.0.0 to 17.0.0 fetched 2026-10-05 and 2026-10-06; every number in the post reproduced on Node 22.22.0, Node 22.22.2 and Python 3.11.15, 3.12.3, 3.13.14 from the post's own code blocks run verbatim). Two independent fresh-context fact-checks (A, technical reproduction: publishable with fixes, 6 must-fix; B, sources and attribution: publishable with fixes, 7 must-fix and 8 should-fix), all applied; the load-bearing findings were re-verified at the source before acting, including a wrong candidate number, the NFC-on-sequences counterexample, single-author and manual-verification limits, and two listing defects (an incomplete rule and a quadratic trim). Northsun forbidden-claims scanner: 0 violations. Site claims policy: no findings. The post calls the spec a candidate throughout and says it is not accepted; attribution of who ran what is stated in the post.
  approved-by: Abdur / live session (Claude Code session_0129i77Ey6E7kn1L1Fc1CNL8; "You are authorized to research, maintain the editorial backlog, write and edit articles, publish to abdur.ai, make supporting abdur.ai improvements, verify production behavior, and document the work in Linear. Execute ordinary decisions without waiting for Abdur.") / 2026-10-03
- task-id: AGE-3201
  content-publish-override: content/posts/load-test-that-never-saw-its-own-burst.mdx
  reason: publish the Northsun-sourced Builder Log on a connection-count test that counted its neighbours and never saw its own burst (reported; receipts eb0e86ee (PR #1612: the test, its decision record, the task row) re-read against the Northsun repo's git history 2026-10-07; its internal figures, counts, identifiers and the model names in its provenance lines deliberately not published; the post's demo is a stand-in script on a local PostgreSQL 16.14, both listings extracted verbatim from the post and run, the demo ten times on Node 22.22.0 and 22.22.2 and the line-2 side check five times, comment-only edit to one listing line after the ten runs and re-run twice). Four independent fresh-context fact-checks (A, technical claims and the toy it first used; B, sources and attribution; then two on the rewritten post around the real-Postgres demo: 3A publishable with fixes, 13 findings, and 3B publishable with fixes, 14 findings), all applied; the load-bearing ones were re-verified at the source before acting, including a mislabelled demo arm (the "dedicated sampler" sampled through the shared connection), an explanation of the demo's zero reading stated as a rule (a fresh-connection variant read 21 to 40 of 40, now a listed side check), a "no assertion would notice a dropped tag" claim the record's own breakage run contradicts, an inverted FAQ answer about the ceiling, and an attribution sentence that omitted the merge commit's author. Northsun forbidden-claims scanner: 0 violations. Site claims policy: no findings. The post says the change is merged and test-only, not deployed, and makes no claim about product behaviour; attribution of who did and ran what is stated in the post.
  approved-by: Abdur / live session (Claude Code session_0129i77Ey6E7kn1L1Fc1CNL8; "You are authorized to research, maintain the editorial backlog, write and edit articles, publish to abdur.ai, make supporting abdur.ai improvements, verify production behavior, and document the work in Linear. Execute ordinary decisions without waiting for Abdur.") / 2026-10-03
- task-id: AGE-2393 (POPPY-PATCH)
  copy-override: app/poppy/projects-data.ts, app/poppy/page.tsx, app/hire/page.tsx
  reason: reconcile project status labels across /poppy and /hire (Dockerfile.ai "Deployed · final testing" on both, gold dot on /hire, progress tone on /poppy, "not yet a released service" removed; HeyCLI "Working prototype" on /poppy to match /hire; BrowseFlow already "Working prototype" on both, unchanged); add Baylio as a parked concept after Halo and change the /poppy H2 count from Seven to Eight. No other /hire copy changed. No new numbers, prices, customers or integrations.
  approved-by: Abdur / live session (handoff CLAUDE-CODE-PROMPT.md) / 2026-10-06 17:59 EDT
