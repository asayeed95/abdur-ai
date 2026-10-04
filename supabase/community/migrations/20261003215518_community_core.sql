-- abdur.ai community core (AGE-2972). Project: abdur-ai (ref pzfbnnubapinhbnwqpnp),
-- deliberately separate from the northsun project (public sign-ups never share
-- an RLS surface with Northsun production data).
--
-- Posts stay MDX in git (founder decision 2026-10-03), so threads key on
-- post_slug text, not a posts table. Every table carries the author's
-- profile id so multi-creator use needs no schema rewrite.
--
-- Trust model:
--   anon           read visible comments, scores, public profiles
--   authenticated  write own profile (not role), own comments, own votes
--   service_role   moderation (status), roles; used only server-side (/admin)
-- Scores are derived by trigger; clients can never write them.

create extension if not exists citext;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle citext not null unique check (handle ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https://'),
  bio text check (bio is null or char_length(bio) <= 280),
  role text not null default 'member' check (role in ('member', 'creator', 'admin')),
  created_at timestamptz not null default now()
);

-- New auth user → profile with a unique, valid placeholder handle the user can change.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  base text := lower(regexp_replace(coalesce(
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    split_part(new.email, '@', 1),
    'reader'), '[^a-z0-9_]', '', 'g'));
  candidate text;
begin
  base := left(case when char_length(base) < 3 then 'reader' else base end, 18);
  candidate := base;
  while exists (select 1 from public.profiles where handle = candidate) loop
    candidate := base || '_' || substr(md5(random()::text), 1, 5);
  end loop;
  insert into public.profiles (id, handle, display_name, avatar_url)
  values (
    new.id,
    candidate,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', candidate), 60),
    case when new.raw_user_meta_data ->> 'avatar_url' ~ '^https://' then new.raw_user_meta_data ->> 'avatar_url' end
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- comments ----------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null check (post_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(post_slug) <= 80),
  parent_id uuid references public.comments (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) <= 5000),
  depth smallint not null default 0,
  score integer not null default 0,
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index comments_post_created on public.comments (post_slug, created_at);
create index comments_parent on public.comments (parent_id);
create index comments_author_created on public.comments (author_id, created_at desc);

-- Insert guard: parent on the same post, depth ≤ 6, non-empty, rate limit.
-- Client-supplied score/status/depth/is_deleted are overwritten.
create function public.comments_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  p record;
begin
  if char_length(btrim(new.content)) = 0 then
    raise exception 'comment is empty' using errcode = '22023';
  end if;
  new.score := 0;
  new.status := 'visible';
  new.is_deleted := false;
  new.edited_at := null;
  new.created_at := now();
  if new.parent_id is null then
    new.depth := 0;
  else
    select post_slug, depth, is_deleted into p from public.comments where id = new.parent_id;
    if not found or p.post_slug <> new.post_slug then
      raise exception 'parent comment is not on this post' using errcode = '22023';
    end if;
    if p.depth >= 6 then
      raise exception 'thread is too deep' using errcode = '22023';
    end if;
    new.depth := p.depth + 1;
  end if;
  if (select count(*) from public.comments
      where author_id = new.author_id and created_at > now() - interval '10 minutes') >= 8 then
    raise exception 'slow down: at most 8 comments per 10 minutes' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger comments_before_insert before insert on public.comments
  for each row execute function public.comments_before_insert();

-- Update guard for end users: only content (own, not deleted) and the
-- one-way soft delete, which wipes the text but keeps the row so replies
-- keep their place in the tree. Service role (moderation) is not limited.
create function public.comments_before_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Moderation (service role) and the definer score trigger are not limited.
  if (select auth.role()) = 'service_role' or pg_trigger_depth() > 1 then
    return new;
  end if;
  if new.post_slug <> old.post_slug or new.parent_id is distinct from old.parent_id
     or new.author_id <> old.author_id or new.depth <> old.depth or new.score <> old.score
     or new.status <> old.status or new.created_at <> old.created_at then
    raise exception 'only content and deletion can change' using errcode = '42501';
  end if;
  if old.is_deleted then
    raise exception 'comment is deleted' using errcode = '42501';
  end if;
  if new.is_deleted then
    new.content := '';
  elsif new.content <> old.content then
    if char_length(btrim(new.content)) = 0 then
      raise exception 'comment is empty' using errcode = '22023';
    end if;
    new.edited_at := now();
  end if;
  return new;
