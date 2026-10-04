-- Fix: handle_new_user stripped [^a-z0-9_] BEFORE lowercasing, so capital
-- letters were deleted instead of folded ("RLS Tester!" → "ester",
-- "Asayeed95" → "sayeed95"). Caught by the RLS probe on 2026-10-03, before
-- any real user signed up. Lowercase first, then strip.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  base text := regexp_replace(lower(coalesce(
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    split_part(new.email, '@', 1),
    'reader')), '[^a-z0-9_]', '', 'g');
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

revoke execute on function public.handle_new_user() from public, anon, authenticated;
