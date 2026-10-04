-- Community database rules (AGE-2972), checked against a throwaway Postgres
-- built from supabase_stub.sql plus every migration in order. Run with
-- scripts/test-community-db.sh. Each check raises on failure; psql runs with
-- ON_ERROR_STOP, so the first broken rule fails the run and names itself.
--
-- Requests are simulated the way PostgREST makes them: SET ROLE to the API
-- role and put the caller's JWT claims in request.jwt.claims.

\set ON_ERROR_STOP on
set client_min_messages = warning;

create schema tests;
grant usage on schema tests to anon, authenticated, service_role;

create function tests.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', false);
  set role anon;
end $$;

create function tests.as_user(email text) returns void language plpgsql as $$
declare uid uuid;
begin
  reset role;
  select id into strict uid from auth.users u where u.email = as_user.email;
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid, 'role', 'authenticated')::text, false);
  set role authenticated;
end $$;

create function tests.as_owner() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', false);
end $$;

-- Passes when q raises an error whose message matches pat.
create function tests.throws(label text, q text, pat text) returns void language plpgsql as $$
begin
  begin
    execute q;
  exception when others then
    if sqlerrm !~* pat then
      raise exception 'FAIL %: expected error ~ "%", got "%"', label, pat, sqlerrm;
    end if;
    return;
  end;
  raise exception 'FAIL %: expected error ~ "%", but it succeeded', label, pat;
end $$;

