# AGENTS.md — Rules for Codex / Cursor / generic agent runners

abdur.ai: near-done public content site (Next.js 15 + Tailwind + MDX). Light build-discipline gate (`PROCESS.md`) — not the full Engineering Doctrine (see archive). Portfolio priority (CORE §1): Northsun/Mnemix → **abdur.ai** → HeyCLI → Dockerfile.ai; abdur.ai is Abdur's default catch-all/TLDR layer.

## Startup (in order)

1. Read `PROCESS.md` fully.
2. Read `docs/superpowers/specs/build-plan.md`, match or propose a task-id.
3. Read `CLAUDE.md` for handoff context — but on conflict, `PROCESS.md`'s verified-current-state table wins over `CLAUDE.md`'s older checklist.
4. Run `./scripts/check-phase.sh`.
5. Only then start work.

## Hard rules (enforced)

- Start every response: `Phase: 1 — <task-id>`.
- **[NEVER-SKIP]** No edits to `tailwind.config.ts` / `app/globals.css`, no rewriting existing page/post copy, without a `design-token-override:` entry in `docs/superpowers/specs/overrides.md` (format in `PROCESS.md`) — mechanically enforced by `check-phase.sh`'s grep gate on diffs.
- No cosmetic stubs (UI wired to a nonexistent backend path). `/api/ingest/now` + `/api/ingest/ship` are intentional documented stubs (build-plan `W-1`) — fine as long as honestly labeled.
- Verify before report: never state "done"/"deployed" without this turn's command output backing it.
- Own branch, explicit staging — never commit on whatever's checked out; never `git add -A`.
- New env vars → `.env.example` in the same change.
- **[NEVER-SKIP]** Generated content → `content/posts/_drafts/` only. Never write to `content/posts/` (published) or deploy to Cloudflare without explicit Abdur approval. Rule: `content/posts/_drafts/CONTENT-ROUTING-RULE.md`.
- Flip the task's status in `docs/superpowers/specs/build-plan.md` in the same commit as the work.
- A rule-catchable failure → log a lesson to `RETRO.md` in the same commit.

## Refusal phrases + output template

Exact refusal scripts and the full per-response output template (Phase/Read/Gate check/Plan/Changes/Verified/PR checklist) live in the archive — pull them when you need the literal wording. Minimum shape every response follows: open with `Phase: 1 — <task-id>`, close any completion claim with `Verified: <actual command output>`.

## Context discipline

This file is deliberately short; agents re-read it every turn. Full detail and history: `docs/archive/agent-context/AGENTS.2026-08-19.md`. Load that (or any sub-directory AGENTS.md/CLAUDE.md, skill, or doc) ONLY when the task needs it — never preload everything. Keep this file under 3000 bytes; put new detail in the archive, not here.
