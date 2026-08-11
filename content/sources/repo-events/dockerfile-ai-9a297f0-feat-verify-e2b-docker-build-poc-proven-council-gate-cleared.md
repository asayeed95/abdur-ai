# dockerfile-ai 9a297f0 — feat(verify): E2B docker-build POC PROVEN — council gate cleared (#41)
**Receipts:** `git -C dockerfile-ai log -1 9a297f0` (merged to main) — Abdur Rahman, 2026-06-24

The BE-VERIFY-002 gate (council #1 risk: docs only show 'docker run', never an
explicit 'docker build') is CLEARED. Built our 'dockerfile-ai-build' E2B template
(Ubuntu 24.04 + docker.io 29.1.3) and proved a real 'docker build' inside the
Firecracker microVM: image built, ran, returned 'built-ok' (exit 0).

- e2b-docker-template.mjs: one-time template builder (sudo apt install docker.io).
- e2b-poc.mjs: starts dockerd (E2B has no systemd) -> waits ready -> docker build -> run.

E2B confirmed as the BE-VERIFY-002 backend. NEXT: E2BSandboxProvider (clone repo +
write generated Dockerfile + docker build + parse) behind the seam, with the council
egress lockdown (deny 169.254.169.254 + *.internal), timeout + caps + the auto-fix loop,
then flip thresholds.json buildLayerActive=true to make EVAL-001's launch gate live.

Co-authored-by: Claude Opus 4.8 <noreply@anthropic.com>

**Used by:** _(none yet — pending draft)_
