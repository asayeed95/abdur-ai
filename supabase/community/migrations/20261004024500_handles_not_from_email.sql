-- Privacy fix (CodeRabbit on PR #73, 2026-10-04): an email magic-link
-- sign-up has no provider username, so handle_new_user fell back to the
-- email's local part, and display_name copied it. Both are public
-- ("profiles are public"), and for addresses like jane.smith@gmail.com the
-- handle is enough to rebuild the address.
--
-- Now: an OAuth username is kept, as before. Without one, the reader gets a
-- non-identifying placeholder derived from their user id (reader_<10 hex>),
-- which they can change. Existing profiles whose handle or display name came
-- from the email local part are back-filled the same way.

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  placeholder text := 'reader_' || substr(replace(new.id::text, '-', ''), 1, 10);
  base text := regexp_replace(lower(coalesce(
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    placeholder)), '[^a-z0-9_]', '', 'g');
  candidate text;
begin
  base := left(case when char_length(base) < 3 then placeholder else base end, 18);
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

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Back-fill: profiles whose handle came from the email local part (exact,
-- cut to 18 characters, or with a collision suffix). The old code set
-- display_name to the handle when the provider sent no name, so it is
-- replaced only when it still equals the old handle. Kept as a function so
-- the test suite can exercise it; not callable through the API.
create function public.redact_email_derived_handles() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  n integer;
begin
  with leaked as (
    select p.id, p.handle::text as old_handle,
           left(regexp_replace(lower(split_part(u.email, '@', 1)), '[^a-z0-9_]', '', 'g'), 18) as local
      from public.profiles p
      join auth.users u on u.id = p.id
     where u.email is not null
       -- Only accounts without a provider username took the email fallback.
       and coalesce(u.raw_user_meta_data ->> 'user_name', u.raw_user_meta_data ->> 'preferred_username') is null
  )
  update public.profiles p
     set handle = 'reader_' || substr(replace(p.id::text, '-', ''), 1, 10),
         display_name = case when p.display_name = l.old_handle
                              or lower(p.display_name) = l.local
                             then 'reader_' || substr(replace(p.id::text, '-', ''), 1, 10)
                             else p.display_name end
    from leaked l
   where l.id = p.id
     and char_length(l.local) >= 3
     and (l.old_handle = l.local or l.old_handle like l.local || '\_%');
  get diagnostics n = row_count;
  return n;
end $$;

revoke execute on function public.redact_email_derived_handles() from public, anon, authenticated;

select public.redact_email_derived_handles();
