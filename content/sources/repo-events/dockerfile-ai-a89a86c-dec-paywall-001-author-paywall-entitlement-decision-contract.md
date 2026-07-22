# dockerfile-ai a89a86c — DEC-PAYWALL-001: author Paywall/Entitlement Decision Contract (#47)
**Receipts:** `git -C dockerfile-ai log -1 a89a86c` (merged to main) — Abdur Rahman, 2026-07-02

Add the full 9-field Decision Contract (PROCESS.md Decision Rule) to
spec/decisions.md: inputs, ordered decision rules, no v1 variants,
server-enforced caps+cooldowns (FD-2 Pro rollover default = 20 credits,
pending-founder-ratification), GET /api/me/entitlement response schema,
per-output client rendering, cascading events, failure modes (D1 fail-open
to anonymous-preview, never to paid), and numeric acceptance criteria.
FD-3 load-bearing: anonymous = IP-capped lint-only preview (buildVerified
null), verified builds + credit spend require GitHub sign-in. Cross-links
DEC-OPEN-002 to the FD-2 default. Flip DEC-PAYWALL-001 status to done.

Gates: validate-build-plan.mjs exit 0; check-phase.sh 3 --hard exit 0.

Co-authored-by: Claude Fable 5 <noreply@anthropic.com>

**Used by:** _(none yet — pending draft)_
