# Archived from /Users/mental/Projects/abdur-ai/AGENTS.md on 2026-08-19 — read on demand only

The lean `AGENTS.md` keeps: repo identity/scope, portfolio priority pointer, the 5-step mandatory startup order, and the full hard-rules list (enforced, including both `[NEVER-SKIP]` items) in condensed form. Everything below is the verbatim source material that was condensed or cut — the original intro paragraph, the default refusal phrases (exact wording), the full output template, and the "what's deliberately not here" rationale section, including one stale path this pass found.

## Original intro paragraph (verbatim)

abdur.ai runs a **light** build-discipline gate (see `PROCESS.md`) — this is a near-done public content site (Next.js 15 + Tailwind + MDX), not a from-zero build with auth/payments/data-model surface. Any agent working here (Codex, Cursor, Aider, generic LLM coding agents) follows these rules.

## Original mandatory startup steps (verbatim)

1. Read `PROCESS.md` top to bottom.
2. Read `docs/superpowers/specs/build-plan.md` and find the task-id matching the request. If none matches, propose one or ask.
3. Read `CLAUDE.md` for the original project handoff context — but trust `PROCESS.md`'s verified-current-state table over `CLAUDE.md`'s older "What you need to finish" checklist where they disagree; some of that checklist has shipped since it was written.
4. Run `./scripts/check-phase.sh` to see what's currently green.
5. Only then begin work.

## Default refusal phrases (verbatim)

- "This touches a locked file (`tailwind.config.ts` / `app/globals.css`). I need a `design-token-override:` entry in `docs/superpowers/specs/overrides.md` first, or explicit instruction from you that I'll log as the authorization."
- "This would rewrite existing page/post copy, which is locked per `CLAUDE.md`. Confirm you want new copy, not a wiring fix."
- "I don't have a task-id in `docs/superpowers/specs/build-plan.md` for this — should I add one, or is there an existing one I'm missing?"
- "This content is going to `content/posts/_drafts/` per the CONTENT-ROUTING-RULE. I will not write directly to `content/posts/` or deploy without explicit approval."

## Output template (verbatim)

```
Phase: 1 — <task-id>
Read: PROCESS.md, build-plan.md, <any spec/content files touched>
Gate check: <output of check-phase.sh>
Plan: <bullets>
Changes: <files>
Verified: <the actual command output backing any "done" claim>
PR checklist (from PROCESS.md): ...
```

## What's deliberately not here (verbatim, with a stale-path flag)

No Allowed-Paths Map, no Decision Contracts, no Subsystem Rule, no SPRINT mode, no Engineering Doctrine D1–D13. Those exist in the canonical package (`~/Documents/mnemex docs/engineering/build-discipline/AGENTS.md`) for projects with auth, payments, queues, or multi-agent fan-out. abdur.ai doesn't have that surface today. If Phase 2 (Stripe/Library checkout) or the `asec.co` multi-tenant spinout actually starts, pull in the relevant subset then — don't front-load it now.

**STALE PATH FLAG (found 2026-08-19):** `~/Documents/mnemex docs/engineering/build-discipline/AGENTS.md` does not exist on this machine. The actual file is at `/Users/mental/Documents/Mnemix-Docs/engineering/build-discipline/AGENTS.md` (note: `Mnemix-Docs`, not `mnemex docs`; also `~/Documents/abdur-os/build-discipline/AGENTS.md` exists as a possible alternate canonical copy — verify which is authoritative before pulling from either). Fix the pointer in the source doc next time it's touched.

## Referenced-file existence check (2026-08-19, not inlined — verified present only)

All confirmed present in `/Users/mental/Projects/abdur-ai/` at diet time:
- `PROCESS.md`
- `docs/superpowers/specs/build-plan.md`
- `CLAUDE.md`
- `scripts/check-phase.sh`
- `docs/superpowers/specs/overrides.md`
- `content/posts/_drafts/CONTENT-ROUTING-RULE.md`
- `RETRO.md`
