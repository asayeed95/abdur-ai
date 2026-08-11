# mnemix aee3f57 — fix(web): dashboard tenants select('*') 42501s unconditionally post-031 — P0 hotfix (#433)
**Receipts:** `git -C mnemix log -1 aee3f57` (merged to main) — Abdur Rahman, 2026-07-11

Migration 031 (merged 2026-07-07) narrowed the `authenticated` SELECT grant on
`tenants` to a specific column list (no tenant_secret/api_key_hash). Postgres
expands `select('*')` to the full column list at parse time and checks column
privilege BEFORE row filtering — so the query 42501s ("permission denied for
table tenants") unconditionally, regardless of whether any row matches. This
has been breaking dashboard/layout.tsx (every authenticated page load) and
dashboard/page.tsx (the overview) for every logged-in user, including the one
real dashboard tenant, for 3 days. My own PR #410 guard turned the resulting
data:null+error into a "couldn't load your workspace" retry screen instead of
a raw crash — directionally right, but it papered over the real bug rather
than fixing it, because I never end-to-end tested the actual dashboard load
against prod post-031.

Verified root cause AND fix live against prod (Supabase Mgmt API):
- `SET ROLE authenticated; SELECT * FROM tenants WHERE user_id = <random>` ->
  42501 even for a non-matching row (proves it's a column-privilege error, not
  a data issue).
- Full simulation with the real tenant's JWT sub set + the new explicit column
  list -> returns the actual row, no error.

Fix: narrow both selects to the exact columns each page uses / the exact
`authenticated` grant list from migration 031 (id, name, plan, settings,
webhook_url, webhook_secret, enrichment_spend, enrichment_cap, contacts_count,
interactions_count, created_at, user_id). No behavior change for any granted
field; purely restores the ability to read the row at all.

Scope note: keys/actions.ts (generate/revoke API key) independently UPDATEs
`api_key_hash`, which 031 also does not grant to `authenticated` — same root
cause, different fix (a server-side route, not a wider grant, since granting
it back would reopen the abuse vector 031 closed). That is out of scope here
and filed as its own Linear issue for Codex.

next build green.


Claude-Session: https://claude.ai/code/session_01CnfT3Lfoef2FrKnUob1kKB

Co-authored-by: Claude Fable 5 <noreply@anthropic.com>

**Used by:** `content/posts/_drafts/the-dashboard-query-rls-wouldnt-let-through.mdx` (Mistakes TLDR draft, P-020)
