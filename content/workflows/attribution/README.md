# Attribution spine (Phase 1)

Design: `Mnemix/docs/superpowers/specs/2026-07-30-autonomous-gtm-flg-engine-design.md`
— on Mnemix branch `claude/age-327-autonomous-gtm-flg-engine`, **not merged to Mnemix
`main`** (verified 2026-07-30). By this README's own release criterion #3, an unmerged
branch is not integration; treat the design as a moving reference, not a fixed contract.
Charter: `agent-context/canonical/MARKETING-ENGINE.md`

Run tests with `python3 content/workflows/attribution/tests/test_<name>.py`
(or loop over `content/workflows/attribution/tests/test_*.py`). This is a `unittest`
suite, not pytest — see "Dependency policy" below.

## Dependency policy

Every module in this package (`carriers.py`, `enrich.py`, `funnel.py`, `icp.py`,
`ingest.py`, `report.py`) imports from the standard library only — `dataclasses`,
`datetime`, `hashlib`, `json`, `pathlib` — plus each other. The test layer adds
`sys`, `tempfile` and `unittest`, and nothing else. That is the complete list; it
was re-derived from the source on 2026-07-30 rather than restated from memory.

This mirrors the house pattern established by the sibling `content/workflows/artifact-registry/`
module, which is stdlib-only end to end including its test layer. **Citation status:**
`artifact-registry/` does **not** exist on `origin/main` or on this branch — it is
tracked on sibling feature branches (e.g. `codex/c18-fresh-evidence-review-20260730`,
`codex/artifact-intelligence-integration-20260730`). Its stdlib-only property was
verified there directly on 2026-07-30 (`argparse`, `hashlib`, `ipaddress`, `json`,
`math`, `re`, `sys`, `tempfile`, `unittest`, `datetime`, `pathlib`, `urllib.parse`),
so the precedent is real but is not checkable from this branch alone.

The policy stands on its own merits regardless of that citation: this package is an
offline measurement library whose only job is to produce honest counts, and every
dependency added to it is a way for those counts to change without the change being
visible here. Adding a third-party import anywhere in this package — a YAML parser,
an HTTP client, a schema-validation library, or `pytest` itself — is a deliberate
break and should be treated as a regression to flag, not a convenience to accept
quietly.

## Ingress contract

`POST` body accepted by `ingest.ingest()`. AGE-400's signed Worker is the intended
transport; nothing in this package is wired to a live endpoint yet.

| Field | Type | Required | Notes |
|---|---|---|---|
| `kind` | `"signup" \| "engager" \| "ref_click"` | yes | |
| `observed_at` | ISO-8601 UTC | yes | |
| `email` | string | for `signup` | enriched |
| `handle` | string | for `engager` | enriched |
| `ref` | string | no | strongest machine carrier |
| `utm_campaign` | string | no | |
| `declared_source` | string | no | "how did you hear about us?" — strongest carrier overall |
| `nonce` | string | **for `ref_click`** | caller-supplied uniqueness token — see below |

### `nonce` — required for `ref_click`

`event_id` is derived from `(packet_id, stage, identity, observed_at, nonce)`. A
`ref_click` is anonymous, so its `identity` is always `None`, and its timestamp has
one-second resolution: **two genuinely distinct clicks on the same artifact in the
same second produce the same `event_id` and the second is dropped as a replay.** The
caller must supply a `nonce` — a request id is the natural source — because only the
caller can tell a real second click from a retry of the first. The same applies to any
future identity-less kind added to `ingest.IDENTITY_LESS_KINDS`.

Two consequences worth stating plainly:

- `validate_payload()` does **not** reject a `ref_click` with no `nonce`. It is required
  by this contract, not enforced by the code. A caller that omits it silently
  under-counts same-second clicks, and nothing in this package will say so.
- For `signup` and `engager`, `nonce` is ignored. Those kinds are already distinguished
  by their identity, and re-posting an identical payload must stay a no-op.

## Invariants

- Unattributed signups are stored against `__unattributed__` and reported. Never dropped.
- `ref_click` is anonymous and is never sent to the enricher.
- A dead enricher raises `EnrichmentUnavailable`; nothing is written.
- Re-posting an identical payload is a no-op (`event_id` is deterministic).
- Two candidates matching at **any** carrier tier ⇒ that tier credits nothing and
  resolution falls through to the next. Credit is never split, at any tier.
- A duplicate `event_id` row in the ledger is read once. Idempotency holds on the
  read path, not only on append.
- An unrecognised `stage` or a row missing a required field raises `ValueError` on
  read. An absent check never passes as a zero.
- `icp_qualified_engagers` counts people, never events — like `engagers`.
- Unattributed `ref_click` and ICP-engager counts are reported at the top level,
  never computed and discarded.

## Release criteria

**This library must not be activated until all four of the following hold.**
Phase 1 is deliberately offline by design. Pointing it at live inputs before
these conditions are true would not just be premature — it would stand up a
measurement system that reports numbers with confidence it hasn't earned.

1. **The surface being measured is allowed to make the claim attribution would
   credit it for.** This engine ranks published artifacts by the qualified
   signups they drive, which means every artifact it names a "winner" becomes,
   implicitly, evidence that the claim on that artifact worked. If the public
   surface itself carries a claim the claims authority has ruled out, the
   engine ends up manufacturing support for something we've already decided we
   can't say. Concretely: as of 2026-07-30, the live abdur.ai site is still
   serving a Mnemix identity line that `scripts/check-public-claims.py`
   rejects, even though the fix already exists in the repository and simply
   hasn't been deployed. **Citation status:** `scripts/check-public-claims.py`
   does **not** exist on `origin/main` or on this branch — it is tracked on
   sibling feature branches (e.g. `codex/c31-global-public-truth-20260730`,
   `codex/c15-host-revalidation-20260730`, `codex/public-truth-integration-20260730`),
   verified 2026-07-30. So the checker this criterion depends on is itself
   unmerged: whoever clears this gate must first confirm which branch supplies
   the authoritative checker, rather than assuming `main` can run it.
   Attribution stays off until that deploy goes out under proper authorization
   and a route-by-route check confirms the live site matches what the repo says
   it should.
2. **Every credential this pipeline needs is confirmed live, with quota
   checked, not assumed.** Explorium in particular needs a liveness and quota
   probe before any workflow treats enrichment as working. If the vendor is
   silently dead, it can return nothing for every lookup, and without a probe
   that reads as "nobody qualified" instead of "we never actually asked" —
   a false negative baked into the data.
3. **The upstream decision layer is merged, not just drafted.** This library
   is a consumer — it scores and attributes artifacts that some other layer
   produces. Pointing it at a branch that hasn't merged isn't integration,
   it's a preview that will drift the moment that branch changes. As of
   2026-07-30 this criterion is **not met**: the design spec cited at the top
   of this file is on an unmerged Mnemix branch, and so are both other external
   paths this README references.
4. **A full dry run has completed with no live publish** — seed data through
   draft, through the gate, through packet assembly, through schedule intent,
   start to finish, offline.

None of the four are about whether the code works — the test suite already
answers that. They're gates on turning this library on against real traffic,
and the library is complete and fully testable without any of them being true.

## Not built in Phase 1

Composite weight schedule, x-autonomy repointing, proposed-ratification emission
(Phase 2). CTA-frequency cap and counter-metric veto (AGE-400 decision layer).
