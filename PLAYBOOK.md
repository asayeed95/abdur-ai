# PLAYBOOK.md — how to run a session in this repo

`PROCESS.md` is *what* the rules are; this is *how* to actually run a work session against them. It's short on purpose — abdur.ai is single-track work (one agent, one branch, one small codebase), so the multi-agent fan-out/monitor apparatus in the canonical build-discipline `PLAYBOOK.md` doesn't apply here. Read that one instead if you're working on a project with real width (multiple parallel agents, a shared tree, long-running async jobs).

---

## Session start

1. `git status` — know what's actually checked out and clean before you plan anything.
2. Read `PROCESS.md`, then `docs/superpowers/specs/build-plan.md` for the task list, then `CLAUDE.md` for the original project context (what's locked, what's not).
3. Run `./scripts/check-phase.sh` — see what's currently green.
4. Create or switch to your own branch. Never work on `main` directly, never assume the branch someone else left checked out is yours to commit on.

## While working

- Small, scoped diffs. This is a content site with locked design — most real work here is either (a) backend wiring (persistence, API routes) or (b) adding content through the documented extension points (drop an `.mdx` file, add a `Library` product). Neither needs sweeping changes.
- If you're about to touch `tailwind.config.ts` or `app/globals.css`, stop and follow the Soft-Gate Procedure in `PROCESS.md` first — don't discover the gate by having your commit blocked.
- Verify claims about "current state" before repeating them. `CLAUDE.md`'s original handoff checklist is a snapshot from when the repo was 85% done; some of it has since shipped (see the verified-state table in `PROCESS.md`). Re-check the actual file/route/commit before trusting a prior summary, including this one, by the time you read it.

## Before you say something is done

- Run the command that proves it, this turn. "Should build" is not "builds."
- `./scripts/check-phase.sh --hard` is green.
- For a UI change: actually load the page (`npm run dev` + look, or the deployed preview) — a passing build doesn't mean the design didn't drift.
- For a backend route: hit it (`curl`), don't just read the code and assume.

## Committing

- Stage by explicit path (`git add <file> <file>`), never `git add -A` — this avoids sweeping up unrelated in-progress edits.
- One commit per task-id where practical. Lead the commit message with what changed, not with "fix" or "update."
- Flip the task's status in `docs/superpowers/specs/build-plan.md` in the same commit as the work.
- If something failed in a way a rule could have caught, add a one-line `RETRO.md` entry in the same commit.

## Reviews

- If CI or a bot review exists on the PR, read it before adding your own pass on top — it's usually right and it's free.
- Don't rewrite/rebase already-landed history just to make a commit message read better. Cite the hash instead.

## The one habit worth carrying over from the heavier package

**Verify before report.** Never write a result, a status, or "done" into a message before the command that proves it has actually run and returned, in this turn. That single habit is most of what separates "looks done" from "done," at any size of project.
