-- Minimal stand-in for the parts of a Supabase project the community
-- migrations rely on, so they can be applied to a plain Postgres 16 and
-- tested offline (scripts/test-community-db.sh). Mirrors hosted Supabase:
--   * the API roles anon / authenticated / service_role
--   * auth.users with the columns the triggers read
--   * auth.uid() / auth.role() / auth.jwt() reading request.jwt.claims,
--     the setting PostgREST sets per request
--   * Supabase's default grants: API roles get ALL on new public tables,
--     which is why the migrations revoke and re-grant column by column.
-- Never apply this to a real project.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant anon, authenticated, service_role to current_user;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);

create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid
$$;
create function auth.role() returns text language sql stable as $$
  select auth.jwt() ->> 'role'
$$;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
