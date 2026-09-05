-- W-1: now_state + ship_log tables for the /now and /ship ingest pipeline.
-- RLS posture: enabled on both tables with NO public policies.
-- All access is server-side via service_role, which bypasses RLS.

create table if not exists now_state (
  profile_id text primary key default 'abdur',
  agents jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists ship_log (
  id bigserial primary key,
  profile_id text not null default 'abdur',
  date_short text not null,
  text text not null,
  tag text not null,
  client_id text,
  created_at timestamptz not null default now()
);

create index if not exists ship_log_profile_created_idx
  on ship_log (profile_id, created_at desc);

create unique index if not exists ship_log_client_id_uq
  on ship_log (profile_id, client_id)
  where client_id is not null;

alter table now_state enable row level security;
alter table ship_log enable row level security;
