# overrides.md — abdur.ai

Explicit, on-record authorizations to bypass a gate. Two gates in this repo are override-able this way: the **[NEVER-SKIP] design/content lock** on `tailwind.config.ts` / `app/globals.css` (see `PROCESS.md`), and the **[NEVER-SKIP] content publish lock** on `content/posts/*.mdx` outside `_drafts/` (see `content/posts/_drafts/CONTENT-ROUTING-RULE.md`). Nothing else in this repo's gate set is override-able — `check-phase.sh` doesn't check for overrides on the build/lint/typecheck gates because those aren't policy calls, they're "does it work."

No overrides are currently active. Empty is the expected state — the design system is locked on purpose.

## Format

Append an entry here, then re-run `./scripts/check-phase.sh --hard` to confirm it's recognized:

```
- task-id: <id from build-plan.md>
  design-token-override: <locked-file>   # write the real filename; placeholder is deliberately non-matching so this example can never satisfy the gate
  reason: <why this specific change is warranted — not "needed a color">
  approved-by: <name/date>
```

`scripts/check-phase.sh` looks for a `design-token-override:` line naming the exact locked file that's staged. A vague or missing entry does not pass the gate.

```
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

