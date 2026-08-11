# dockerfile-ai 7cbbbde — EVAL-CORPUS-001: grow golden corpus toward N>=10 (offline curation; live run deferred to Wave 4) (#49)
**Receipts:** `git -C dockerfile-ai log -1 7cbbbde` (merged to main) — Abdur Rahman, 2026-07-02

Grow the SHA-pinned golden eval corpus from 8 -> 17 vendored, deployable public
repos spanning Node/Python/Go/Rust, following the existing vendor-corpus.mjs
offline-snapshot pattern:

  Node   vercel/next.js (examples/hello-world), fastify/fastify
  Python testdrivenio/django-on-docker (app), encode/django-rest-framework
  Go     gin-gonic/gin, labstack/echo, GoogleCloudPlatform/golang-samples (run/helloworld)
  Rust   actix/examples (basics/basics), tokio-rs/axum (examples/hello-world)

- Original 8 entries repinned to their exact commit SHAs so re-vendoring is
  byte-idempotent (no drift when upstream branches move); their snapshots are unchanged.
- vendor-corpus.mjs: extend MANIFEST_FILES + SOURCE_EXT to cover Go/Rust/Ruby/PHP
  manifests and .go/.rs/.rb sources.
- HONEST: manifest+source snapshots only. buildVerified left unmeasured; the >=85%
  live generate->verify run is Wave 4 (BE-VERIFY-002). thresholds.json untouched —
  buildLayerActive stays false, no launch-gate flag flipped.
- EVAL-CORPUS-001 flipped todo -> in-progress (NOT done) with a progress note.

Gates: server `npm test` green (77 passed / 11 skipped); ./scripts/check-phase.sh 3 --hard exit 0.


Claude-Session: https://claude.ai/code/session_017rTsyXLMeDEnHKrdD9qoxf

Co-authored-by: Claude Opus 4.8 <noreply@anthropic.com>

**Used by:** _(none yet — pending draft)_
