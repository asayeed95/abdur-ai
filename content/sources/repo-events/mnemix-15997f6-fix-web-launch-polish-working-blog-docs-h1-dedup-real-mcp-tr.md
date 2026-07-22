# mnemix 15997f6 — fix(web): launch-polish — working blog, docs H1 dedup, real MCP transport, latency + closer locks (#411)
**Receipts:** `git -C mnemix log -1 15997f6` (merged to main) — Abdur Rahman, 2026-07-09

* fix(web): launch-polish sweep — working blog, docs H1, real MCP transport, latency + closer locks

Rebased onto main post-#408 (enterprise SEO/AEO audit, 88-finding sweep) and
#409 (marketing operating system docs). Reconciled 5 overlapping files:
AGENTS.md/data.ts/knowledge.ts closer-text converged cleanly (near-identical
fixes); privacy/page.tsx defers to #408's systematic voice-wedge positioning
pass; blog/page.tsx and installation.md keep this branch's fixes (a real
6-post blog over #408's "disable the dead links" approach; the real hosted
MCP transport, which #408 didn't address).

Original scope (production mnemix.ai, pre-open audit):
- Blog: replace 8 dead `href="#"` cards (and a fabricated "40 teams, 3 months"
  beta claim) with a real working blog — 6 lock-clean posts in
  src/content/blog/*.md, lib/blog.ts loader, /blog/[slug] MDX route.
- Docs: strip the leading body H1 in lib/docs.ts (and blog.ts) — every docs
  page was rendering its title twice.
- MCP: replace the phantom `@mnemix-ai/mcp-server` npm package (404 on
  registry) with the real hosted HTTP transport (mcp.mnemix.ai/mcp,
  type:http) across installation.md, mcp-server.md, and LiveApiDemo.
- Latency locks: remove fabricated telemetry (homepage `timing_ms.total: 286`,
  demo `timing_ms: 121`); keep only "designed for sub-300ms voice recall".
- Footer: dedupe the duplicate Security link; repoint the 404 GitHub link
  (asayeed95/mnemix → github.com/mnemix-ai); add rel=noopener.
- Closer: canonicalize "Choose Mnemix as your agent memory layer."
- Copy: de-risk the Letta FAQ (was a leaked-note-style competitor source
  cite, which #408's pass didn't touch); ground the docs Introduction in the
  locked identity; refresh stale AGENTS.md locks.

Verified: `npm run build` + `npm run lint` green post-rebase (6 blog + 12 docs
SSG), live-server QA of /blog, /blog/[slug], /docs/architecture,
/docs/installation (heading renders correctly — the rebase's first pass had a
merge-splice bug dropping a newline before an `### H3`, fixed here).

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013p7knLBm8JFUWqvviWLBzD

* fix(web): split tenant-lookup destructure so tenantLookupError stays const

Pre-existing lint error surfaced while rebasing #411 onto main post-#408 —
tenant is reassigned after provisioning but tenantLookupError never is;
prefer-const was flagging the whole destructure. Unrelated to the AEO/SEO
content work, fixed in passing since it blocked a clean `npm run lint`.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013p7knLBm8JFUWqvviWLBzD

* fix(web): G5 — OpenAPI request schemas match the real Zod validators

Verified against src/types.ts. Two drifts found; both cause hard 422s or
misleading autocomplete for anyone building strictly from the published spec:

- CallEndRequest: `transcript` was typed as a bare string (real shape is an
  array of {role, text, ts_ms} turns); `duration_s` was missing entirely
  despite being required; `metadata` should be `agent_metadata`; `required[]`
  was missing transcript/duration_s/outcome. Added a TranscriptTurn schema
  and the real outcome enum (appointment_booked/quote_given/
  callback_requested/no_answer/other).
- RecallAndEnrichRequest: had a phantom `call_id` field that doesn't exist on
  CallsEndRequestSchema; was missing the real optional `agent_id`/`trigger`
  fields.

`additionalProperties: true` kept on both — Zod's default z.object() silently
strips unknown keys rather than rejecting them, so that's the accurate
declaration of real server behavior, not a hardening gap.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013p7knLBm8JFUWqvviWLBzD

* fix(web): every docs/blog markdown table was rendering as raw pipe text

MDXRemote was called with zero mdxOptions — no remark-gfm — so GFM pipe-table
syntax never parsed into an HTML <table>. This affected every table on every
docs page site-wide (Storage tiers, endpoint tables, the gate's performance
contract, etc.), not just new content: a real, live, pre-existing bug.

Installed remark-gfm and wired it into both MDXRemote call sites (docs and
the new blog route). Verified: /docs/architecture's Storage tiers table now
renders as a real <table>, confirmed via DOM query on a live server.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013p7knLBm8JFUWqvviWLBzD

* docs(web): SEO-6 — add the two missing docs pages the readiness checklist named

/docs/what-is-caller-memory — the answer-engine citation-bait definitional
page named in the June GTM roadmap §7 (uses the roadmap's already-drafted
quotable definition verbatim), covering the caller-memory-vs-conversation-
memory distinction that's the core of Mnemix's positioning.

/docs/api-reference — full request/response reference for all three frozen
endpoints, including GET /v1/caller/{phone_number} which previously had zero
example anywhere on the site. Response shapes verified against the actual
route handlers in src/routes/voice.ts (buildCaller, buildDegradedRecallResponse)
rather than reconstructed from memory — the recall_and_enrich sample response
matches the real degraded-response shape field-for-field.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013p7knLBm8JFUWqvviWLBzD

* feat(web): SEO-4 — real /integrations/vapi and /integrations/retell pages

These were hard 404s (not even a placeholder) despite being the highest-
volume "add memory to X agent" implementation queries per the GTM roadmap.

Refactored the Integration data model to carry per-platform content
(webhookLabel, sdkSample, restSample, whatItAdds, howToSteps, faq) instead of
the old hardcoded-for-Bland-only page component, and migrated Bland's
existing content into that shape. Vapi and Retell's integration patterns were
independently researched against their real current docs (docs.vapi.ai,
docs.retellai.com) — not fabricated — with sources recorded and every
uncertain detail flagged in code comments rather than asserted as fact (e.g.
Vapi's assistant-request payload field path, Retell's per-turn timestamp
availability).

Caught and fixed three real bugs surfaced during integration:
- Bland's own existing SDK sample called `mx.recallAndEnrich()` — verified
  against the actual published @mnemix-ai/client@0.2.0 type definitions, that
  method doesn't exist. The real (deprecated but functional) method is
  snake_case `recall_and_enrich()`. This was a live, broken code sample.
- The initial Retell research used an internal `.workers.dev` deployment URL
  instead of the public `mcp.mnemix.ai` host used everywhere else on the
  site, and both platforms' generated samples used invalid `outcome` enum
  values ("success"/"unresolved") that don't exist in CallOutcomeEnum.
- Retell's sample also generated two separate exported handlers for what
  Retell actually delivers to one webhook URL — consolidated into a single
  handler branching on payload.event, matching the one-URL pattern the rest
  of the site's samples use.

Also normalized both new samples from platform-specific handler signatures
(VercelRequest/VercelResponse, Node req/res) to the standard fetch API
Request/Response the rest of the site's code samples use.

/integrations hub: Vapi and Retell move from the "Coming Wave 2" placeholder
list to real clickable cards (the INTEGRATIONS.map() loop already handled
this automatically); copy and metadata updated to match.

NOTE — not resolved by this commit: the real @mnemix-ai/client SDK's
non-deprecated primary methods are observe()/context(), which map to
endpoints (/v1/observe, /v1/context) every other lock on this site treats as
non-public/beta. The SDK has already deprecated the frozen-3 methods in favor
of that surface. This is a genuine product-positioning question — is the
frozen-3 REST surface still canonical, or has the SDK already moved past it —
that needs a founder decision, not a unilateral code change. Flagged
separately, not addressed here. Also found: the published SDK's Enrichment
type still has a `baylio` field, contradicting the Baylio-struck lock; that
package lives outside this repo and needs its own follow-up.

Verified: `npm run build` + `npm run lint` green; all three
/integrations/{bland,vapi,retell} pages return 200 and prerender via SSG;
visual check confirms the hub renders Vapi/Retell as live cards.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013p7knLBm8JFUWqvviWLBzD

* fix: address CodeRabbit BLOCK items on PR #411

- OpenAPI: ts_ms in TranscriptTurn is integer (whole milliseconds)
- LiveApiDemo: nest cache_hit under timing_ms, matching the real
  /v1/recall_and_enrich response shape and the docs example
- SiteFooter: GitHub link aligned to the canonical identity.sameAs
  URL in knowledge.ts (github.com/asayeed95/mnemix)
- api-reference.md + homepage sample: outcome "confirmed" is not in
  the enum; use "appointment_booked"
- data.ts: Bland samples use MNEMIX_API_KEY like Vapi/Retell
- data.ts: Vapi prose uses recall_and_enrich to match sdkSample
- data.ts: Retell quickstartTime 15 minutes, consistent with its FAQ

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

* fix: address CodeRabbit BLOCK items on PR #411

Replace all-zero timing_ms example values with explicit <measured>
placeholders in LiveApiDemo and the API reference so the public
examples can't be read as invented latency claims.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

* fix(web): correct the CodeRabbit-bridge fix's GitHub URL direction

The auto-fix bridge resolved the SiteFooter/knowledge.ts GitHub link
mismatch by making SiteFooter match knowledge.ts's `sameAs` entry — but
verified live: `github.com/asayeed95/mnemix` 404s publicly (it's the private
repo we're working in via authenticated `gh`, not a real public presence).
`github.com/mnemix-ai` returns 200 and matches the org the published
@mnemix-ai/client npm package points back to.

Fixed both to the verified-working URL instead: this is what SiteFooter
already had before the bridge's revert, plus the actual bug — knowledge.ts's
Organization JSON-LD `sameAs` array (used for AEO entity disambiguation) had
never been correct.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013p7knLBm8JFUWqvviWLBzD

* fix: address PR #411 review findings (CallsEndRequestSchema drift + doc overclaims)

Fixes the Vapi tutorial's calls/end snippet, which violated CallsEndRequestSchema
(missing duration_s, raw endedReason instead of the outcome enum, raw transcript
string instead of {role,text,ts_ms}[]) and would 422 for every reader. Also adds
the missing timing_ms sample on the homepage hero, wires blog posts into the
sitemap, and narrows several docs claims (Postgres/RLS, enrichment wait,
region count, bi-temporal scope, MCP tool beta status) to match actual code
behavior.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YbTsArt7mhutySQcUUVfgk

* fix(web): BD-3 — dashboard/settings was 100% mocked, delete button did nothing

Last open item on the launch-readiness gate. `dashboard/settings/page.tsx`
had hardcoded `Acme Corp`/`alex@acmecorp.com`/`Pro` plan, "Save" buttons that
faked success via setTimeout with no write, and — the worst of it — the final
"Permanently Delete Account" button had no onClick handler at all. A design
partner going through that irreversible-sounding 2-step confirm flow and
clicking the final button would see nothing happen.

New `dashboard/settings/actions.ts`, real 'use server' actions matching the
existing dashboard/keys/actions.ts pattern:
- getSettings() — real tenant name/plan + auth.getUser() email, via the
  auth.uid()-scoped tenants_owner_select RLS policy (migration 031).
- updateTenantName() / updateRetention() — real writes, gated by the same
  migration's tenants_owner_update policy (GRANT UPDATE on name, settings —
  verified against the actual RLS migration before writing this, not assumed).

Deliberately did NOT wire "Delete Account" to a fake or wrong deletion call.
Checked what real backend capability exists: POST /v1/governance/delete
deletes a single caller ENTITY (GDPR data-subject request, needs an
entity_id) — not a tenant. There's no real tenant self-deletion endpoint.
Rather than fake it or call the wrong endpoint, routed the final confirm step
to a pre-filled mailto: to hello@mnemix.ai — this exactly matches what the
site's own Privacy Policy already promises ("Email hello@mnemix.ai... we'll
confirm completion"), so the UI now tells the truth about how deletion
actually works today.

Verified: typecheck/build/lint clean. /dashboard/settings correctly redirects
an unauthenticated visitor to /login (auth boundary intact, page doesn't
crash). Did NOT verify the authenticated read/write path — no real dashboard
credentials available in this session; that needs a manual pass with a real
account before this is fully proven end-to-end.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013p7knLBm8JFUWqvviWLBzD

* fix: address CodeRabbit BLOCK items on PR #411

- add-memory-to-vapi-agent.md: preserve richer /v1/calls/end outcomes by
  reading Vapi analysis.structuredData, falling back to endedReason
- add-memory-to-vapi-agent.md: use locked pricing copy (Hobby $0)
- designing-for-sub-300ms.md: soften cache-hit claim — memory read served
  from Redis; tenant-scoped RLS pin in Postgres still happens

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

* fix(web): address CodeRabbit findings on BD-3 settings (loop guard tripped, human review)

The auto-fix bridge hit its 3-attempt loop guard and explicitly asked for a
human on this round — fixing directly:

- Never interpolate raw Postgres/PostgREST error text into a client-facing
  response (leaked column/constraint detail); log server-side via
  console.error, return a generic SAVE_FAILED message instead.
- updateTenantName/updateRetention now check the update's returned row count
  — a mismatched or already-deleted tenant was silently reporting
  `{success: true}` despite affecting zero rows.
- updateRetention validates the input against the actual allowed set
  (indefinite/90/365/730) before writing, instead of accepting any string
  into the stored jsonb.
- The settings-load effect now awaits getSettings() inside try/catch/finally
  instead of a bare .then() — a thrown/rejected call (network error) was
  leaving the page stuck on "Loading settings…" forever with setLoading(false)
  never firing.

Left as documented, not "fixed": the retention update is a read-modify-write
on the settings jsonb, not an atomic merge — supabase-js has no client-side
merge expression without a dedicated Postgres RPC (a new migration), which is
out of scope here. Low real risk: settings is edited by exactly one
RLS-scoped owner through this one low-frequency field.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013p7knLBm8JFUWqvviWLBzD

---------

Co-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Co-authored-by: claude[bot] <41898282+claude[bot]@users.noreply.github.com>

**Used by:** _(none yet — pending draft)_
