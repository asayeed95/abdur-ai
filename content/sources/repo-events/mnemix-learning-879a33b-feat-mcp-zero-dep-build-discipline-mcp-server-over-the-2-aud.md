# mnemix-learning 879a33b — feat(mcp): zero-dep build-discipline MCP server over the 2 audit-survived gates
**Receipts:** `git -C mnemix-learning log -1 879a33b` (merged to main) — Asec (Abdur), 2026-06-28

A thin MCP (stdio JSON-RPC) transport that exposes ONLY the gates that survived
every adversarial audit unbroken — irreversible-cmd-guard (P-008 swallowed-command
sweep) + phase-a-invariants (Phase-A→B round-trip / R3 / R5/R6) — so any MCP agent
can lint a build-discipline runbook mid-task. No SDK dependency (version-proof, no
node_modules in this grep-able repo); shells out to the existing committed bash gates,
adds NO new gate logic (new grep code is the surface v5.1 froze on).

Tools: lint_runbook(content|path), list_gates (honest robust-vs-first-order inventory
+ the out-of-scope attack classes from STATUS.md). list_gates states verbatim that
these are DOCTRINE-SPECIFIC runbook linters, not a universal check-any-command net —
the other 9 gates with known bypasses are listed but NOT exposed as authoritative.

Verified end-to-end (mcp/test-client.mjs, 9/9): handshake + protocolVersion echo +
tools/list + list_gates scope honesty + lint_runbook PASS on discipline/v3.0.md +
FAIL on a stub + no-input error + unknown-tool isError.

NOT yet registered in ~/.claude.json — snippet in mcp/README.md, apply after review.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01XzHYSAg9hi1zFDb5bcDhPT

**Used by:** _(none yet — pending draft)_
