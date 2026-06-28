# abdur.ai

Solo AI founder's logbook + portfolio + lead magnet for Mnemix.

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
