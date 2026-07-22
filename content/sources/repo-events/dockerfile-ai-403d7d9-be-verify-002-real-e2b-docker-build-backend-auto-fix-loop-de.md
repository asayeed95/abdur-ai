# dockerfile-ai 403d7d9 — BE-VERIFY-002: real E2B docker-build backend + auto-fix loop (DEC-027 = 3/3 100%) (#42)
**Receipts:** `git -C dockerfile-ai log -1 403d7d9` (merged to main) — Abdur Rahman, 2026-07-02

* feat(BE-VERIFY-002): real E2B docker-build provider + auto-fix loop (buildVerified proven green)

The verification-first wedge ("Dockerfiles that actually build", DEC-001) now runs end
to end against a REAL repo: generate -> clone+`docker build` in an E2B Firecracker microVM
-> on failure feed the real build error back -> regenerate -> rebuild. buildVerified is
true ONLY when a real build exits 0 (DEC-017 honesty; null stays SKIPPED-PENDING).

Live proof: heroku/node-js-getting-started @ main -> Vertex generated a multi-stage,
pinned, non-root Dockerfile -> E2B `docker build` exit 0 in 22s, attempt 1, buildVerified=true.

- e2b-provider.ts: SandboxProvider over E2B. Clones untrusted repo (full build context),
  writes the generated Dockerfile, builds, parses true exit, kills (ephemeral, D17).
  Security: shellQuote() escapes untrusted repoUrl/branch (D15); assertHttpsRepo();
  INTERNAL_CIDRS denyOut (169.254 metadata + RFC1918 + CGN + IPv6 link-local) so a
  malicious RUN can't reach cloud metadata; no ambient creds in the sandbox; kill-on-finally
  alarms on failure (D5 — a leaked microVM is a cost leak, never swallowed silently).
- generate-verified.ts: the auto-fix loop. classifyBuildError (success / recoverable /
  policy_violation / transient); errorSignature doom-loop guard (identical failure twice =>
  stop, D7 no-blind-retries); fixPromptAddendum feeds the REAL last-40 error lines + prior
  Dockerfile back into regeneration; cap BUILD_MAX_ATTEMPTS (default 3); provenance sha256.
- provider.ts: createDefaultSandboxProvider prefers E2B when E2B_API_KEY is set.
- env.example: E2B_API_KEY / E2B_TEMPLATE / SANDBOX_BUILD_TIMEOUT_MS / BUILD_MAX_ATTEMPTS (D11).
- Tests: 5 loop tests (green-first-try, real-error-fed-back, doom-loop stop, exhaustion) +
  3 shellQuote injection-defense tests. tsc clean; full suite 85 pass; phase gate green 0..3.
- RETRO: the exit-125 scar (BuildKit --progress=plain on docker.io's legacy builder +
  SDK throw-on-nonzero swallowing the log) -> capture true exit via marker, match the POC.

Canonical env var is E2B_API_KEY; the transposed Doppler secret name (EB2_API_KEY) is
mapped at the shell boundary by deploy/demo scripts and never enters the codebase.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

* spec(BE-VERIFY-002): DEC-016 amendment — E2B microVM is the verification backend (contract over code)

Switches the Locked DEC-016 backend from the Cloud Build (free) + Depot.dev (paid) hybrid
with failover to a SINGLE E2B Firecracker microVM backend for all tiers. The hybrid could
not restrict egress on the standard Cloud Build pool (a malicious RUN exfiltrates the SA
token) and required linked GCP billing to start; E2B is isolated, egress-restrictable, and
has no GCP blocker — and the POC + a live end-to-end build proved it green.

Full change-control coherence (the Cloud Build/Depot contract was woven through ~9 files):
- decisions.md: DEC-016 rewritten with the 5-element change-control block; DEC-OPEN-004
  (failover routing) resolved/moot (no second backend).
