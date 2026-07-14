# Agency fleet handoff log

Durable capture of cross-agent handoffs that land in Slack so the next agent to
open this repo actually ingests them instead of losing them in a channel.

**Scope note:** this container is scoped to the `asayeed95/abdur-ai` repo only.
Facts under "abdur.ai — actionable here" are for this repo. Everything under
"Cross-project — reference only" belongs to other repos/products (Mnemix,
Dockerfile.ai, HeyCLI, Linear OS) and must be ingested where those agents run;
it is recorded here as context, not as work to be done from this container.

These entries are **reference/receipts**, not overrides of `CLAUDE.md`. When they
conflict with live repo evidence, the repo wins (truth precedence: newest
explicit instruction and live source beat a dated note).

---

## 2026-07-14 — Agency fleet operating contract + Mnemix positioning locks

Source: Slack #agency-handoffs thread (Abdur / Manus / Sol handoff sync).

### abdur.ai — actionable here
- **Site role:** abdur.ai is Abdur's machine-readable proof hub and founder media
  engine. It is the lead magnet for **Mnemix** and proof-of-craft for applied /
  forward-deployed AI engineer roles. Every page should point back to the
  flagship postmortem or to Mnemix.
- **Mnemix positioning lock (affects any site copy that names Mnemix):** describe
  it as **"grader-isolated contextual intelligence and enrichment infrastructure
  for agents."** Do **not** reduce it to an "AI memory layer." Treat "grader
  isolation" / "grader-isolated contextual intelligence" as canonical positioning.
- **Distribution leverage:** every meaningful ship, failure, or insight should be
  evaluated for source-backed X, LinkedIn, YouTube, Shorts/Reels/TikTok, and blog
  content.
- **Config truth:** handles live only in `lib/site.ts` (x = `@asayeed95`,
  github = `asayeed95`). Do not duplicate handles elsewhere.

### Cross-project — reference only (ingest where those agents run)
- **Mnemix hard locks:** preserve pgvector on day one (Qdrant is the scale
  trigger); no destructive pruning or I6 importance triage; do not ship
  migrations 033–042 before the Prompt 0 Q1–Q14 audit; keep proactive push behind
  the founder gate and the Stripe revenue gate.
- **Dockerfile.ai:** agent-native Dockerfile generation/verification; hardening
  focus on billing, spend, ledger, CI, supply chain.
- **HeyCLI:** persistent phone/voice remote + multi-session CLI orchestrator;
  email waitlist tracked as AGE-285 / PR #11 (email-capture floor before
  TestFlight).
- **Linear hygiene / triage (Sol):** AGE-302 server-side API-key rotation
  (dashboard key activation broken in prod since Jul 7); AGE-263 path to first
  paying Mnemix customer; duplicate clusters AGE-279/280/281 and AGE-289/290;
  pricing lock is "Contact sales" (not the legacy $49/$199 self-serve ladder in
  AGE-15).

### Operating principles (fleet baseline)
1. Verify before reporting — read the repo/Linear/deploy/source first.
2. Execute end-to-end; escalate only identity/2FA, legal, or financial decisions.
3. Revenue-weighted triage; challenge perfectionism and portfolio sprawl.
4. Truth precedence — newest explicit instruction wins; live repo/Linear evidence
   overrides dated memory.
5. Leave receipts — branch/PR, tests, logs, screenshots, deployment.
6. Create distribution leverage from every meaningful ship.