end $$;

create trigger comments_before_update before update on public.comments
  for each row execute function public.comments_before_update();

-- ---------- votes ----------
create table public.comment_votes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  comment_id uuid not null references public.comments (id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);
create index comment_votes_comment on public.comment_votes (comment_id);

create table public.post_votes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_slug text not null check (post_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(post_slug) <= 80),
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (user_id, post_slug)
);
create index post_votes_slug on public.post_votes (post_slug);

-- Score = sum of votes, maintained here so it cannot be forged.
create function public.comment_votes_apply() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.comments
     set score = score + coalesce(case when tg_op <> 'DELETE' then new.vote end, 0)
                       - coalesce(case when tg_op <> 'INSERT' then old.vote end, 0)
   where id = coalesce(new.comment_id, old.comment_id);
  return null;
end $$;

create trigger comment_votes_apply after insert or update or delete on public.comment_votes
  for each row execute function public.comment_votes_apply();

-- Post totals as a public table maintained by trigger: readers see totals,
-- never who voted how (post_votes rows are visible only to their owner).
create table public.post_scores (
  post_slug text primary key,
  score integer not null default 0,
  votes integer not null default 0
);

create function public.post_votes_apply() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    insert into public.post_scores as s (post_slug, score, votes)
    values (new.post_slug, new.vote, 1)
    on conflict (post_slug) do update
      set score = s.score + new.vote - coalesce(case when tg_op = 'UPDATE' then old.vote end, 0),
          votes = s.votes + case when tg_op = 'INSERT' then 1 else 0 end;
  else
    update public.post_scores set score = score - old.vote, votes = votes - 1 where post_slug = old.post_slug;
  end if;
  return null;
end $$;

create trigger post_votes_apply after insert or update or delete on public.post_votes
  for each row execute function public.post_votes_apply();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.comments enable row level security;
alter table public.comment_votes enable row level security;
alter table public.post_votes enable row level security;
alter table public.post_scores enable row level security;

create policy "profiles are public" on public.profiles for select to anon, authenticated using (true);
create policy "users edit own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "visible comments are public" on public.comments for select to anon, authenticated
  using (status = 'visible');
create policy "authors post as themselves" on public.comments for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy "authors edit own comments" on public.comments for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));

create policy "users see own comment votes" on public.comment_votes for select to authenticated
  using (user_id = (select auth.uid()));
create policy "users cast own comment votes" on public.comment_votes for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "users change own comment votes" on public.comment_votes for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "users retract own comment votes" on public.comment_votes for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "post totals are public" on public.post_scores for select to anon, authenticated using (true);

create policy "users see own post votes" on public.post_votes for select to authenticated
  using (user_id = (select auth.uid()));
create policy "users cast own post votes" on public.post_votes for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "users change own post votes" on public.post_votes for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "users retract own post votes" on public.post_votes for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------- column privileges (defence in depth beyond triggers) ----------
revoke all on public.profiles, public.comments, public.comment_votes, public.post_votes, public.post_scores from anon, authenticated;
grant select on public.profiles, public.comments to anon, authenticated;
grant update (handle, display_name, avatar_url, bio) on public.profiles to authenticated;
grant insert (post_slug, parent_id, author_id, content) on public.comments to authenticated;
grant update (content, is_deleted) on public.comments to authenticated;
grant select, insert, delete on public.comment_votes, public.post_votes to authenticated;
grant update (vote) on public.comment_votes, public.post_votes to authenticated;
grant select on public.post_scores to anon, authenticated;

revoke execute on function public.handle_new_user(), public.comments_before_insert(),
  public.comments_before_update(), public.comment_votes_apply(), public.post_votes_apply() from public, anon, authenticated;
