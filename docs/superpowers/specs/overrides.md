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
