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

## C-10 (Codex review) — status notes that name missing evidence

Independent review (2026-09-05) found two `argued` posts whose prose recounts a
measurement / an incident. REGISTERS.md's own rule for this case: if the
evidence is gone, the post is `argued` and says so. Notes only; no prose edited.

- task-id: C-10
  content-publish-override: content/posts/voice-ai-memory-latency-is-a-dead-argument.mdx
  reason: status_note now names that the recalled measurement has no surviving receipt.
  approved-by: Abdur / "do all the work" live session / 2026-09-05
- task-id: C-10
  content-publish-override: content/posts/who-owns-the-architecture-when-ai-writes-the-code.mdx
  reason: status_note names that the $14/day incident predates the receipts ledger.
  approved-by: Abdur / "do all the work" live session / 2026-09-05

## H-2 (Codex review) — light-mode muted scale to AA

- task-id: H-2
  design-token-override: app/globals.css
  reason: Light-theme muted text was 2.80:1 (12px dates) and 3.98:1 (muted) on the cream ground — below AA. muted → #746D62 (4.55:1), muted-2/3/4 → #776D5E (4.52:1). Dark tokens untouched. Found by independent review; browser-measured.
  approved-by: Abdur / "do all the work" live session / 2026-09-05
