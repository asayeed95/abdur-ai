#!/usr/bin/env bash
# Offline test of the community database rules (AGE-2972).
#
# Builds a fresh database on a plain Postgres 16, applies the Supabase stub
# and every migration in supabase/community/migrations/ in filename order,
# then runs supabase/community/tests/rls.test.sql. Never touches the live
# project. Exits non-zero on the first broken rule.
#
#   PGHOST=... PGPORT=... PGUSER=postgres ./scripts/test-community-db.sh
#
# Needs a superuser connection (it creates roles); CI uses a postgres service.
set -euo pipefail

cd "$(dirname "$0")/.."
DB="community_test_$$"

psql -v ON_ERROR_STOP=1 -qX -d postgres -c "create database $DB" >/dev/null
cleanup() {
  psql -qX -d postgres -c "drop database if exists $DB" >/dev/null 2>&1 || true
  # Roles are cluster-wide; drop them so the next run starts clean.
  psql -qX -d postgres -c "drop role if exists anon; drop role if exists authenticated; drop role if exists service_role" >/dev/null 2>&1 || true
}
trap cleanup EXIT

run() { psql -v ON_ERROR_STOP=1 -qX -d "$DB" -f "$1" >/dev/null; }

run supabase/community/tests/supabase_stub.sql
for f in supabase/community/migrations/*.sql; do
  echo "migrate  $(basename "$f")"
  run "$f"
done
psql -v ON_ERROR_STOP=1 -qX -o /dev/null -d "$DB" -f supabase/community/tests/rls.test.sql
