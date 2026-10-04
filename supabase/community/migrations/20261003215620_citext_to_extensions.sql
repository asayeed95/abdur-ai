-- Security advisor 0014 (extension_in_public): keep citext out of the
-- PostgREST-exposed public schema. Column types move with the extension.
create schema if not exists extensions;
alter extension citext set schema extensions;
