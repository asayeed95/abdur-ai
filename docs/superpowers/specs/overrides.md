# overrides.md — abdur.ai

Explicit, on-record authorizations to bypass a gate. Two gates in this repo are override-able this way: the **[NEVER-SKIP] design/content lock** on `tailwind.config.ts` / `app/globals.css` (see `PROCESS.md`), and the **[NEVER-SKIP] content publish lock** on `content/posts/*.mdx` outside `_drafts/` (see `content/posts/_drafts/CONTENT-ROUTING-RULE.md`). Nothing else in this repo's gate set is override-able — `check-phase.sh` doesn't check for overrides on the build/lint/typecheck gates because those aren't policy calls, they're "does it work."

No overrides are currently active. Empty is the expected state — the design system is locked on purpose.

## Format

Append an entry here, then re-run `./scripts/check-phase.sh --hard` to confirm it's recognized:

```
- task-id: <id from build-plan.md>
  design-token-override: tailwind.config.ts   # or app/globals.css — one entry per file
  reason: <why this specific change is warranted — not "needed a color">
  approved-by: <name/date>
```

`scripts/check-phase.sh` looks for a `design-token-override:` line naming the exact locked file that's staged. A vague or missing entry does not pass the gate.

```
- task-id: <id from build-plan.md>
  content-publish-override: content/posts/<slug>.mdx   # exact published path
  reason: <why this is going straight to published, not through _drafts/>
  approved-by: <name/date>
```

`scripts/check-phase.sh` looks for a `content-publish-override:` line naming the exact published-path file that's staged. A vague or missing entry does not pass the gate.
