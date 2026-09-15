# Publish-readiness review — `the-last-fifteen-percent`

**Reviewed file:** `content/posts/_drafts/abdur-ai-launch-postmortem.md` (committed at `3e7cbe6`)
**Reviewed against:** `content/posts/_drafts/CONTENT-ROUTING-RULE.md` readiness checklist + repo git history (read-only)
**Date of review:** 2026-07-16

## Verdict: READY

The one hard blocker (missing `tldr`, routing-rule checklist item 3) was fixed in this review pass — that was the only edit made to the draft. Everything below is evidence or non-blocking notes for the human publisher. Per the routing rule, promotion to `content/posts/` and any deploy remain human-only actions.

---

## Numbered findings

### 1. (a) Frontmatter completeness — PASS

Routing rule requires title, date, slug, excerpt. The draft carries:

- `title: "The last fifteen percent"` ✓
- `slug: the-last-fifteen-percent` ✓
- `date: 2026-06-28T02:15:00-04:00` ✓
- `description:` present (serves as the excerpt; `lib/posts.ts` L67 falls back `description || dek`) ✓

### 2. (b) `tldr` field — FIXED in this pass (the only edit made)

The routing rule ("TLDR summary (max 180 words) included in frontmatter") requires a `tldr` field; the draft had none. Added one between `dek` and `date`, drafted strictly from the existing dek and body. Measured length: **173 words** (under the 180 cap). No other line of the draft was touched.

### 3. (c) Secrets / machine-local paths / session URLs — CLEAN

Grepped the draft for `Users/`, `Claude-Session`, `Co-Authored-By`, `claude.ai`, `sk-`, `api key`, `token`, `Bearer`: zero hits. The draft's receipts use repo-relative paths and short SHAs only — same convention as the flagship post. Also linted against all 37 entries in the `content/voice/banned-phrases.md` machine-check block: zero hits.

### 4. (d) Factual claims vs repo history — VERIFIED

Every failure the post describes traces to this repo's own commits:

| Post claim | Confirming evidence |
|---|---|
| Gate 1: `npm install` ERESOLVE (next 15 / React 19 peer conflict); fix = committed `.npmrc legacy-peer-deps=true` | Commit `6ede7d1` (2026-06-28 05:04:13 -0400): "build: add .npmrc legacy-peer-deps for Vercel install (next 15 / react 19 peer conflict)"; diff adds exactly `legacy-peer-deps=true` |
| Gate 1: homepage 500 `Objects are not valid as a React child (found: [object Date])` and `/llms.txt` 500 `flagship.date.slice is not a function`; fix = ISO coercion in the loader | Commit `82c5c59` message: "lib/posts.ts: coerce YAML Date frontmatter to ISO strings (fixes / and /llms.txt 500s)". `lib/posts.ts` L43–52 contains the `toIso()` helper with that exact comment. Root cause confirmed in `content/posts/the-night-the-doctrine-failed.mdx` L7: `date:` is unquoted, so YAML parses it to a JS `Date` |
| Gate 2: two type errors visible only under `next build` — `Property 'id' does not exist` on `<Reveal>`, then `Cannot find namespace 'JSX'` (React 19) | Commit `82c5c59` message: "components/Reveal.tsx: forward HTML attrs (section id anchors) + React 19 JSX namespace". `components/Reveal.tsx` at that SHA has the `...rest` + `React.HTMLAttributes` passthrough and `React.JSX.IntrinsicElements` |
| Gate 3: Vercel refused Next.js 15.0.3 (CVE, incl. CVE-2025-29927, patched in 15.2.3); fix = 15.5.19 | Commit `ce3fa9c` (05:10:21): "security: upgrade Next.js 15.0.3 -> 15.5.19 (Vercel blocks vulnerable versions)"; `package.json` diff confirms 15.0.3 → 15.5.19. CVE-2025-29927 (middleware authorization bypass, fixed in 15.2.3) confirmed against the public Next.js advisory GHSA-f82v-jwr5-mffw |
| Gate 3: Vercel refused next-mdx-remote 5.0.0; fix = 6.0.0, which kept the `/rsc` entry | Commit `452a959` (05:13:19): "security: upgrade next-mdx-remote 5.0.0 -> 6.0.0"; message: "v6 keeps the /rsc entry used by app/aitldr/[slug]/page.tsx"; `package.json` diff confirms |
| Handoff doc advised downgrading next-mdx-remote to 4.4.1 — the wrong direction | `CLAUDE.md` L40 at `82c5c59`: "downgrade to `next-mdx-remote@4.4.1` and adjust the import … accordingly" — verbatim as the post describes |
| "Five fixes, four commits" | `82c5c59` (two fixes: posts.ts + Reveal.tsx) + `6ede7d1` + `ce3fa9c` + `452a959` = 4 commits, 5 fixes ✓ |
| "Five of the seven routes were green"; two 500'd | `app/` route surfaces: `/`, `/about`, `/aitldr`, `/aitldr/[slug]`, `/hire`, `/now`, `/llms.txt` = 7; `/` and `/llms.txt` were the two 500s ✓ |

### 5. (e) Publish path and slug collision — PASS

- `lib/posts.ts` L31–34 loads only files ending `.mdx` or `.md` directly under `content/posts/` (non-recursive — `_drafts/` is never read, so this draft cannot leak into the site early).
- Slug resolution (L58, L64): frontmatter `slug` wins over filename, so the post will serve at `/aitldr/the-last-fifteen-percent`. Per the convention of all four published posts (filename = slug + `.mdx`), it should publish as `content/posts/the-last-fifteen-percent.mdx`.
- Collision check: `grep -rn "the-last-fifteen-percent" content/` returns only the draft itself; nothing in `content/posts/` uses that slug or filename. The `related:` slugs (`the-night-the-doctrine-failed`, `who-owns-the-architecture-when-ai-writes-the-code`) both exist in `content/posts/`.

### 6. Non-blocking observations (human may adjust at publish; none gate readiness)

- **Frontmatter `date` precedes the events narrated.** The post is dated 2026-06-28T02:15:00-04:00, but the fixes it describes were committed 05:02–05:13 -0400 that morning and the body says the deploy went Ready at 06:06. The timestamp reads as the evening the work began, not the morning it ended. Harmless if intentional; worth a human glance.
- **`reading_time: 7` vs measured body.** Body is ~1,250 words; at the loader's 220 wpm (`lib/posts.ts` L74) that rounds to 6. Cosmetic.
- **`word_count` absent.** Every published peer carries it, but the loader backfills it automatically (L75). Optional.
- **File extension is `.md`, not `.mdx`.** The loader accepts both; rename to `the-last-fifteen-percent.mdx` on publish per convention.
- **`section: "Shipping"`** — not "Mistakes TLDR". The post predates that series; left as-is.

### 7. Claims not independently verifiable from the repo (consistent, external to git)

The exact Vercel refusal messages quoted in the post, "sixteen pages generated," and the 06:06 Ready time live in build/deploy logs, not in this repo. All three are consistent with the commit sequence (`452a959` at 05:13, deploy after) and with the public CVE record. No action; noted for completeness.

---

*Review performed with read-only git (`git log`, `git show`, `git grep`) plus frontmatter/lint checks. No commits, no staging, no build, no deploy.*