-- Rows changed by a statement (RLS filters silently, so 0 means "refused").
create function tests.affected(q text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute q;
  get diagnostics n = row_count;
  return n;
end $$;

create function tests.eq(label text, actual anyelement, expected anyelement) returns void
language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception 'FAIL %: expected %, got %', label, expected, actual;
  end if;
end $$;

grant execute on all functions in schema tests to anon, authenticated, service_role;

-- Comment ids the tests refer to, readable from every role.
create table tests.ids (name text primary key, id uuid not null);
grant select, insert on tests.ids to anon, authenticated, service_role;
create function tests.id(n text) returns uuid language sql stable as $$
  select id from tests.ids where name = n
$$;
grant execute on function tests.id(text) to anon, authenticated, service_role;

-- A reader's user id by email (the API roles cannot read auth.users).
create function tests.uid(email text) returns uuid language sql stable security definer as $$
  select id from auth.users u where u.email = uid.email
$$;
grant execute on function tests.uid(text) to anon, authenticated, service_role;

-- Inserts a comment as the current role and records its id under `name`.
create function tests.post(name text, author text, slug text, body text, parent text default null)
returns uuid language plpgsql as $$
declare new_id uuid;
begin
  insert into public.comments (post_slug, parent_id, author_id, content)
  values (slug, tests.id(parent), (select auth.uid()), body)
  returning id into new_id;
  insert into tests.ids values (name, new_id);
  return new_id;
end $$;
grant execute on function tests.post(text, text, text, text, text) to authenticated;

-- ---------- setup: three confirmed readers ----------
insert into auth.users (email, email_confirmed_at, raw_user_meta_data) values
  ('alice@example.test', now(), '{"user_name":"Alice_A","full_name":"Alice"}'),
  ('bob@example.test',   now(), '{"user_name":"bob"}'),
  ('carol@example.test', now(), '{}');

-- Profiles: created by trigger, handles lowercased (not stripped).
select tests.eq('handle lowercased', (select p.handle::text from public.profiles p
  join auth.users u on u.id = p.id where u.email = 'alice@example.test'), 'alice_a');
-- An email sign-up never gets a handle or name from its address (privacy).
select tests.eq('email sign-up gets a placeholder handle', (select p.handle::text ~ '^reader_[0-9a-f]{10}$'
  from public.profiles p join auth.users u on u.id = p.id where u.email = 'carol@example.test'), true);
select tests.eq('email sign-up display name is not the address', (select p.display_name
  from public.profiles p join auth.users u on u.id = p.id where u.email = 'carol@example.test') <> 'carol', true);

-- Back-fill for profiles created by the old trigger: simulate three leaked
-- shapes (exact, cut to 18, collision suffix) plus an OAuth user whose
-- username happens to equal the local part, which must be left alone.
insert into auth.users (email, email_confirmed_at, raw_user_meta_data) values
  ('dave@example.test', now(), '{}'),
  ('averyveryverylonglocalpart@example.test', now(), '{}'),
  ('erin@example.test', now(), '{}'),
  ('frank@example.test', now(), '{"user_name":"frank"}');
update public.profiles p set handle = v.h, display_name = v.d
  from auth.users u, (values ('dave@example.test', 'dave', 'dave'),
                             ('averyveryverylonglocalpart@example.test', 'averyveryverylongl', 'averyveryverylongl'),
                             ('erin@example.test', 'erin_1a2b3', 'Erin Real Name')) v(e, h, d)
 where u.id = p.id and u.email = v.e;
select tests.eq('back-fill redacts exactly the leaked profiles', public.redact_email_derived_handles(), 3);
select tests.eq('leaked handles are placeholders', (select count(*) from public.profiles p join auth.users u on u.id = p.id
  where u.email in ('dave@example.test', 'averyveryverylonglocalpart@example.test', 'erin@example.test')
    and p.handle::text ~ '^reader_[0-9a-f]{10}$'), 3::bigint);
select tests.eq('a leaked display name is replaced', (select p.display_name from public.profiles p
  join auth.users u on u.id = p.id where u.email = 'dave@example.test') ~ '^reader_', true);
select tests.eq('a real display name is kept', (select p.display_name from public.profiles p
  join auth.users u on u.id = p.id where u.email = 'erin@example.test'), 'Erin Real Name');
select tests.eq('an OAuth username is kept', (select p.handle::text from public.profiles p
  join auth.users u on u.id = p.id where u.email = 'frank@example.test'), 'frank');
select tests.as_anon();
select tests.throws('anon cannot run the back-fill', $q$select public.redact_email_derived_handles()$q$, 'permission denied');
select tests.as_owner();

-- ---------- anon ----------
select tests.as_anon();
select tests.throws('anon cannot comment',
  $q$insert into public.comments (post_slug, author_id, content)
     values ('a-post', gen_random_uuid(), 'hi')$q$, 'permission denied');
select tests.as_owner();

-- ---------- posting ----------
select tests.as_user('alice@example.test');
select tests.post('a1', 'alice', 'a-post', 'root by alice');
select tests.throws('cannot post as someone else',
  $q$insert into public.comments (post_slug, author_id, content)
     values ('a-post', tests.uid('bob@example.test'), 'x')$q$,
  'row-level security');
select tests.throws('cannot forge score on insert',
  $q$insert into public.comments (post_slug, author_id, content, score)
     values ('a-post', (select auth.uid()), 'x', 99)$q$, 'permission denied');
select tests.throws('empty comment refused',
  $q$select tests.post('x', 'alice', 'a-post', '   ')$q$, 'empty');
select tests.throws('self-promotion refused',
  $q$update public.profiles set role = 'admin' where id = (select auth.uid())$q$, 'permission denied');

select tests.as_user('bob@example.test');
select tests.post('b1', 'bob', 'a-post', 'reply by bob', 'a1');
select tests.eq('reply depth', (select depth from public.comments where id = tests.id('b1')), 1::smallint);
select tests.throws('cross-post reply refused',
  $q$select tests.post('x', 'bob', 'other-post', 'wrong post', 'a1')$q$, 'not on this post');
select tests.eq('cannot edit another reader''s comment',
  tests.affected($q$update public.comments set content = 'hacked' where id = tests.id('a1')$q$), 0::bigint);

select tests.as_user('carol@example.test');
select tests.post('c1', 'carol', 'a-post', 'reply to bob by carol', 'b1');

-- ---------- depth cap (6) ----------
select tests.as_user('alice@example.test');
select tests.post('d0', 'alice', 'deep-post', 'level 0');
select tests.as_user('bob@example.test');
select tests.post('d1', 'bob', 'deep-post', 'level 1', 'd0');
select tests.as_user('alice@example.test');
select tests.post('d2', 'alice', 'deep-post', 'level 2', 'd1');
select tests.as_user('bob@example.test');
select tests.post('d3', 'bob', 'deep-post', 'level 3', 'd2');
select tests.as_user('alice@example.test');
select tests.post('d4', 'alice', 'deep-post', 'level 4', 'd3');
select tests.as_user('bob@example.test');
select tests.post('d5', 'bob', 'deep-post', 'level 5', 'd4');
select tests.as_user('alice@example.test');
select tests.post('d6', 'alice', 'deep-post', 'level 6', 'd5');
select tests.as_user('bob@example.test');
select tests.throws('depth capped at 6', $q$select tests.post('d7', 'bob', 'deep-post', 'level 7', 'd6')$q$, 'too deep');

-- ---------- rate limit (8 per 10 minutes) ----------
select tests.as_user('carol@example.test');
select tests.post('r' || g, 'carol', 'rate-post', 'comment ' || g) from generate_series(1, 7) g;
select tests.throws('9th comment in 10 minutes refused',
  $q$select tests.post('r9', 'carol', 'rate-post', 'one too many')$q$, 'slow down');

-- ---------- editing and soft delete ----------
select tests.as_user('alice@example.test');
select tests.eq('author edits own comment',
  tests.affected($q$update public.comments set content = 'root by alice (edited)' where id = tests.id('a1')$q$), 1::bigint);
select tests.eq('edit is marked', (select edited_at is not null from public.comments where id = tests.id('a1')), true);
select tests.throws('author cannot moderate',
  $q$update public.comments set status = 'hidden' where id = tests.id('a1')$q$, 'permission denied|only moderators');
select tests.post('a2', 'alice', 'a-post', 'to be deleted');
select tests.eq('soft delete', tests.affected($q$update public.comments set is_deleted = true where id = tests.id('a2')$q$), 1::bigint);
select tests.eq('soft delete wipes text', (select content from public.comments where id = tests.id('a2')), '');
select tests.throws('tombstone cannot be revived',
  $q$update public.comments set is_deleted = false, content = 'back' where id = tests.id('a2')$q$, 'deleted');

-- ---------- votes ----------
select tests.as_user('bob@example.test');
insert into public.comment_votes (user_id, comment_id, vote) values ((select auth.uid()), tests.id('a1'), 1);
select tests.eq('upvote counts', (select score from public.comments where id = tests.id('a1')), 1);
update public.comment_votes set vote = -1 where comment_id = tests.id('a1');
select tests.eq('vote flip', (select score from public.comments where id = tests.id('a1')), -1);
select tests.throws('cannot vote as someone else',
  $q$insert into public.comment_votes (user_id, comment_id, vote)
     values (tests.uid('carol@example.test'), tests.id('a1'), 1)$q$,
  'row-level security');
select tests.throws('cannot vote on a deleted comment',
  $q$insert into public.comment_votes (user_id, comment_id, vote) values ((select auth.uid()), tests.id('a2'), 1)$q$,
  'row-level security');
insert into public.post_votes (user_id, post_slug, vote) values ((select auth.uid()), 'a-post', 1);

select tests.as_user('alice@example.test');
select tests.eq('votes are private', (select count(*) from public.comment_votes), 0::bigint);
insert into public.comment_votes (user_id, comment_id, vote) values ((select auth.uid()), tests.id('b1'), 1);

select tests.as_user('carol@example.test');
insert into public.comment_votes (user_id, comment_id, vote) values ((select auth.uid()), tests.id('b1'), 1);
select tests.eq('two upvotes', (select score from public.comments where id = tests.id('b1')), 2);
delete from public.comment_votes where comment_id = tests.id('b1');
select tests.eq('retract', (select score from public.comments where id = tests.id('b1')), 1);

select tests.as_anon();
select tests.eq('anon reads post totals', (select score from public.post_scores where post_slug = 'a-post'), 1);
select tests.eq('anon reads visible comments', (select count(*) from public.comments where post_slug = 'a-post'), 4::bigint);

-- ---------- moderation (owner / service role) ----------
select tests.as_owner();
update public.comments set status = 'hidden' where id = tests.id('d6');
select tests.as_anon();
select tests.eq('hidden comment invisible to anon', (select count(*) from public.comments where id = tests.id('d6')), 0::bigint);
select tests.as_owner();
update public.comments set status = 'hidden' where id = tests.id('d3');
select tests.as_user('bob@example.test');
select tests.throws('cannot reply to a hidden comment (by id)',
  $q$select tests.post('x', 'bob', 'deep-post', 'reply to hidden', 'd3')$q$, 'not on this post');
select tests.throws('cannot vote on a hidden comment',
  $q$insert into public.comment_votes (user_id, comment_id, vote) values ((select auth.uid()), tests.id('d3'), 1)$q$,
  'row-level security');

-- ---------- account deletion keeps other readers' replies ----------
-- Thread on a-post: a1 (alice) <- b1 (bob, score 1 from alice) <- c1 (carol).
-- Bob also cast a -1 on a1 and a +1 on the post.
select tests.as_owner();
select tests.eq('before: comments on a-post', (select count(*) from public.comments where post_slug = 'a-post'), 4::bigint);
delete from auth.users where email = 'bob@example.test';
select tests.eq('after: no comment lost', (select count(*) from public.comments where post_slug = 'a-post'), 4::bigint);
select tests.eq('carol''s reply survives',
  (select parent_id from public.comments where id = tests.id('c1')), tests.id('b1'));
select tests.eq('bob''s comment is a tombstone',
  (select row(author_id, is_deleted, content)::text from public.comments where id = tests.id('b1')),
  row(null::uuid, true, '')::text);
select tests.eq('bob''s vote on a1 removed', (select score from public.comments where id = tests.id('a1')), 0);
select tests.eq('bob''s post vote removed', (select score from public.post_scores where post_slug = 'a-post'), 0);
select tests.eq('deep thread intact', (select count(*) from public.comments where post_slug = 'deep-post'), 7::bigint);
select tests.throws('an orphan must be a tombstone',
  $q$update public.comments set is_deleted = false, content = 'resurrected' where id = tests.id('b1')$q$,
  'comments_orphan_is_tombstone');

select tests.as_user('alice@example.test');
select tests.throws('no voting on the tombstone',
  $q$update public.comment_votes set vote = -1 where comment_id = tests.id('b1')$q$, 'row-level security');

select tests.as_owner();
\echo 'community db: all checks passed'
