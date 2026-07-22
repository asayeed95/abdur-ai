# dockerfile-ai fef1277 — feat(verify): BE-VERIFY-001 — real hadolint static analysis + honest build seam
**Receipts:** `git -C dockerfile-ai log -1 fef1277` (merged to main) — Asec (Abdur), 2026-06-23

Replaces the faked sandbox stubs (parseSandboxResult always returned verified:true)
with honest verification:
- hadolint.ts: REAL static analysis — shells out to the hadolint binary (no WASM,
  CR 2026-06-23), parses JSON, derives a grade; honest 'unavailable' if the binary
  is missing (never a fake pass). Safe on untrusted input (never executes the repo).
- provider.ts: SandboxProvider seam (mirrors LlmProvider). Stub default (build NOT
  run); Cloud Build provider GATED — refuses untrusted builds without an isolated
  project + minimal-perm SA (metadata-token-exfil risk, CR 2026-06-23).
- service.ts: verifyDockerfile() — buildVerified is true ONLY after a real build
  exits 0, null when no build ran (VerificationBadge stays dark, DEC-017).
- Wired into generateFromUrl: every result now carries a real verification report.
- routes: POST /api/generate/preview unchanged; POST /api/sandbox/verify is real.
- Removed fakes: cloudbuild-client.ts, parser.ts, security-audit.ts.

PROVEN LIVE: expressjs/cors -> generated Dockerfile -> hadolint grade A (0 issues),
buildVerified=null (honest). tsc clean; 66 unit tests; real hadolint integration
tests pass. NEXT (BE-VERIFY-002): dedicated isolated GCP project + minimal SA, then
real Cloud Build submit.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

**Used by:** _(none yet — pending draft)_
