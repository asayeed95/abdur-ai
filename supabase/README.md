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

## Preview-env posture (Vercel)

`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set on the Vercel project's
**preview** environment (added 2026-09-04 for W-1 preview verification, left in place).
This is acceptable **only because** the project enforces Vercel Authentication
(`ssoProtection: all_except_custom_domains`): previews are not public, so the service-role
key — which bypasses RLS entirely — is reachable only behind SSO. If SSO protection is ever
disabled, or a long-lived protection-bypass token is issued, this posture must be
re-evaluated: a preview deployment would then expose a working RLS-bypass credential to
anyone who can reach the preview URL. Bypass tokens used for automated verification must be
revoked after use (the W-1 verification token was).
