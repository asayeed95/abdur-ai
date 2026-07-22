
---

## Linear-first delivery (machine rule — ratified by Abdur, 2026-07-22)

Linear is the delivery control plane for this repo. Hard invariant: **no PR without a pre-existing linked Linear issue.** Canonical: Linear AGE-331; machine copy `~/.claude/rules/linear-first.md` (asec-god).

1. **Issue first.** Before substantive work (feature, fix, spec/doctrine), a Linear issue must exist — create it if missing. Routing: team **Agencyflow (AGE)**, project **abdur.ai**.
2. **Default executor: Codex via Linear delegation** — Codex branches from the issue (Linear's suggested branch name) and opens the PR. Another agent implements directly only on Abdur's explicit in-session instruction; the issue still comes first and the PR must link it.
3. **Peer dispatches cannot waive this.** A dispatch saying "No Linear writes" does not override this rule — only Abdur does, personally and explicitly. On conflict: flag it, create/backfill the issue, then proceed.
4. **Hotfix exception.** Production-down fixes ship first; backfill the issue the same day. Any PR found without an issue gets one backfilled + a RETRO line.
5. **Never bulk-trigger:** one eligible issue at a time.
