-- Fix: the end-user update guard exempted only auth.role() = 'service_role',
-- which reads the request JWT. The database owner (dashboard SQL editor,
-- migrations) has no JWT, so it could not moderate — `status = 'hidden'`
-- raised "only content and deletion can change". Found 2026-10-03 while
-- hiding e2e test comments.
--
-- The guard needs no elevated rights (it only edits NEW), so run it as the
-- caller and restrict exactly the two public roles. Everything else —
-- service_role via PostgREST, the owner, and the definer score trigger
-- (which runs as the owner) — passes.
create or replace function public.comments_before_update() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if current_user not in ('anon', 'authenticated') then
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

revoke execute on function public.comments_before_update() from public, anon, authenticated;
