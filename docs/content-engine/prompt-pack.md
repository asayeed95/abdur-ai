# abdur.ai Content Engine — Prompt Pack

Reusable prompts for the engine in `README.md`. Run Block 0 once per session, then any prompt against it. Every prompt output must pass the honesty guardrails in `README.md`.

## Block 0 — Context loader (paste once)
```
You are helping run content for abdur.ai — Abdur Rahman Sayeed's builder blog and TLDR newsletter. Tagline: "I ship AI things and write the TLDR."
- North star: 1,000 email subscribers on the `tldr` list. Authority is the how; soft, value-first distribution of Northsun + HeyCLI is a secondary effect, never the goal.
- Voice: first-person builder logbook. Incident-driven, receipts-backed, named patterns, short (~400–800 words; flagship pillars longer). No hype, no inflated promises.
- Products (ratified framing only): Northsun (northsun.ai) = "memory and enrichment layer for AI agents". Mnemix (mnemix.ai) = "free diagnostic from Northsun". ASEC (asec.co) = parent, coming soon. HeyCLI = a CLI Abdur is building — NO public product claims yet (no page, no ratified copy).
- Channels: X/LinkedIn @asayeed95 (fast, build-in-public); abdur.ai/writing + RSS (SEO long game).
- Sections in use: Agent Systems, SRE, Voice AI, Analytics, AI-Native Engineering, Mistakes TLDR, Builder Logs.
- {{fill: primary reader ICP — e.g. AI engineers building agents / indie AI founders}}
- {{fill: 2–3 named competitor blogs / creators in this space + URLs}}
Confirm you have loaded this before running any prompt.
```

## Prompt 1 — Authority-gap audit
```
Using Block 0, audit abdur.ai's authority in {{topic area}}. List: (a) the 3–5 questions the primary reader is actually Googling that we have NOT answered, (b) what the named competitors cover that we don't, (c) the 3 angles only Abdur can own given his shipped work (agent reliability, memory, verification discipline). Output a ranked gap list — highest reader-intent × most-ownable first.
```

## Prompt 2 — Reader intent map
```
Using Block 0, build an intent map for {{topic area}}. For each of ~8 reader searches, give: the query, intent (learn / fix / decide), the post format that serves it (how-to / teardown / opinion / checklist), and which product (if any) the topic makes an honest soft mention of. No forced mentions.
```

## Prompt 3 — Pillar post builder
```
Using Block 0, draft a flagship pillar post on {{topic}}. Long-form, definitive, the page we'd want ranking #1. Structure: hook from a real failure/tension → the mental model → step-by-step → the tradeoffs → one soft CTA (<NewsletterCTA/>, plus <MnemixCTA/> only if memory-relevant). Propose register + frontmatter. Skeptic-test every product line.
```

## Prompt 4 — Lead-magnet designer
```
Using Block 0, propose 3 lead magnets from work Abdur has ALREADY shipped (repos, templates, prompt packs, checklists — no ebooks). For each: the artifact, the exact promise, why it's worth an email, the delivery mechanism (link in the welcome email vs gated page), and the one post that naturally hands it over. Rank by build-effort ÷ subscriber-pull.
```

## Prompt 5 — Value-first how-to builder
```
Using Block 0, draft a how-to on {{task}} that is genuinely useful standalone (a reader who never subscribes still wins). Teach the real pattern with code/commands. End with one honest soft CTA. Keep it ~700–900 words in Abdur's voice. Propose register (usually `argued` with a status_note for a how-to that stakes a position) + full frontmatter.
```

## Prompt 6 — Distribution weave (skeptic test)
```
Using Block 0, review this draft: {{paste}}. For every product mention, apply the skeptic test — would a smart reader feel sold to? Rewrite or cut any that fail. Confirm all product framing matches the ratified wording. Confirm no unratified price/benchmark/customer/integration claim. Output the cleaned draft + a one-line note per change.
```

## Prompt 7 — Repurpose fan-out
```
Using Block 0, turn this published post into: (a) an X thread (hook + 5–8 posts, last one links the post/magnet), (b) a LinkedIn carousel outline (6–8 slides), (c) one standalone LinkedIn text post. Match the build-in-public voice. Every asset ends pointing at the capture surface.
```

## Prompt 8 — Path-to-1k loop
```
Using Block 0 and this data: {{paste `npm run subscribers:sources` output + current sub count}}. Report: which channel actually converted, cost-per-sub in effort, the single next bet to make, and what to STOP doing. One number to move next sprint. Be blunt — no vanity metrics.
```
