# CLAUDE.md — abdur.ai handoff

Abdur's TLDR/portfolio site (Next.js 15 + Tailwind + MDX), public content site, no auth/live payments. Lead magnet for Northsun + AI-eng proof-of-craft. Portfolio priority: Northsun/Mnemix → **abdur.ai** → HeyCLI → Dockerfile.ai (CORE §1).

Checkout on this machine: `/Users/mental/Projects/abdur-ai`. Older docs may say `/Users/agencyflow/...` (a macmini path) — verify before reusing an absolute path from history.

## Read first, every session

1. `PROCESS.md` + `docs/superpowers/specs/build-plan.md` are the **live** source of truth for phase/open tasks, and `PROCESS.md` wins if it ever conflicts with this file; some listed tasks are already shipped.
2. Lead responses with `Phase: 1 — <task-id>` (task-id from build-plan.md).
3. Run `./scripts/check-phase.sh` before and after every change (`--hard` = what the pre-commit hook enforces).
4. **[NEVER-SKIP]** Design/content lock is a real gate: don't edit `tailwind.config.ts` / `app/globals.css` or rewrite existing copy without a `design-token-override:` entry in `docs/superpowers/specs/overrides.md` (format in `PROCESS.md`).
5. Verify before you report — no "done" / "deployed" / a number without a command that produced it this turn.
6. Own branch, explicit staging (`git add <files>`, never `-A`); never commit on whatever branch is checked out.
7. End every coding response with the PR checklist from `PROCESS.md`.
8. `AGENTS.md` = same rules phrased for Codex-style runners. `PLAYBOOK.md` = how to run a session.

## Commands

`npm run dev` · `npm run lint` · `npm run build` · `./scripts/check-phase.sh [--hard]`

## Standing law (pointers — load on demand, don't inline)

- Linear-first (no PR without a pre-existing linked issue): `~/.claude/rules/linear-first.md` — team AGE, project abdur.ai.
- Autonomy Doctrine (decide + act, evidence ratifies, escalate only floor items): `~/.claude/rules/autonomy-doctrine.md`.
- Public-claims law (no unratified prices/benchmarks/customers/integrations in site copy): `DEC-PUBLIC-CLAIMS` registry (Mnemix-Docs).
- Secrets: reference by name (Doppler/.env), never paste values. Env: `RESEND_API_KEY`, `RESEND_AUDIENCE_{TLDR,ASEC,MNEMIX}`, `AGENT_TOKEN`.

## Locked, no exceptions without an override entry

Clay design tokens (`tailwind.config.ts`, `app/globals.css`), existing page/post copy, the `/aitldr` route name, font roles (Playfair Display / Inter / JetBrains Mono), single `lib/site.ts` config source, `<Reveal>` as the only scroll-motion wrapper (no competing motion libs), posts stay in MDX under `content/posts/` (no CMS sync — that's Phase 3).

## Context discipline

This file is deliberately short; agents re-read it every turn. Full detail and history: `docs/archive/agent-context/CLAUDE.2026-08-19.md`. Load that (or any sub-directory AGENTS.md/CLAUDE.md, skill, or doc) ONLY when the task needs it — never preload everything. Keep this file under 3000 bytes; put new detail in the archive, not here.
