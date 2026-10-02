# abdur.ai Design System 1.0

**Owner:** Abdur · **Last updated:** 2026-10-02 · **Version:** 1.0.0 ([CHANGELOG](CHANGELOG.md))

The design system locks what `app/globals.css` and `tailwind.config.ts` already do and invents nothing. Where this folder and the code disagree, the code wins: `node design-system/scripts/build.mjs` fails on any drift.

## The five rules

1. **No hex value anywhere except the token file.** Colours live in `tokens/colors.css` as channel triples and are read as `rgb(var(--c-clay) / <alpha>)`. The build fails on a hex anywhere else under `design-system/`.
2. **Clay is the only accent. Gold is for highlights only**, never buttons.
3. **Playfair Display is for headings only.** Body is Inter (`ss01 cv11 tnum`). Labels, controls, dates and code are JetBrains Mono.
4. **Both themes, always.** Dark is the default and the no-JS fallback. Light is `:root[data-theme="light"]`. Every preview renders both.
5. **No invented numbers, customers or claims in public copy.** The only closer line is *"Choose Northsun as your agent memory layer."*

## Tokens

<!-- tokens:start -->
| Colour | Dark | Light | Role |
| --- | --- | --- | --- |
| `--c-bg` | 11 10 8 | 246 241 232 | Page ground |
| `--c-bg-2` | 14 12 10 | 239 232 219 | Recessed section |
| `--c-surface` | 22 19 16 | 255 253 248 | Card, input, code |
| `--c-surface-2` | 28 24 19 | 239 232 219 | Menu hover |
| `--c-border` | 44 38 32 | 228 218 202 | Hairline |
| `--c-border-2` | 74 61 38 | 211 196 168 | Strong hairline |
| `--c-text` | 242 237 230 | 31 26 20 | Primary text |
| `--c-text-soft` | 201 192 178 | 70 64 54 | Prose body |
| `--c-muted` | 148 139 125 | 126 118 106 | Secondary text |
| `--c-muted-2` | 126 118 106 | 154 144 127 | Tags, badges |
| `--c-muted-3` | 122 114 100 | 154 144 127 | Fine print |
| `--c-muted-4` | 106 98 86 | 154 144 127 | Non-text only |
| `--c-clay` | 217 119 87 | 174 83 56 | The accent |
| `--c-gold` | 245 196 81 | 143 106 0 | Highlight only |
| `--c-good` | 111 207 151 | (same) | Status: success |
| `--c-good-2` | 127 184 138 | (same) | Status (unused) |
| `--c-good-3` | 38 53 43 | (same) | Status border |

| Family | Tokens |
| --- | --- |
| Type | `--font-display` "Playfair Display", ui-serif, Georgia, serif · `--font-body` "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif · `--font-mono` "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace |
| Type scale | `--text-10` 10px · `--text-11` 11px · `--text-xs` 0.75rem · `--text-sm` 0.875rem · `--text-base` 1rem · `--text-lg` 1.125rem · `--text-xl` 1.25rem · `--text-2xl` 1.5rem · `--text-3xl` 1.875rem · `--text-4xl` 2.25rem · `--text-5xl` 3rem · `--text-6xl` 3.75rem · `--text-7xl` 4.5rem · `--text-hero` clamp(48px, 8.5vw, 116px) |
| Spacing | `--space-1` 4px · `--space-2` 8px · `--space-3` 12px · `--space-4` 16px · `--space-6` 24px · `--space-8` 32px · `--space-12` 48px · `--space-16` 64px |
| Radius | `--radius-sm` 2px · `--radius` 4px · `--radius-md` 6px · `--radius-lg` 8px · `--radius-full` 9999px |
| Shadow | `--shadow-pop` 0 24px 48px -20px rgba(0, 0, 0, 0.55) · `--shadow-card-hover` 0 18px 40px -20px rgba(217, 119, 87, 0.5) |
| Layout | `--content-max` 1280px · `--prose-max` 65ch · `--nav-height` 56px · `--gutter` 24px · `--gutter-md` 40px · `--rule-accent-w` 60px · `--rule-accent-h` 2px · `--focus-ring-width` 2px · `--focus-ring-offset` 2px |
| Motion | `--ease-clay` cubic-bezier(0.2, 0.7, 0.2, 1) · `--motion-hero-in-duration` 0.6s · `--motion-hero-in-distance` 8px · `--motion-reveal-duration` 0.6s · `--motion-reveal-distance` 12px · `--motion-pulse-duration` 2.4s · pulse-clay `2.4s ease-in-out infinite` |
<!-- tokens:end -->

## Files

| Path | What |
| --- | --- |
| `tokens/colors.css` · `type.css` · `spacing.css` · `motion.css` | The token source, copied from the code |
| `tokens/tokens.json` | Generated from the CSS by `scripts/build.mjs` |
| `foundations.html` | Swatches for both themes, the live contrast matrix, type, spacing, radius, shadow, motion |
| `components/*.html` | One preview per component, dark and light side by side, with default / hover / focus / disabled states |
| `components/components.css` | Component styles. Every rule translates a class string from the app. |
| `templates/*.html` | `/`, `/writing/[slug]`, `/aitldr`, `/about`, `/hire` |
| `tests/contrast.test.html` | In-browser contrast pass and the known-risk checks |
| `tests/contrast-results.json` | The same pass, written by the build |
| `scripts/build.mjs` | Builds tokens.json and the pages, runs the drift, hex and contrast checks. `--artifact DIR` exports the Design System artifact. |

## Contrast and proposed fixes

The authoritative list is `tests/contrast.test.html` (in the browser) and `tests/contrast-results.json` (from the build). Every fix there is **PROPOSED, not applied**: each reuses existing token values, and any edit to `app/globals.css` still needs a `design-token-override:` entry in `docs/superpowers/specs/overrides.md`.