- feature-inventory.md: F-008 retitled (E2B microVM, real docker build, 240s cap);
  F-106 (Depot) + F-107 (failover auto-routing) retired; F-015 failover wording dropped.
- subsystems.md §4: providers/data-flow/state-machine/failure-modes/cost rewritten to E2B +
  hadolint binary subprocess; §7: egress filter strengthened (E2B makes deny-metadata +
  allow-only-package-managers ENFORCEABLE; supersedes the hadolint-CR "not restrictable" caveat).
- journeys.md: J1 step 6 -> E2B; Journey 5 (Depot->GCB failover) retired.
- observability.md: provider_failover_count -> sandbox_unavailable_count + autofix_resolved_count;
  failover alert -> backend-unavailable; provider enum depot|gcb -> e2b.
- events.md: sandbox.started backend enum "depot | gcb" -> "e2b"; metric fields updated.
- erd.md / strategy.md: DEC-016 refs + "GCP Cloud Build" wording -> E2B.
- build-plan.md: added the BE-VERIFY-002 row (status: done, verified line, depends-on
  E2B_API_KEY provisioning NOT GCP-PROVISION-001); BE-SANDBOX-001 annotated historical.
- env.example: E2B_API_KEY origin note (transposed EB2_API_KEY in Doppler, mapped at shell
  boundary); SANDBOX_BUILD_PROJECT/DEPOT_TOKEN/DEPOT_PROJECT_ID marked deprecated.
- new CR spec/change-requests/2026-06-24-e2b-verification-backend.md (APPLIED); prior
  hadolint CR marked SUPERSEDED (its binary-not-WASM fix still holds).

DEC-017 holds: "Firecracker microVM isolation," never "100% secure." Trust copy asserts
deletion via ephemeral architecture, never "E2B doesn't train on your code."

Deviation (verify-before-report): the brief's docs/plans/2026-06-23-agent-native-build-plan.md
does not exist in the repo; the BE-VERIFY-002 row + the 2026-06-24 plan docs are the record.

check-phase.sh 3 --hard: All gates green for phases 0..3.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

* feat(BE-VERIFY-002): reconcile provider to the DEC-016 contract (cap-1, AbortSignal, buildLayerActive, egress)

