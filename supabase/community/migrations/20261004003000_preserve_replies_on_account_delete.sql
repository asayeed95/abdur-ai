-- Fix (Forge F2 on PR #72, 2026-10-03): deleting a reader's account deleted
-- other readers' replies. auth.users -> profiles -> comments.author_id were
-- all ON DELETE CASCADE, and comments.parent_id cascades too, so removing one
-- account took every reply under that reader's comments with it (Forge
-- measured 9 comments -> 2).
--
-- Now an account deletion detaches the reader's comments instead: author_id
-- becomes null and the row turns into the same tombstone a reader's own
-- delete leaves (empty text, is_deleted). Their words go with the account;
-- everyone else's replies keep their place in the thread. Their votes still
-- cascade away and the score triggers subtract them.
--
-- Also (Claude security review H2 / Forge F5b): a caller who knew a hidden
-- comment's id could still reply to it or vote on it. Both are refused now.

alter table public.comments
  alter column author_id drop not null,
  drop constraint comments_author_id_fkey,
  add constraint comments_author_id_fkey foreign key (author_id)
    references public.profiles (id) on delete set null;

-- Runs inside the referential SET NULL (as the table owner), after the
-- end-user guard, which only restricts anon and authenticated.
create function public.comments_tombstone_orphans() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.author_id is null and old.author_id is not null then
    new.is_deleted := true;
    new.content := '';
  end if;
  return new;
end $$;

create trigger comments_tombstone_orphans before update of author_id on public.comments
  for each row execute function public.comments_tombstone_orphans();

-- A comment without an author can only ever be a tombstone.
alter table public.comments add constraint comments_orphan_is_tombstone
  check (author_id is not null or (is_deleted and content = ''));

-- Insert guard, unchanged except that a hidden parent is refused with the
-- same message as a missing one, so the error reveals nothing about it.
create or replace function public.comments_before_insert() returns trigger
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
    select post_slug, depth, status into p from public.comments where id = new.parent_id;
    if not found or p.status <> 'visible' or p.post_slug <> new.post_slug then
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

-- Votes only on comments a reader can see and that still have text.
-- Retracting an existing vote stays allowed, so nobody is stuck with one.
drop policy "users cast own comment votes" on public.comment_votes;
create policy "users cast own comment votes" on public.comment_votes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.comments c
                where c.id = comment_id and c.status = 'visible' and not c.is_deleted)
  );
drop policy "users change own comment votes" on public.comment_votes;
create policy "users change own comment votes" on public.comment_votes for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.comments c
                where c.id = comment_id and c.status = 'visible' and not c.is_deleted)
  );

revoke execute on function public.comments_tombstone_orphans(), public.comments_before_insert()
  from public, anon, authenticated;
