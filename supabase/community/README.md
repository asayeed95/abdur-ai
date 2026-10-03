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
5. `20261003230000_admin_moderation.sql` (AGE-2974): adds `public.admins` (an email allowlist that no API role can read), `public.is_admin()` (caller's *confirmed* email in the allowlist) and RLS so admins can read hidden comments and change `status` only. The web server never holds a service-role key.

**Seed the founder as admin** (SQL editor): `insert into public.admins (email) values ('<founder email>');` The same address goes in Vercel `ADMIN_EMAILS`. Both gates must pass.

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
- **Admin (AGE-2974):** 12/12 SQL checks. A member can't moderate; an unconfirmed allowlisted email isn't admin; a moderator can hide and unhide but can't edit, delete or rescore others' comments; author edits still work.
- **Browser e2e:** 10/10, plus HTTP checks. Signed-out → login; signed-in but not allowlisted → 404 on every admin page; forged token → login; without a `public.admins` row the database refuses moderation (second gate holds); hide/unhide is reflected for anon; the editor dry-run save and validation work.
- **Security advisor:** two accepted findings.
  1. `admins` has RLS with no policies: intentional, the API must never read it.
  2. `is_admin()` is callable by `authenticated`: intentional, it returns only the caller's own status and the dashboard uses it.

  Open, for the founder: *leaked password protection* is off. The site never uses passwords, so turn off password sign-ups (or enable the check) in Auth settings.
- **Performance advisor:** only "unused index" on empty tables.

## Operations

- **Free projects pause after about 7 days without activity.** The keep-alive is tracked in Linear. Until it exists, a paused project shows "Couldn't load the discussion" and nothing breaks.
- **Test data:** two e2e users (`e2e-a@abdur-ai.invalid`, `e2e-b@abdur-ai.invalid`), now **banned with random passwords**, plus their comments (all `hidden`) and one retired `public.admins` row (`retired-e2e-…`). Delete them in the dashboard (Authentication → Users); this cascades. The Supabase MCP holds `DELETE` statements for an interactive confirmation that a cloud session cannot give, so they were left in place.
- **Auth providers (founder):** turn on GitHub OAuth (Authentication → Providers; callback `https://pzfbnnubapinhbnwqpnp.supabase.co/auth/v1/callback`) and set the Site URL to `https://abdur.ai` plus redirect URLs `https://abdur.ai/**`. Email magic links work out of the box, but Supabase's built-in mailer is heavily rate-limited. Before real traffic, point Auth SMTP at Resend (blocked on AGE-2892).
