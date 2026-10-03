# Changelog

## 1.1.0 — 2026-10-02

All eight contrast fixes proposed in 1.0.0 are applied in the app (AGE-2844, approved by Abdur in a live session). No existing token value changed: the fixes add three aliases that point at existing values.

### Added
- `--c-meta`: `muted` in dark, `text-soft` in light. All secondary text moves to it: 113 class uses of `text-muted`, `text-muted-2` and `text-muted-3`.
- `--c-good-text`: `good` in dark, `good-3` in light. Success text and the TestFlight pill use it.
- `--c-band`: `bg-2` in dark, `surface` in light. Nine banded sections, asides and flagship cards move from `bg-bg-2` to it, so dark doesn't change.
- A usage scan in `scripts/build.mjs` that fails on any class pattern that would undo a fix. A negative test confirmed each rule rejects its pattern.

### Changed
- `.status-near`, the /hire "Open to roles" pill and the NowPanel queued and blocked pills sit on a `surface` fill, so gold and clay text keep 4.5:1.
- All five form fields use a `muted` border (3.68:1 or better on every ground) instead of `border`.
- The AITLDR-LAYOUT-001 tokens move from `:root[data-theme="dark"]` to `:root`, so they exist in light.

### Result
- Text: 52 of 52 pairs pass. Non-text: 18 of 18. All four 1.0 risks are fixed.
- Trade-offs:
  - Light secondary text is now the same colour as prose body (`text-soft`), so light mode loses one grey step.
  - Light bands are a lighter cream (`surface`) than before (`bg-2`).
  - Dark meta text is slightly lighter than the old `muted-2`/`muted-3`.

## 1.0.0 — 2026-10-02

First release, extracted from `app/globals.css` and `tailwind.config.ts` at `main@4e7891a`.

### Added
- Tokens: 14 themed colours (dark + light) and 3 theme-independent status colours as `--c-*` channel triples; type families, the scale steps the code uses, tracking and weights; spacing 4–64; 5 radii; 2 shadows; layout; 3 motion tokens (hero-in, data-reveal, pulse-clay). `tokens.json` is generated from the CSS.
- `foundations.html`: both palettes, a live contrast matrix, type, spacing, radius, shadow, motion.
- 14 component previews, both themes: Button, Link, Tag, Status pill, Card, Post card, Callout, Code block, Newsletter form, Nav bar, Footer, Pagination, Empty state, Theme toggle.
- 5 templates on real routes: `/`, `/writing/[slug]`, `/aitldr`, `/about`, `/hire`.
- `tests/contrast.test.html` plus build-time drift, hex and contrast checks.

### Known, not fixed (proposed fixes in the contrast test)
- 37 of 74 text pairs and 2 of 10 non-text pairs fall below their minimum. The fixes are proposed, not applied.
- The AITLDR-LAYOUT-001 tokens are scoped to `:root[data-theme="dark"]` in the app, so light mode doesn't have them.
- `hero-in` and `pulse-clay` have no `prefers-reduced-motion` guard in the app. The design system's `motion.css` adds one.

### Deviations from the brief (the code wins)
- `data-reveal` is a CSS transition on `[data-reveal]`, not a keyframe animation.
- Body copy sets at 16px and prose at 18px (`text-lg`), not the brief's 16–17px.
- Two shadows exist in components, not one.
- `good*` are hex literals in the Tailwind config, not CSS variables. They're expressed here as `--c-good*` channel triples with the same values.
- Pagination is the prev/next post pair; the site has no numbered pagination. The empty state has no source in the code and is composed from existing classes.
