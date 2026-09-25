# abdur.ai Content Engine

Internal operating doc + reusable prompt pack for growing the abdur.ai audience. Ratifies the AGE-2391 content-engine work into the repo (it previously lived only in Slack). Load `prompt-pack.md` alongside this.

## North star
One number: **1,000 email subscribers on the `tldr` list.** Authority is the *how*, not the goal — every post either earns a reader's trust in Abdur as an AI builder or it doesn't ship. Northsun and HeyCLI get *soft, value-first* distribution: mentioned only where a genuinely useful post makes the mention honest. Skeptic test on every product mention — if it reads like an ad, cut it.

## The lever order (do not skip)
SEO blogs alone will not hit 1,000 in the near term — organic search takes 6–12 months to become a real subscriber tap. Sequence effort by actual leverage:

1. **A lead magnet worth an email** (~80% of the result). A concrete artifact from work already shipped — a template, a repo, a prompt pack, a checklist — not an ebook.
2. **Build-in-public reach on X/LinkedIn** pointing at that magnet. This is the *fast* channel and Abdur already has it (@asayeed95). Every post gets repurposed into a thread/carousel that links back to the capture surface.
3. **SEO compounding underneath** as the long game. Pillar + how-to posts seeded now, harvested later.

Don't mass-publish blogs and hope. Build the magnet + capture surface first, then let posts stack behind it.

## How this plugs into the repo (already-built surfaces)
The plumbing exists — this is a content-cadence + CTA-placement problem, not an engineering one:
- **Email capture:** `app/api/subscribe/route.ts` (Resend, no-JS friendly, honeypot + timing bot guard, full UTM/referrer attribution). Three lists: `tldr` (main newsletter), `asec-waitlist`, `mnemix-beta` (Northsun waitlist).
- **Signup surfaces:** `components/Subscribe.tsx` (homepage + `/subscribe`), `components/NorthsunWaitlistForm.tsx`.
- **In-post soft-distribution CTAs (founder-locked — place them, don't rewrite them):** `<NewsletterCTA/>` (→ `/subscribe`), `<MnemixCTA/>` (→ Northsun), `<AsecWaitlistCTA/>`.
- **Analytics:** `lib/analytics.ts` `trackEvent` + attribution props fire on subscribe.
- **Attribution audit:** `npm run subscribers:sources`.

## Honesty guardrails (enforced by the gate)
- Every published post needs a valid `register:` — `reported` needs `receipts:` with real commit SHAs; `argued`/`designed` need a `status_note:`. `npm run build` throws without a valid register.
- No unratified prices / benchmarks / customers / integrations in copy (public-claims law; `check-public-claims.py` locally + `check-brand.py` in CI).
- Ratified product framing only: Northsun = "memory and enrichment layer for AI agents"; Mnemix = "free diagnostic from Northsun." **HeyCLI has no ratified public copy and no landing page yet — no HeyCLI product claims until that exists (see Open gaps).**

## Draft → publish flow
1. Draft in `content/posts/_drafts/*.md` — the loader skips `_`-prefixed dirs and non-`.mdx` files, so drafts are invisible to the build and safe from the publish gate.
2. Founder review.
3. To publish: rename to `.mdx`, move to `content/posts/`, set a valid `register:`, and add a `content-publish-override:` entry naming the exact path in `docs/superpowers/specs/overrides.md`. Then `./scripts/check-phase.sh --hard` must pass.

## The 3-sprint cadence (per repeating cycle)
- **Sprint 1 — Foundation:** ship the lead magnet + wire its capture; publish 1 flagship pillar post; run the authority-gap audit (Prompt 1).
- **Sprint 2 — Volume:** 2–3 value-first how-to posts against the intent map (Prompt 2); each repurposed to X/LinkedIn (Prompt 7).
- **Sprint 3 — Loop:** measure via `npm run subscribers:sources`; double down on the channel that converted; refresh the magnet. Repeat.

## Open gaps (found during build — hand to AGE)
- **HeyCLI has no landing page.** `components/ToolsGrid.tsx` links `/tools/heycli` but no `app/tools/` route exists, so it 404s. Soft-distributing HeyCLI has no target until this page + ratified copy exist.
- **No lead-magnet delivery mechanism.** Today "lead magnet" = CTA components only; there's no gated-asset delivery after subscribe. A true magnet (a download/repo link in the welcome email) is net-new.
- **No pure how-to / value-first tutorial content yet.** Everything published is incident/opinion — the how-to lane is exactly what grows a cold-search audience. First draft is included in this PR (`content/posts/_drafts/`).
