# PROCESS.md — abdur.ai build discipline (light)

**This is the source of truth for how work gets done in this repo.** Every agent (Claude, Codex, or otherwise) reads this before touching code.

This is a **retrofit onto an existing, ~85%-complete codebase** — not a from-zero build. abdur.ai is a public content site (Next.js 15 + Tailwind + MDX): no auth, no payments live, no user-owned data beyond an email-capture form and two low-stakes agent webhooks. It does not need — and does not run — the full 7-phase spec/build-plan swarm discipline that heavier products in this portfolio use (see the canonical package at `~/Documents/mnemex docs/engineering/build-discipline/` if you want the full version for a different project). What follows is the right-sized subset for *this* project.

---

## What's actually locked vs. what's actually open

The design, copy, and IA are **locked** — this was decided before any AI agent touched the repo and is treated as a hard constraint, not a style preference:

- Clay design system: palette, fonts (Playfair Display / Inter / JetBrains Mono), the `///` eyebrow-text convention, `<Reveal>` motion.
- Design tokens live in exactly two files: `tailwind.config.ts` and `app/globals.css`.
- Existing page copy and post content.

**[NEVER-SKIP]** Do not edit `tailwind.config.ts` or `app/globals.css`, and do not rewrite existing copy, without an explicit override entry in `docs/superpowers/specs/overrides.md` naming the file and the reason. `scripts/check-phase.sh` enforces this mechanically (grep gate on staged changes) — it is not just prose in this file anymore. See "Soft-Gate Procedure" below for the override format.

What's open: wiring (API routes, persistence, deploy), new posts/tools added through the existing extension points, and anything under "Architecture decisions you CAN extend" in `CLAUDE.md`.

---

## Current phase

| Phase | Name | State |
|---|---|---|
| 0 | Locked Foundation — design system, IA, 10 homepage sections, MDX post pipeline, flagship post | ✅ done, frozen |
| 1 | **Finish Wiring & Launch** | **← current** |
| 2 | Stripe + Library checkout (optional, deferred per `CLAUDE.md` §8) | not started |
| 3 | Notion CMS sync for posts (future, per `CLAUDE.md` "Architecture decisions you should NOT change") | not started |

Phase 1 is tracked task-by-task in `docs/superpowers/specs/build-plan.md` — that file is the only todo list that counts here; this file just says how to work through it.

Verified-real state of Phase 1 as of this retrofit (2026-07-08) — do not trust the older narrative in `CLAUDE.md`'s "What you need to finish" section without re-checking; some of it already shipped since that doc was written:

- ✅ Resend wired to `/api/subscribe` (commit `7122c7f`)
- ✅ OG cover image for the flagship post exists at `public/blog/the-night-the-doctrine-failed/cover.jpg`
- ✅ `TODO_X_HANDLE` / `TODO_GITHUB_HANDLE` placeholders resolved — `lib/site.ts` has real handles
- ✅ All 4 posts (flagship + 3 backlog) present in `content/posts/`
- ⬜ `/api/ingest/now` and `/api/ingest/ship` are still stubs (`console.log`, no Supabase write) — see build-plan `W-1`
- ❓ Production deploy / DNS / social-card validators — `.vercel/project.json` shows the project is *linked*, not proof it's live at `abdur.ai` right now. Don't repeat "it's deployed" without curling the actual URL. See build-plan `W-2`.

---

## Universal agent rules

