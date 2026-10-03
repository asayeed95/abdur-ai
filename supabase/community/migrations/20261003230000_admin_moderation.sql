-- Moderation for /admin without a service-role key on the web server (AGE-2974).
--
-- An allowlist table nobody can read through the API, an is_admin() check
-- bound to the caller's *confirmed* email, and RLS that lets admins read
-- hidden comments and change status. The update guard keeps the split:
-- moderators change status only; only the author edits or deletes text.
-- Seed with:  insert into public.admins (email) values ('<founder email>');

create table public.admins (
  email extensions.citext primary key,
  added_at timestamptz not null default now()
);
alter table public.admins enable row level security; -- no policies: API cannot read or write it
revoke all on public.admins from anon, authenticated;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from auth.users u
    join public.admins a on lower(a.email::text) = lower(u.email)
    where u.id = (select auth.uid()) and u.email_confirmed_at is not null
  );
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "admins read all comments" on public.comments for select to authenticated
  using ((select public.is_admin()));
create policy "admins moderate comments" on public.comments for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

grant update (status) on public.comments to authenticated;

create or replace function public.comments_before_update() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if new.post_slug <> old.post_slug or new.parent_id is distinct from old.parent_id
     or new.author_id <> old.author_id or new.depth <> old.depth or new.score <> old.score
     or new.created_at <> old.created_at then
    raise exception 'only content, deletion and moderation status can change' using errcode = '42501';
  end if;
  if new.status <> old.status and not public.is_admin() then
    raise exception 'only moderators can change status' using errcode = '42501';
  end if;
  if new.content is distinct from old.content or new.is_deleted <> old.is_deleted then
    if old.author_id <> (select auth.uid()) then
      raise exception 'only the author can edit or delete a comment' using errcode = '42501';
    end if;
    if old.is_deleted then
      raise exception 'comment is deleted' using errcode = '42501';
    end if;
    if new.is_deleted then
      new.content := '';
    else
      if char_length(btrim(new.content)) = 0 then
        raise exception 'comment is empty' using errcode = '22023';
      end if;
      new.edited_at := now();
    end if;
  end if;
  return new;
end $$;

revoke execute on function public.comments_before_update() from public, anon, authenticated;
