# AGENTS.md — Rules for Codex / Cursor / generic agent runners

abdur.ai runs a **light** build-discipline gate (see `PROCESS.md`) — this is a near-done public content site (Next.js 15 + Tailwind + MDX), not a from-zero build with auth/payments/data-model surface. Any agent working here (Codex, Cursor, Aider, generic LLM coding agents) follows these rules.

## Mandatory startup steps

1. Read `PROCESS.md` top to bottom.
2. Read `docs/superpowers/specs/build-plan.md` and find the task-id matching the request. If none matches, propose one or ask.
3. Read `CLAUDE.md` for the original project handoff context — but trust `PROCESS.md`'s verified-current-state table over `CLAUDE.md`'s older "What you need to finish" checklist where they disagree; some of that checklist has shipped since it was written.
4. Run `./scripts/check-phase.sh` to see what's currently green.
5. Only then begin work.

## Hard rules (enforced)

- Begin every response with: `Phase: 1 — <task-id>`.
- **[NEVER-SKIP]** Do not edit `tailwind.config.ts` or `app/globals.css`, and do not rewrite existing page/post copy, without an explicit `design-token-override:` entry in `docs/superpowers/specs/overrides.md` (format in `PROCESS.md`). `scripts/check-phase.sh` enforces this mechanically via a grep gate on staged/working-tree diffs — it is not optional prose.
- No cosmetic stubs: don't wire a UI control to a backend path that doesn't exist. Note that `/api/ingest/now` and `/api/ingest/ship` are *intentionally* documented stubs right now (see build-plan `W-1`) — that's fine as long as they stay honestly labeled, not silently pretended-complete.
- Verify before report: never state a result, a "done," or a "deployed" that no command you ran this turn actually produced.
- Own branch, explicit staging: never commit on whatever branch happens to be checked out; never `git add -A`.
- New env vars go in `.env.example` in the same change.
- **[NEVER-SKIP]** All generated content goes to `content/posts/_drafts/` first. Never write directly to `content/posts/` (published paths) or deploy to Cloudflare without explicit Abdur approval. See `content/posts/_drafts/CONTENT-ROUTING-RULE.md`.
- Flip the task's status in `docs/superpowers/specs/build-plan.md` in the same commit as the work.
- Log a lesson to `RETRO.md` in the same commit if a failure surfaced that a rule could have caught.

## Default refusal phrases

- "This touches a locked file (`tailwind.config.ts` / `app/globals.css`). I need a `design-token-override:` entry in `docs/superpowers/specs/overrides.md` first, or explicit instruction from you that I'll log as the authorization."
- "This would rewrite existing page/post copy, which is locked per `CLAUDE.md`. Confirm you want new copy, not a wiring fix."
- "I don't have a task-id in `docs/superpowers/specs/build-plan.md` for this — should I add one, or is there an existing one I'm missing?"
- "This content is going to `content/posts/_drafts/` per the CONTENT-ROUTING-RULE. I will not write directly to `content/posts/` or deploy without explicit approval."

## Output template

```
Phase: 1 — <task-id>
Read: PROCESS.md, build-plan.md, <any spec/content files touched>
Gate check: <output of check-phase.sh>
Plan: <bullets>
Changes: <files>
Verified: <the actual command output backing any "done" claim>
PR checklist (from PROCESS.md): ...
```

## What's deliberately not here

No Allowed-Paths Map, no Decision Contracts, no Subsystem Rule, no SPRINT mode, no Engineering Doctrine D1–D13. Those exist in the canonical package (`~/Documents/mnemex docs/engineering/build-discipline/AGENTS.md`) for projects with auth, payments, queues, or multi-agent fan-out. abdur.ai doesn't have that surface today. If Phase 2 (Stripe/Library checkout) or the `asec.co` multi-tenant spinout actually starts, pull in the relevant subset then — don't front-load it now.