1. **Read first**: this file, `CLAUDE.md` (or `AGENTS.md`), and `docs/superpowers/specs/build-plan.md` before any change.
2. **Say what you're doing**: lead a working response with `Phase: 1 — <task-id>` (task-id from build-plan.md). If nothing matches, say so and either propose a task-id or ask.
3. **Gate before and after**: run `./scripts/check-phase.sh` before starting and again before calling anything done. `--hard` mirrors what the pre-commit hook and (if wired) CI will enforce.
4. **Design/content lock is [NEVER-SKIP]** — see above. This is the one gate in this repo that cannot be soft-talked past; it needs a real override entry.
5. **No cosmetic stubs.** Don't wire a UI control to a backend path that doesn't exist. The `/api/ingest/*` routes are explicitly *documented* stubs (they say so in their own docstrings) — that's fine; a *silent* stub pretending to be done is not.
6. **Own branch, explicit staging.** Never commit on whatever branch is checked out; never `git add -A`. Stage the files your task actually touched.
7. **Verify before you report.** Don't write "done," "deployed," or a number into a commit message or summary unless a command you ran *this turn* produced it. "Should be live" is not a status.
8. **Log lessons.** A failure a rule could have prevented gets a one-line entry in `RETRO.md` in the same commit as the fix.
9. **Update docs in the same change.** If you touch `build-plan.md`'s subject matter, flip its status in the same commit.

That's the whole rule set. No Allowed-Paths Map, no Decision Contracts, no Subsystem Rule, no SPRINT mode — this project doesn't have the branching/entitlement/payments surface those exist to guard. If a future phase (Stripe checkout, multi-tenant `asec.co` spinout) introduces one of those, upgrade this file then — don't front-load machinery a content site doesn't need.

---

## Soft-Gate Procedure (design/content lock override)

If a task genuinely requires touching `tailwind.config.ts`, `app/globals.css`, or rewriting locked copy:

```
STOP.
This touches a locked file: <file>.
I will not make this change until docs/superpowers/specs/overrides.md
has an entry naming this file and the reason, OR the user tells me
directly to proceed and I log that authorization myself.
```

Override entry format (append to `docs/superpowers/specs/overrides.md`):

```
- task-id: <id>
  design-token-override: tailwind.config.ts
  reason: <why this specific change is warranted>
  approved-by: <name/date>
```

`scripts/check-phase.sh` greps staged diffs against the two locked files and checks for a matching `design-token-override:` line before it will pass `--hard`.

---

## Gate script

`scripts/check-phase.sh` checks, in order:

1. **[NEVER-SKIP]** No staged/working-tree change to `tailwind.config.ts` or `app/globals.css` without a matching override (see above).
2. **[NEVER-SKIP]** No staged `content/posts/*.mdx` outside `_drafts/` without a matching `content-publish-override:`.
3. `python3 scripts/check-public-claims.py` — public-claims policy, register declarations, receipts on `reported` posts.
4. `npm run typecheck`
5. `npm run lint`
6. `npm run build`

Soft mode (default) reports and exits 0 so an agent can read the failures and act. `--hard` exits 1 on any failure — that's what the pre-commit hook uses.

---

## PR checklist (paste into every PR touching this repo)

```
Task-id: <from build-plan.md>
Files changed: <list>
Checklist:
- [ ] check-phase.sh --hard passes
- [ ] Did NOT touch tailwind.config.ts / app/globals.css without an override entry
- [ ] Did NOT rewrite existing page/post copy without explicit instruction
- [ ] New env vars (if any) added to .env.example
- [ ] build-plan.md status flipped
- [ ] RETRO.md updated if a lesson surfaced
```

---

## What this file deliberately does NOT include

Scoped out on purpose (not oversight) because this is a retrofit onto a near-done, low-risk content site, not a greenfield build:

- The 7-phase spec pipeline (`/spec/personas.md`, `erd.md`, `api-contract.md`, etc.) — there's no data model, auth, or payments surface to spec yet. If Phase 2 (Stripe) or the `asec.co` multi-tenant spinout actually starts, write real specs for *that* work then.
- SPRINT.md, EVOLVE.md, the swarm dispatch/monitor apparatus in the canonical `PLAYBOOK.md` — this is single-track work, not a multi-agent fan-out build.
- The Allowed-Paths Map / per-role lane table — one small codebase, not a multi-team monorepo.
- Engineering Doctrine D1–D13 (idempotency, reserve-before-spend, migrations, etc.) — none of those failure modes exist here yet (no money, no queues, no DB migrations). The one doctrine habit that *does* transfer and is enforced below is D5-adjacent: the `/api/ingest/*` stubs must stay honest about being stubs, not silently pretend to persist.
