# Attribution spine (Phase 1)

Design: `Mnemix/docs/superpowers/specs/2026-07-30-autonomous-gtm-flg-engine-design.md`
Charter: `agent-context/canonical/MARKETING-ENGINE.md`

Run tests with `python3 content/workflows/attribution/tests/test_<name>.py`
(or loop over `content/workflows/attribution/tests/test_*.py`). This is a `unittest`
suite, not pytest — see "Dependency policy" below.

## Dependency policy

Every module in this package (`carriers.py`, `enrich.py`, `funnel.py`, `icp.py`,
`ingest.py`, `report.py`) imports from the standard library only —
`dataclasses`, `hashlib`, `json`, `pathlib`, `datetime`, `unittest` — and nothing
else. This mirrors the house pattern already established by the sibling
`artifact-registry/` module, which is also stdlib-only end to end, including its
test layer. Adding a third-party import anywhere in this package — a YAML
parser, an HTTP client, a schema-validation library, or `pytest` itself — is a
deliberate break from that pattern and should be treated as a regression to
flag, not a convenience to accept quietly.

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

## Invariants

- Unattributed signups are stored against `__unattributed__` and reported. Never dropped.
- `ref_click` is anonymous and is never sent to the enricher.
- A dead enricher raises `EnrichmentUnavailable`; nothing is written.
- Re-posting an identical payload is a no-op (`event_id` is deterministic).
- Two candidates on a weak carrier ⇒ unattributed. Credit is never split.

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
   hasn't been deployed. Attribution stays off until that deploy goes out
   under proper authorization and a route-by-route check confirms the live
   site matches what the repo says it should.
2. **Every credential this pipeline needs is confirmed live, with quota
   checked, not assumed.** Explorium in particular needs a liveness and quota
   probe before any workflow treats enrichment as working. If the vendor is
   silently dead, it can return nothing for every lookup, and without a probe
   that reads as "nobody qualified" instead of "we never actually asked" —
   a false negative baked into the data.
3. **The upstream decision layer is merged, not just drafted.** This library
   is a consumer — it scores and attributes artifacts that some other layer
   produces. Pointing it at a branch that hasn't merged isn't integration,
   it's a preview that will drift the moment that branch changes.
4. **A full dry run has completed with no live publish** — seed data through
   draft, through the gate, through packet assembly, through schedule intent,
   start to finish, offline.

None of the four are about whether the code works — the test suite already
answers that. They're gates on turning this library on against real traffic,
and the library is complete and fully testable without any of them being true.

## Not built in Phase 1

Composite weight schedule, x-autonomy repointing, proposed-ratification emission
(Phase 2). CTA-frequency cap and counter-metric veto (AGE-400 decision layer).
