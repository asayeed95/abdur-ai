# Supabase: community (comments and votes)

This is the database behind reader comments and votes (AGE-2972). It is a **separate project** from `northsun`, which is documented in `../README.md`. Public sign-ups never share data or an RLS surface with Northsun production.

| | |
|---|---|
| Project | `abdur-ai`, ref `pzfbnnubapinhbnwqpnp`, region `us-east-1` |
| Org | AgencyFlow HQ, **free plan** (founder decision 2026-10-03; Northsun org is Pro and would bill a second project) |
| URL | `https://pzfbnnubapinhbnwqpnp.supabase.co` → `NEXT_PUBLIC_COMMUNITY_SUPABASE_URL` |
| Browser key | the project's *publishable* key → `NEXT_PUBLIC_COMMUNITY_SUPABASE_PUBLISHABLE_KEY` (public by design) |
| Server key | service role, for `/admin` moderation only (AGE-2974). Keep it in Doppler and never put it in `NEXT_PUBLIC_*` |

## Migrations (applied in order, 2026-10-03, Supabase MCP `apply_migration`)

1. `20261003210000_community_core.sql`: `profiles`, `comments`, `comment_votes`, `post_votes`, `post_scores`, triggers, RLS and column grants.
2. `20261003211500_handle_lowercase_first.sql`: the handle generator now lowercases before stripping. It had turned "Asayeed95" into "sayeed95".
3. `20261003212000_citext_to_extensions.sql`: moves `citext` out of `public` (security advisor 0014).
4. `20261003223000_moderation_guard_by_role.sql`: the update guard restricts only `anon`/`authenticated`. The owner could not moderate before.

## Trust model

- **Anyone (`anon`)** can read visible comments, public profiles and post score totals. It cannot write anything.
- **Signed-in users (`authenticated`)**:
  - Edit their own profile, but not `role`.
  - Insert comments as themselves only. The parent must be on the same post, depth is at most 6, and the limit is 8 per 10 minutes.
  - Edit their own content, or soft-delete. Deleting wipes the text and keeps the row so replies keep their place, and a deleted comment is final.
  - Cast, flip and retract their own votes. They see only their own votes.
- **Scores** are maintained by `security definer` triggers. Clients can never write `score`, `status`, `depth` or `author_id`; this is enforced twice, by column grants and by a trigger.
- **Moderation** (`status = 'hidden'`) is for `service_role` or the owner. Hidden rows are invisible to readers.
- **Posts are MDX in git**, so threads key on `post_slug`. A post opts in with `comments: true` in its frontmatter; it is off by default (founder decision 2026-10-03).

## Verified (2026-10-03)

- **SQL probe** (role-switched, rolled back), all pass: impersonation, cross-post reply, forged score, self-moderation, self-promotion, edit after delete, editing someone else's comment, anon writes, depth and rate limits, vote flip and retract arithmetic, owner moderation hiding from anon, and case-insensitive unique handles.
- **Browser e2e** (Chromium, two real password users, built site), 16/16:
  - sign-in gate
  - markdown rendering with no raw HTML or images, and `nofollow ugc` links
  - edit marker
  - controls appear only on your own comments
  - optimistic votes reconciled with the server (+1 → −1 → 0)
  - replies, and the tombstone keeping the thread
  - 375 px light without overflow, and dark
- **Security advisor:** 0 findings. **Performance advisor:** only "unused index" on empty tables.

## Operations

- **Free projects pause after about 7 days without activity.** The keep-alive is tracked in Linear. Until it exists, a paused project shows "Couldn't load the discussion" and nothing breaks.
- **Test data:** two e2e users (`e2e-a@abdur-ai.invalid`, `e2e-b@abdur-ai.invalid`) and their comments, all `hidden`. Delete them in the dashboard (Authentication → Users); this cascades. The Supabase MCP holds `DELETE` statements for an interactive confirmation that a cloud session cannot give, so they were left in place.
- **Auth providers (founder):** turn on GitHub OAuth (Authentication → Providers; callback `https://pzfbnnubapinhbnwqpnp.supabase.co/auth/v1/callback`) and set the Site URL to `https://abdur.ai` plus redirect URLs `https://abdur.ai/**`. Email magic links work out of the box, but Supabase's built-in mailer is heavily rate-limited. Before real traffic, point Auth SMTP at Resend (blocked on AGE-2892).
