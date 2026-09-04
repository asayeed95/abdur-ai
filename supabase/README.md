# Supabase — W-1 ingest tables

- Project: `northsun` (ref `rfbjfpuzzszfzabjruit`), region `us-east-1`, status ACTIVE_HEALTHY.
- Project URL (safe for `NEXT_PUBLIC_SUPABASE_URL`): `https://rfbjfpuzzszfzabjruit.supabase.co`
- Migration: `migrations/20260904000000_now_state_ship_log.sql` — applied 2026-09-04 via the
  management API query endpoint (`POST /v1/projects/<ref>/database/query`).
- Schema: `now_state` (singleton agent-state JSONB per profile) and `ship_log`
  (append-only shipping log; unique partial index on `(profile_id, client_id)` for idempotent ingest).
- RLS: enabled on both tables, zero public policies. All access is server-side via the
  `service_role` key (bypasses RLS); anon/bogus keys get 401 from PostgREST.
- Verified: service-role `GET /rest/v1/now_state?select=*` and `.../ship_log?select=*` both
  return 200 with `[]`; bogus-key requests return 401. Key material lives in doppler
  (`asec-production/prd`); do not commit it here.
