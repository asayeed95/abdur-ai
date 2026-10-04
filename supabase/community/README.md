# Supabase: community (comments and votes)

This is the database behind reader comments and votes (AGE-2972). It is a **separate project** from `northsun`, which is documented in `../README.md`. Public sign-ups never share data or an RLS surface with Northsun production.

| | |
|---|---|
| Project | `abdur-ai`, ref `pzfbnnubapinhbnwqpnp`, region `us-east-1` |
| Org | AgencyFlow HQ, **free plan** (founder decision 2026-10-03; Northsun org is Pro and would bill a second project) |
| URL | `https://pzfbnnubapinhbnwqpnp.supabase.co` → `NEXT_PUBLIC_COMMUNITY_SUPABASE_URL` |
| Browser key | the project's *publishable* key → `NEXT_PUBLIC_COMMUNITY_SUPABASE_PUBLISHABLE_KEY` (public by design) |
| Server key | service role: **not used by the web server** (`/admin` moderates through `public.is_admin()` + RLS, AGE-2974). Keep it in Doppler for dashboard and SQL-editor work only; never put it in Vercel or `NEXT_PUBLIC_*` |

## Migrations

Applied migrations carry the version the live project recorded in their file names, so `supabase migration list` reconciles. Files 1–4 were applied on 2026-10-03 through the Supabase MCP `apply_migration`. Files not yet applied carry a provisional version; rename each to the recorded one after applying it.

1. `20261003215518_community_core.sql`: `profiles`, `comments`, `comment_votes`, `post_votes`, `post_scores`, triggers, RLS and column grants.
2. `20261003215607_handle_lowercase_first.sql`: the handle generator now lowercases before stripping. It had turned "Asayeed95" into "sayeed95".
3. `20261003215620_citext_to_extensions.sql`: moves `citext` out of `public` (security advisor 0014).
4. `20261003221021_moderation_guard_by_role.sql`: the update guard restricts only `anon`/`authenticated`. The owner could not moderate before.
5. `20261004003000_preserve_replies_on_account_delete.sql`: **not yet applied live.** Deleting an account used to delete every reply under that reader's comments (Forge measured 9 comments → 2). Now the reader's comments become tombstones and other readers' replies stay. It also refuses replies and votes on hidden comments. The Supabase MCP holds `DROP` statements for an interactive confirmation, as it does `DELETE`, so apply this one after review: paste it into the dashboard SQL Editor, then rename the file to the version the project records.
6. `20261004024500_handles_not_from_email.sql`: **not yet applied live.** An email sign-up has no provider username, so the handle and display name were built from the email's local part, which is public. Email sign-ups now get a `reader_<id>` placeholder; OAuth usernames are kept. It also back-fills profiles that already leaked (`public.redact_email_derived_handles()`, not callable through the API). Apply it with migration 5, in order.

## Tests

`scripts/test-community-db.sh` builds a throwaway database on plain Postgres 16. It loads `tests/supabase_stub.sql` (the API roles, `auth.users`, `auth.uid()`), applies every migration in order, and runs `tests/rls.test.sql`. CI runs it against a Postgres service; locally, point `PGHOST`/`PGPORT`/`PGUSER` at any superuser connection. It never touches the live project.

## Trust model

- **Anyone (`anon`)** can read visible comments, public profiles and post score totals. It cannot write anything.
- **Signed-in users (`authenticated`)**:
  - Edit their own profile, but not `role`. Email sign-ups start with a `reader_<id>` placeholder handle, never one derived from their address.
  - Insert comments as themselves only. The parent must be visible and on the same post, depth is at most 6, and the limit is 8 per 10 minutes.
  - Edit their own content, or soft-delete. Deleting wipes the text and keeps the row so replies keep their place, and a deleted comment is final.
  - Cast, flip and retract their own votes, on visible comments that still have text. They see only their own votes.
- **Deleting an account** removes the reader's profile and votes. Their comments stay as tombstones (no author, no text), so other readers' replies keep their place. **This holds only once `20261004003000_preserve_replies_on_account_delete` is applied live.** Until then the live project still cascades and deletes other readers' replies, so don't delete accounts and don't enable comments on any post before applying it. Check with: `select confdeltype from pg_constraint where conname = 'comments_author_id_fkey'` → `n` (set null), not `c`.
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

- **Free projects pause after about 7 days without activity.** `.github/workflows/community-keepalive.yml` reads one row daily, but scheduled workflows run only from the default branch, so it starts working once this PR is merged to `main` (AGE-2988). Before that, or if the job ever fails, a paused project shows "Couldn't load the discussion" and nothing breaks; restore it from the Supabase dashboard.
- **Test data:** two e2e users (`e2e-a@abdur-ai.invalid`, `e2e-b@abdur-ai.invalid`) and their comments, all `hidden`. Delete them in the dashboard (Authentication → Users). Once `20261004003000_preserve_replies_on_account_delete` is applied, their comments become tombstones; before it, they cascade. The Supabase MCP holds `DELETE` statements for an interactive confirmation that a cloud session cannot give, so they were left in place.
- **Auth providers (founder):** turn on GitHub OAuth (Authentication → Providers; callback `https://pzfbnnubapinhbnwqpnp.supabase.co/auth/v1/callback`) and set the Site URL to `https://abdur.ai` plus redirect URLs `https://abdur.ai/**`. Email magic links work out of the box, but Supabase's built-in mailer is heavily rate-limited. Before real traffic, point Auth SMTP at Resend (blocked on AGE-2892).
