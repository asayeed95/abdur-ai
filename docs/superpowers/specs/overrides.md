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
