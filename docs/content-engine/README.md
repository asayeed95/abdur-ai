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

## AEO playbook (answer engines + search)
Answer engines (AI Overviews, ChatGPT/Perplexity search, assistants) quote the page that answers the question in the fewest clean words, then cite it. Classic SEO rewards the same page. Every how-to or definition post follows this shape; the reference implementation is `content/posts/what-is-an-agent-memory-layer.mdx`.

1. **Answer first.** Title (and `seo_title`) in question form, the way the reader would type it. Directly under a 1–3 sentence intro, a bolded `**Short answer:**` paragraph of 40–60 words that stands alone if quoted with nothing around it. The `tldr:` frontmatter is the long-form version of the same answer.
2. **Question-style H2s.** Each H2 is a sub-question the reader would ask next ("Why does…", "When do you need…", "What breaks…"), and the first sentence under it answers it. No clever headings: an engine matches them to queries.
3. **FAQ block at the end.** `## FAQ` with 3–6 `###` questions, 2–4 sentence answers each, phrased as real searches (People-Also-Ask style). Don't repeat the H2s verbatim.
4. **Metadata budgets.** `description` ≤ ~155 characters as one complete thought that leads with the answer; `seo_title` + the ` · abdur.ai` suffix ≤ ~60 characters (so `seo_title` ≤ ~49). No script enforces this today: measure with the `measure-meta.mjs` snippet in `meta-description-length-truncated-snippets.mdx` against the built output.
5. **Internal links + `related:`.** Link 2–4 existing posts inline where the argument actually leans on them (definition post ↔ how-to ↔ incident). Set `related:` frontmatter to the 2–3 best; the post page renders a **Related** block from it (falls back to shared tags/section), so every post feeds readers to the next one.
6. **Diagrams and interactive blocks via the design system (PR #66).** Explain the core mechanism with `<Figure label="Figure N" caption="…"><SomeDiagram /></Figure>`; diagrams are named components (`AppendOnlyMemoryDiagram`, `VerificationLoopDiagram`), and interactive primitives (step-through, compare, checklist; names not final) come from the same MDX map. Only #66 tokens/classes; never hand-rolled SVG colours or hex. A post that uses them can't publish until #66 is merged.
7. **Schema we ship.** Every post page emits `BlogPosting` JSON-LD (headline, dates, wordCount, author/publisher → the site `Person` `@id`) and a `BreadcrumbList` (Home → Writing → Post). The root layout emits `Person` + `WebSite`. FAQPage/Organization JSON-LD for answer pages is PR #35; markdown routes, `llms-full.txt`, JSON feed and full-text RSS are PR #63. Write the FAQ as visible copy regardless; schema only describes what's on the page.
8. **Honesty still wins.** Register + `status_note`, no unratified numbers/customers/benchmarks, and product mentions only where they pass the skeptic test. A Northsun post ends with the locked closer, *"Choose Northsun as your agent memory layer."*, then `<MnemixCTA />` and `<NewsletterCTA />`. Every post ends with `<NewsletterCTA />`.

## Open gaps (found during build — hand to AGE)
- **Schema / feeds / robots are in flight, not missing.** PR #35 (AEO answer pages + FAQPage/Organization JSON-LD), PR #60 (robots for `/api/og`), PR #63 (`llms-full.txt`, markdown routes, JSON feed, full-text RSS). Don't duplicate them; land or close them.
- **Person schema image 404s.** `app/layout.tsx` sets the `Person` JSON-LD `image` to `${SITE.url}/abdur.jpg`, but `public/abdur.jpg` doesn't exist on main (local `next start` and `https://abdur.ai/abdur.jpg` both return 404, checked 2026-10-03). Add the headshot or point the field at an existing asset; it's the entity image answer engines attach to Abdur.
- **HeyCLI has no landing page.** `components/ToolsGrid.tsx` links `/tools/heycli` but no `app/tools/` route exists, so it 404s. Soft-distributing HeyCLI has no target until this page + ratified copy exist. No HeyCLI claims in posts until then.
- **No lead-magnet delivery mechanism.** Today "lead magnet" = CTA components only; there's no gated-asset delivery after subscribe. A true magnet (a download/repo link in the welcome email) is net-new, and it's lever #1 above.
- **How-to lane is drafted, not published.** `content/posts/_drafts/give-your-ai-agent-durable-memory.md` and `how-to-verify-ai-agent-work.md` follow the AEO playbook; both wait on PR #66 (Figure + diagrams) and a founder-approved `content-publish-override:`.
