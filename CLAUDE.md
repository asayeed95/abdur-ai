# CLAUDE.md — abdur.ai handoff

You are picking up a Next.js 15 + Tailwind + MDX project that is **scaffolded to ~85% complete**. The visual design, content, and architecture decisions are all locked. Your job is to finish wiring, deploy to Vercel, and add the persistence layer.

Do **not** redesign anything. Do **not** invent new copy. Read the existing components and content — they're the source of truth. The design system tokens are in `tailwind.config.ts` and `app/globals.css`. Do not touch them.

---

## What's done

- ✅ Next.js 15 App Router + TypeScript + Tailwind + MDX
- ✅ Clay design system locked (palette: bg `#0B0A08`, surface `#161310`, clay `#D97757`, text `#F2EDE6`, muted `#948B7D`; fonts: Playfair Display + Inter + JetBrains Mono)
- ✅ Homepage with all 10 sections (Hero, Now, Latest, Ship log, Tools, Mnemix, Library, Principles, About, Subscribe) — matches the Claude Design bundle exactly
- ✅ `/aitldr` feed with flagship post pinned
- ✅ `/aitldr/[slug]` dynamic post route with MDX, JSON-LD, prev/next nav, lead-magnet blocks
- ✅ Flagship post live in `/content/posts/the-night-the-doctrine-failed.mdx` with full receipts, patterns, and CTAs
- ✅ `/about`, `/now`, `/hire` pages
- ✅ Dynamic `sitemap.xml`, `robots.txt`, `/llms.txt`, `/aitldr/rss.xml`
- ✅ API stubs: `/api/subscribe`, `/api/ingest/now`, `/api/ingest/ship`
- ✅ Site-wide JSON-LD (Person + WebSite) + per-post JSON-LD (BlogPosting)
- ✅ Lead-magnet components: `<MnemixCTA />`, `<AsecWaitlistCTA />`, `<NewsletterCTA />`

## What you need to finish

### 1. Install + verify locally (15 min)

```bash
cd /Users/agencyflow/Projects/abdur-ai
npm install
npm run dev
```

Open `http://localhost:3000`. Verify:
- Homepage renders with all 10 sections in correct order
- `/aitldr` feed shows the flagship post pinned + any other posts
- `/aitldr/the-night-the-doctrine-failed` renders the full post with lead-magnet blocks
- `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/aitldr/rss.xml` all return valid output
- Subscribe form on homepage POSTs to `/api/subscribe` and returns ok

If `next-mdx-remote` import errors, the version in `package.json` is `5.0.0`. If `next` 15.0.3 + `react` 19 has peer issues with mdx-remote, downgrade to `next-mdx-remote@4.4.1` and adjust the import in `app/aitldr/[slug]/page.tsx` from `next-mdx-remote/rsc` accordingly.

### 2. Wire the subscribe form to a real provider (30 min)

The stub in `app/api/subscribe/route.ts` accepts `{ email, list }` and currently just `console.log`s.

Recommended: **Resend Audiences**.

```bash
npm install resend
```

Then replace the stub body:
```ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY!);

const audienceId = list === 'asec-waitlist'
  ? process.env.RESEND_AUDIENCE_ASEC!
  : list === 'mnemix-beta'
    ? process.env.RESEND_AUDIENCE_MNEMIX!
    : process.env.RESEND_AUDIENCE_TLDR!;

await resend.contacts.create({ email, audienceId, unsubscribed: false });
```

Add to `.env.local` and Vercel project env:
- `RESEND_API_KEY`
- `RESEND_AUDIENCE_TLDR`
- `RESEND_AUDIENCE_ASEC`
- `RESEND_AUDIENCE_MNEMIX`

The user already has Resend connected via Pipedream; you can also use the Resend MCP tool directly if available in this environment.

### 3. Persist the agent webhooks (Supabase) (1-2 hours)

The stubs at `/api/ingest/now` and `/api/ingest/ship` are auth-protected via `Bearer ${AGENT_TOKEN}` and validated with zod. They currently `console.log` and return ok.

**Schema (Supabase):**

```sql
-- table: now_state (single row, updated wholesale)
create table now_state (
  id int primary key default 1,
  agents jsonb not null,
  updated_at timestamptz not null default now()
);

-- table: ship_log (append-only)
create table ship_log (
  id bigserial primary key,
  date_short text not null,        -- "JUN 27"
  text text not null,
  tag text not null,
  created_at timestamptz not null default now()
);
create index on ship_log (created_at desc);
```

Wire the routes to upsert/insert into these tables, then call `revalidateTag('now')` and `revalidateTag('ship')` so the homepage re-renders.

Wire `components/NowPanel.tsx` and `components/ShipLog.tsx` to read from Supabase via tagged fetches with `next: { tags: ['now'] }` / `['ship']`. Keep the seed data as the fallback when the table is empty.

**Multi-tenant readiness:** even though abdur.ai is single-tenant for now, add a `profile_id` column on both tables defaulting to `'abdur'`. The user is planning to spin out asec.co as the multi-tenant version later (HN/Reddit-for-AI-builders). Adding the column now turns the future migration into a `WHERE profile_id = ?` swap.

### 4. Generate the OG cover image (15 min)

