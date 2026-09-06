-- AGE-1402 Slice A: append-only subscriber candidate events.
--
-- One row per observed Resend audience-contact state. This table is the
-- durable stand-in for the packet's "append-only JSONL" on a platform with a
-- read-only filesystem; `scripts/export-candidates.mjs` materialises the
-- JSONL that Prospector promotes into reports/prospector/accounts.jsonl.
--
-- Append-only by construction: `event_id` is unique and nothing in the
-- application ever issues an UPDATE, so a filled first-touch value can never
-- be overwritten by a later observation (acceptance A1). A webhook
-- re-delivery hits the unique index and is treated as success (A2).
--
-- RLS posture matches the W-1 tables: enabled, NO public policies, all
-- access server-side via service_role (which bypasses RLS).

create table if not exists subscriber_candidates (
  event_id text primary key,
  received_at timestamptz not null default now(),
  email text not null,
  audience text not null,
  resend_contact_id text not null,
  properties jsonb not null default '{}'::jsonb,
  channel text not null default 'abdur.ai_subscribe',
  event text not null,
  evidence text,
  promoted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Export ordering + Prospector's "everything since my cursor" read.
create index if not exists subscriber_candidates_received_idx
  on subscriber_candidates (received_at asc, event_id asc);

-- Dedupe by person when promoting: newest observation per contact.
create index if not exists subscriber_candidates_contact_idx
  on subscriber_candidates (resend_contact_id, received_at desc);

alter table subscriber_candidates enable row level security;
