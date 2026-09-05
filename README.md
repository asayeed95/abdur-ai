# abdur.ai

Solo AI founder's logbook + portfolio + lead magnet for Northsun.

## Quick start

```bash
npm install
npm run dev
```

→ http://localhost:3000

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v3 (Clay design system)
- MDX for posts
- Resend (email — wire in `app/api/subscribe/route.ts`)
- Supabase (Phase 2 — agent webhooks for Now panel + Ship log)
- Vercel (deploy)

## Routes

| Path | What |
|---|---|
| `/` | Homepage — 10 sections matching the locked Clay design |
| `/aitldr` | TLDR feed |
| `/aitldr/[slug]` | Individual posts (MDX, JSON-LD, lead-magnet blocks) |
| `/about` | /whoami page |
| `/now` | What I'm shipping this week |
| `/hire` | Targeted at Applied AI / FDE roles at frontier labs |
| `/sitemap.xml` | Auto-generated |
| `/robots.txt` | Auto-generated (welcomes AI crawlers explicitly) |
| `/llms.txt` | AI-readable site summary with post index |
| `/aitldr/rss.xml` | RSS feed |
| `/api/subscribe` | Newsletter signup (POST `{email, list?}`) |
| `/api/ingest/now` | Agent webhook for Now panel (Bearer auth) |
| `/api/ingest/ship` | Agent webhook for Ship log (Bearer auth) |

## Adding a post

Drop an `.mdx` file in `content/posts/`. Frontmatter shape lives in
`lib/posts.ts` (PostMeta type). Feed and dynamic route pick it up automatically.

```mdx
---
slug: my-new-post
title: "Title"
description: "Meta description"
dek: "One-line teaser shown on feed cards"
date: 2026-07-01T09:00:00-04:00
author: Abdur Rahman Sayeed
tags: [agents, mnemix]
reading_time: 6
---

Body content here. Can use <MnemixCTA />, <AsecWaitlistCTA />, <NewsletterCTA />,
<ReceiptsBlock />, <PatternsBlock />.
```

## Analytics

Provider: **Vercel Web Analytics** (`@vercel/analytics`). `<Analytics />` in
`app/layout.tsx` auto-tracks pageviews (including App Router SPA transitions);
the script is served same-origin from `/_vercel/insights/*`. No env var —
enable in the Vercel dashboard (project → Analytics → Enable). Chosen over
Plausible because this audience is developers (high adblock usage) and the
same-origin proxy is blocked far less often.

**Adblock caveat:** same-origin mitigates but does not eliminate blocking, so
counts systematically under-report adblock users. Treat numbers as
directional, not absolute.

**Plan requirement:** pageviews record on every Vercel plan, but **custom
events (everything in the catalog below) require Pro or higher**. On Hobby the
`track()` calls are accepted and silently dropped — the dashboard shows
pageviews and nothing else, which reads as "no conversions" rather than "not
recorded". Confirm the team plan before treating an empty Events view as data.

Event catalog (all fired via `trackEvent` in `lib/analytics.ts`; the list is
the `ANALYTICS_EVENTS` const — a name outside it is a type error).
**Provisional — pending GMP analytics stage ownership (AGE-1548).**

| Event | Meaning | Where |
|---|---|---|
| `cta:northsun:from-post` | Click on the Northsun product CTA | `components/post/LeadMagnets.tsx` (`MnemixCTA`) |
| `cta:asec:from-post` | Submit attempt on the ASEC waitlist CTA | `components/post/LeadMagnets.tsx` (`AsecWaitlistCTA`) |
| `cta:newsletter:from-post` | Click on the newsletter CTA | `components/post/LeadMagnets.tsx` (`NewsletterCTA`) |
| `subscribe:tldr` | Successful TLDR email capture (`/api/subscribe` 2xx) | `components/Subscribe.tsx` |
| `subscribe:asec-waitlist` | Successful ASEC waitlist signup (`/api/subscribe` 2xx) | `components/post/LeadMagnets.tsx` |

`subscribe:*` events fire **only after a 2xx response** — they count real
conversions, not attempts. `cta:asec:from-post` fires on submit attempt, so
the pair gives a crude attempt→success funnel.

The component is still named `MnemixCTA` and its visible copy still says
`MnemixCTA` is a frozen legacy technical identifier (MDX contract); the product it renders is Northsun. Only the
event string carries the rebranded `northsun` name (the rebrand landed on
main after this base; renaming the event now costs zero historical data
since Web Analytics is not yet enabled).

**Attribution seam:** `subscribe:*` events pass `attributionProps()` from
`lib/analytics.ts`. Today it returns no props; when PR #38
(`feat/subscriber-attribution`, `lib/attribution.ts`) lands it becomes a
one-import-line change to `buildSubscribeFields(...)`, so event `source`
props use the identical vocabulary as Resend contact properties.

**No-PII rule:** never put email addresses, names, or any user input in event
names or props. Coarse strings only (which CTA, which surface).

**Adding a new event:** call `trackEvent("your:event", { prop: "value" })`
from `lib/analytics.ts`, then add a row to the table above. Never call
`window.plausible` / `window.va` directly.

## Design system

**Do not modify** without explicit reason.

| Token | Value |
|---|---|
| bg | `#0B0A08` |
| surface | `#161310` |
| border | `#2C2620` |
| text | `#F2EDE6` |
| muted | `#948B7D` |
| **clay (accent)** | `#D97757` |
| display font | Playfair Display |
| body font | Inter |
| mono font | JetBrains Mono |

Eyebrow style: `class="eyebrow"` — mono, tracking-widest, clay color, uppercase.

## Hand-off

See `CLAUDE.md` for the next steps. The scaffold is ~85% complete; remaining
work is wiring Resend, Supabase persistence for the webhooks, the OG cover
image, replacing two TODO placeholders, deploying to Vercel.