The flagship post needs a cover at `public/blog/the-night-the-doctrine-failed/cover.jpg`. Spec is in `/Users/agencyflow/Documents/abdur.ai/abdur-ai-content/posts/11-the-night-the-doctrine-failed/cover-image-brief.md`:

- 1200 × 630 px
- Bg `#0B0A08`, text `#F2EDE6`, accent `#D97757`
- Playfair Display headline
- The two lines: "Every gate returned green." / "None of them were real."

You can generate this server-side using Next.js's `ImageResponse` API at `app/blog/the-night-the-doctrine-failed/cover.jpg/route.tsx`, or just produce a static PNG via Playwright and drop it into `public/`.

### 5. Replace placeholders (5 min)

Search and replace these strings across the project:

- `TODO_X_HANDLE` → user's X handle (e.g. `@abdursayeed`)
- `TODO_GITHUB_HANDLE` → user's GitHub handle

Files: `lib/site.ts` (one source of truth — everything else reads from this).

### 6. Add the other 3 written posts (30 min)

The content vault at `/Users/agencyflow/Documents/abdur.ai/abdur-ai-content/posts/` contains three more fully-written posts:

- `01-voice-ai-memory-latency.md`
- `02-cross-video-pattern-detection.md`
- `08-who-owns-the-architecture.md`

For each, copy the body into a new MDX file at `content/posts/<slug>.mdx` with a frontmatter block matching the shape used by `the-night-the-doctrine-failed.mdx`. Slugs should be:
- `voice-ai-memory-latency-is-a-dead-argument`
- `cross-video-retention-pattern-detection`
- `who-owns-the-architecture-when-ai-writes-the-code`

These slugs are already referenced in the flagship post's `related:` frontmatter — keep them.

### 7. Deploy to Vercel (15 min)

```bash
npx vercel link
npx vercel env add RESEND_API_KEY production
npx vercel env add AGENT_TOKEN production   # generate with: openssl rand -hex 32
# ... and the rest of the env vars
npx vercel deploy --prod
```

Point `abdur.ai` DNS at Vercel via Cloudflare:
- A record `@` → `76.76.21.21`
- CNAME `www` → `cname.vercel-dns.com`

Then verify:
- https://abdur.ai loads
- https://abdur.ai/aitldr/the-night-the-doctrine-failed renders with cover image
- https://abdur.ai/sitemap.xml is valid
- https://abdur.ai/llms.txt returns plain text with the post index
- Run all three preview validators from `/Users/agencyflow/Documents/abdur.ai/abdur-ai-content/posts/11-the-night-the-doctrine-failed/distribution-kit.md`:
  - https://search.google.com/test/rich-results
  - https://cards-dev.twitter.com/validator
  - https://www.linkedin.com/post-inspector/

### 8. (Optional, Phase 2) Stripe + the Library

Three products are seeded in `components/Library.tsx`. To wire real checkout:

```bash
npm install stripe
```

Add `STRIPE_SECRET_KEY` to env. Create three products in Stripe dashboard, get their price IDs, replace the `href` on each `<Product>` with `/api/checkout?price=<price_id>`. Add `/api/checkout/route.ts` that creates a Checkout Session and redirects.

For the Notion template "Board & Investor Reporting OS" — the digital-fulfillment flow is: user pays → Stripe webhook → send Notion duplicate URL via Resend. Build that webhook at `/api/stripe/webhook`.

---

## Architecture decisions you should NOT change

- **Single `lib/site.ts` config.** Everything reads from here. Handles, URLs, OPEN_TO_ROLES toggle. Do not duplicate.
- **`/aitldr` not `/blog`.** The user's brand. Don't rename.
- **Clay palette only.** No new accent colors. If something needs visual hierarchy, use the existing scale (`muted-3`, `muted-2`, `muted`, `text-soft`, `text`).
- **Playfair Display for display, Inter for body, JetBrains Mono for chrome.** All eyebrows, status pills, metadata, code → mono. All headlines → Playfair. All paragraph copy → Inter. Never substitute.
- **`<Reveal>` wrapper for scroll-in animations.** Already supports `prefers-reduced-motion`. Don't add competing motion libraries.
- **Posts live in MDX in `content/posts/`.** Notion CMS sync is Phase 3, not now.

## Architecture decisions you CAN extend

- New blog posts: just drop an `.mdx` file with frontmatter into `content/posts/`. The feed and dynamic route pick it up automatically.
- New tools on the Library: add to the `PRODUCTS` array in `components/Library.tsx`.
- New "now" agents: when the webhook is wired, your agents POST to `/api/ingest/now` and the homepage updates without redeploy.

---

## Distribution kit

When the site is live, the launch playbook lives at:
`/Users/agencyflow/Documents/abdur.ai/abdur-ai-content/posts/11-the-night-the-doctrine-failed/distribution-kit.md`

It has the HN title, the 10-tweet X thread, the LinkedIn post, the two Reddit submissions, and the direct-outreach DM template. Best launch window is Tuesday or Wednesday 7am ET.

---

## Final note

This site is the lead magnet for **Mnemix** (the product) and the proof-of-craft for **applied AI engineer / forward deployed engineer roles at Anthropic and OpenAI**.

The flagship postmortem is the single strongest artifact. Every page should point back to it or to Mnemix. Ship it clean.