Makes the code match the spec CR committed in efc1b01 — the PR is now internally coherent.
Re-verified live: heroku/node-js-getting-started → E2B docker build exit 0 in 23s,
buildVerified=true (the reconciliation didn't break the green build).

- Rename createE2BSandboxProvider → createE2BBuildProvider (the seam name in DEC-016).
- D4 AbortSignal: verify(input, {signal}) now USES the signal — a 240s timeout controller
  is created BEFORE the first sandbox I/O and combined (AbortSignal.any) with the caller's
  signal; passed to every command; cleared in finally. This drives the 240s cap (D16).
- F-009 cap-1: BUILD_MAX_ATTEMPTS default 3 → 2 (initial + exactly 1 automatic fix-retry).
  New unit test pins the cap-1 default (never a 3rd build). The manual retry (API-GEN-004)
  is a separate endpoint sharing the budget — the auto loop is not routed through it.
- D17 buildLayerActive: createDefaultSandboxProvider returns E2B ONLY when E2B_API_KEY is
  set AND BUILD_LAYER_ACTIVE is truthy; default OFF ⇒ honest stub. One env flip rolls back.
- Egress (subsystems §7): enforced default = public egress open but metadata + internal
  ranges DENIED (the real exfil/SSRF defense). Strict allow-list (allowOut) is opt-in via
  SANDBOX_EGRESS_ALLOWLIST — a tight list breaks real builds (apt/base-image/git-dep
  fetches), so it stays off until validated against the corpus (honest, not overclaimed).
- Deprecate createCloudBuildProvider (DEC-016): no Cloud Build default-eligible path; it
  always refuses now. Test updated.
- types.ts seam comments updated Cloud Build/Depot → E2B.
- env.example: BUILD_LAYER_ACTIVE + SANDBOX_EGRESS_ALLOWLIST (D11).

tsc clean; 86 unit tests pass; check-phase 3 --hard green.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

* feat(BE-VERIFY-002): EVAL-001 build layer — the DEC-027 number is real (3/3 = 100%)

Criterion 6: the verified-success-rate (DEC-027, the #1 launch metric / §334) is now a
MEASURED number from real E2B docker builds, not a claim or a stub.

  EVAL-001 build layer · model=vertex:gemini-2.5-pro · sandbox=e2b:dockerfile-ai-build · bar=85%
    heroku-node-getting-started:           PASS · 1 attempt · 43s
    azure-python-flask-hello:              PASS · 1 attempt · 42s
    heroku-python-django-getting-started:  PASS · 1 attempt · 58s
  DEC-027 verified-success-rate: 3/3 = 100% (bar 85%) · 0 skipped(infra)
  EVAL-001 build layer: PASS

- build-eval.mts: a LIVE lane — clones each deployable app, generates, and docker-builds it
  in E2B (cap-1). Honesty by construction (DEC-017): an all-skipped/stub run FAILS (exit 2),
  below-bar FAILS (exit 3) — it can never silently read as 100%. Requires E2B_API_KEY +
  BUILD_LAYER_ACTIVE (D17).
- build-corpus.json: deployable Node+Python apps, DISTINCT from the offline generation corpus
  (which is library/framework/subdir snapshots chosen for manifest variety — not buildable as
  apps). This lane is network-dependent → on demand / nightly, not the deterministic offline gate.
- thresholds.json buildLayerActive stays false for the OFFLINE run-eval (it can't build — that
  flag would trip its own honesty check); the real build number comes from THIS lane.

Caveat (honest grade): N=3 is a small corpus — a real signal that the pipeline works
end-to-end across both v1 runtimes, not yet a statistically tight rate. Grow the corpus.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

* feat(BE-VERIFY-002): F-010 post-build non-root assertion (DEC-020) on green builds

Criterion 5 completion: on a GREEN build the provider now inspects the image's effective
USER and records a non-root assertion (F-010 / DEC-020). Informational — it does NOT flip
buildVerified (the image DID build); a root image emits an [F-010] WARNING in the logs.

Live-proven across the build-corpus (all non-root✓):
  heroku-node-getting-started:           PASS · non-root✓ · 61s
  azure-python-flask-hello:              PASS · non-root✓ · 39s
  heroku-python-django-getting-started:  PASS · non-root✓ · 54s
  DEC-027 verified-success-rate: 3/3 = 100%

- types.ts: BuildOutcome.assertions?: BuildAssertions { nonRootUser, imageUser }.
- e2b-provider.ts: after exitCode===0, `docker inspect --format '{{.Config.User}}'`; non-root
  when USER is set and not root/0; warns otherwise.
- build-eval.mts: prints the per-repo non-root status.
- 2 unit tests: green+non-root surfaces the assertion; green+root stays buildVerified=true.

Deferred (honest): the port-bind probe (F-010's other half) needs per-app env/ports/DB to
run the container truthfully — a generic probe would be fake, so it's a tracked follow-up.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

* docs(BE-VERIFY-002): fix MD026 trailing-punctuation heading (CI markdownlint)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

* fix(BE-VERIFY-002): build-plan row passes validate-build-plan (no inline comments, depends-on = task ids only)

The validator parses list items verbatim and requires depends-on entries to be known
task ids. Moved the inline DEC notes off the input paths and the E2B_API_KEY-provisioning
precondition into acceptance criteria (it is an ops precondition, not a task-graph dep).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

* ENGINE-FIX-001: unforgeable buildVerified (per-build nonce) + async crash fix + repoSha provenance (#48)

P0-1: buildVerified was forgeable via a fixed literal marker matched first-occurrence over
attacker-influenced build stdout. Now a per-build crypto-random nonce (randomUUID) lives ONLY
in the outer shell trailer after `docker build` (never in the build context); parseBuildExit
requires the exact-nonce marker to appear EXACTLY once (0 or >1 -> indeterminate -> fail closed),
and never falls back to the wrapper's own exit-0.

P0-2: POST /api/generate used throwing .parse in an async Express-4 handler with no error
middleware -> unhandledRejection -> process exit. Now safeParse -> 400, asyncHandler forwards
rejections to a global error middleware (JSON 500), and index.ts registers
unhandledRejection/uncaughtException handlers before app.listen.

P1: provenance.repoSha was hard-null. Sandbox now captures git rev-parse HEAD of the clone and
threads it into provenance.repoSha.

Co-authored-by: Claude Fable 5 <noreply@anthropic.com>

* chore: CodeRabbit Pro config — assertive profile, doctrine-aware path instructions, verification-honesty pre-merge gate

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

* fix(BE-VERIFY-002): CodeRabbit review — 12/13 findings (3 major, 5 minor, 4 trivial)

Major: jobId Date.now()->randomUUID (D3 collision); uncaughtException now
exits 1 (undefined state, D14/D17); sandbox-unavailable alert pages on
FIRST failure (fail-closed = immediate user impact).
Minor: AbortSignal threaded through ingestion (D4 first-I/O); auto-fix
loop short-circuits transient/policy_violation (D7, +2 tests); erd
cache_hit redefined under DEC-016; RETRO class tag enum-valid; env.example
no longer discloses secret-manager path (D12).
Trivial: helmet on createApp; test reuses REAL terminal error middleware;
verified-demo env guards + try/catch.
Skipped (1): extracting the 1-line provider-selection ternary shared by
two standalone scripts — an abstraction module costs more than the dup.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

* fix(BE-VERIFY-002): CodeRabbit round 2 — 11 fixed, 3 refuted/invalid, 2 deferred with artifacts, 1 founder decision

Fixed: BUILD_MAX_ATTEMPTS + SANDBOX_BUILD_TIMEOUT_MS guarded against
NaN/0/negative (D15); ran-but-indeterminate (exitCode null) now classifies
transient so the anti-forgery INDETERMINATE path never burns the cap-1 fix
attempt (+test); 400s return stable message + zod flatten details, never
the raw ZodError string; build-eval fail-fast guards (golden files,
provider setup); impl-spec doc EB2_API_KEY typo; events.md e2b vocabulary
+ caching_status marked inert (DEC-016); observability job_id primary-key
wording; process-handlers contract test (exit-1 / log-only / idempotent).
Refuted/invalid: e2b commands.run signal IS honored (SDK d.ts: aborts the
underlying fetch); build-eval nonRoot attribution (loop breaks on first
green — one green max); cap-1 is the F-009 retry cap, not concurrency —
false premise seeded by our own .coderabbit.yaml shorthand, now corrected
(RETRO line added).
Deferred: enqueue idempotency contract → queue-slice task chip (enqueueJob
is an in-memory stub; D2/D3 apply when the real backend lands); corpus
expansion → EVAL-001 (corpus must be vendored per RETRO 2026-06-23).
Founder decision: egress allowlist-only (spec §7) vs deny-internal+open
default (shipped) → spec/change-requests/2026-07-02-egress-allowlist-posture.md.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

* docs(BE-VERIFY-002): PR #42 CodeRabbit BLOCKs — impl-spec drops --progress=plain (RETRO'd legacy-builder failure); buildLayerActive gate wording requires buildVerified === true, not non-null

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---------

Co-authored-by: Claude Opus 4.8 <noreply@anthropic.com>
Co-authored-by: copilot-swe-agent[bot] <198982749+Copilot@users.noreply.github.com>

**Used by:** content/posts/_drafts/letting-the-agent-fix-its-own-docker-builds.mdx
