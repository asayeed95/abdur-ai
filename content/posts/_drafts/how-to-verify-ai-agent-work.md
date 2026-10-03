---
slug: how-to-verify-ai-agent-work
title: "How do you verify an AI agent's work before you trust it?"
seo_title: "How to verify an AI agent's work"
subtitle: "A checklist for the gap between what an agent reports and what it actually did"
description: "Don't trust an AI agent's report. Read the diff, re-run the check, confirm it ran, trace claims to commits, and measure what shipped. Commands included."
dek: "Every gate in my repo cleanup returned green, and ten of twelve dispositions were wrong. Here is the checklist I run now before I trust an agent's work: what to check, the command for each, and what verification still can't catch."
tldr: "Don't verify an AI agent's work by reading its report; check the artifacts the report points at. Read the diff instead of the summary. Re-run the gate yourself and read the exit code. Confirm the check actually executed, because a skipped CI job can satisfy a required check. Trace every claim to a primary source: a commit SHA, the file at that SHA, ancestry on main. Reject any verification artifact that can't name its verifier, time, and source. Measure the shipped output, not the source file. And check that your gates don't all read the same upstream input, because N checks fed one artifact are one check. Verification catches false claims; it doesn't replace judgment about whether the change was the right one."
date: 2026-10-06T09:00:00-04:00
author: Abdur Rahman Sayeed
section: "Agent Systems"
register: argued
status_note: "A how-to that stakes a position: check artifacts, not reports. Argued from incidents written up on this site, not from a study. The commands are ones I run; your stack will need its own equivalents."
flagship: false
pinned: false
featured: false
tags:
  - ai-agents
  - verification
  - agents
  - ci
citation_preferred: "Sayeed, Abdur Rahman. 'How do you verify an AI agent's work before you trust it?' abdur.ai, 2026."
related:
  - the-night-the-doctrine-failed
  - 29-review-rounds-hardened-a-ci-gate-that-nothing-ran
  - meta-description-length-truncated-snippets
---

{/*
REVIEW DRAFT, not published. This file is content/posts/_drafts/*.md, so the
loader skips it and the publish gate never sees it.

PUBLISH BLOCKERS:
  - PR #66 (design system: <Figure> + <VerificationLoopDiagram />, registered
    in the PostArticle MDX map) must be merged first. Without it the
    <Figure> below fails the MDX render and breaks `npm run build`.
  - A `content-publish-override: content/posts/how-to-verify-ai-agent-work.mdx`
    entry in docs/superpowers/specs/overrides.md, approved by Abdur.

To publish after founder review:
  1. Rename to how-to-verify-ai-agent-work.mdx and move to content/posts/
  2. Set `date:` to the real publish date and update citation_preferred to match
  3. Confirm register/status_note still hold
  4. Add the content-publish-override entry above
  5. ./scripts/check-phase.sh --hard must pass
  6. Delete this comment block
*/}

I once ran a repo cleanup through a seven-rule protocol, five rounds of adversarial audit, and an independent cross-verifier. Every gate returned green. When I re-checked the close candidates against primary sources, ten of the twelve dispositions were wrong. The first close I had approved would have destroyed the only fix for a production bug. That's [The night the doctrine failed](/writing/the-night-the-doctrine-failed). This post is the checklist I run because of it.

**Short answer:** Don't verify an agent's report; verify the artifacts it points at. Read the diff, not the summary. Re-run the check yourself and read the exit code. Confirm the check actually ran. Trace each claim to a commit you can open. Measure what shipped, not the source. And make sure your checks don't all trust the same input.

## Why can't you trust an AI agent's own report?

Because the report is another output of the same process you're trying to check. An agent that misread a file will describe the misreading confidently. An agent that skipped a step will often say the step passed, because a passing step is what the plan said should happen.

The failure that cost me the most wasn't a lie. It was a verification file that existed, matched its schema, and contained nothing: twenty-one rows written before the verifier was even authenticated, echoing the table they were supposed to check. The gate loaded it and passed. I call that Potemkin verification. It's shaped like proof, and it isn't proof.

So the rule is simple to say: the agent's summary tells you where to look. It's never the thing you look at.

## What should you check before you trust an agent's work?

<Figure label="Figure 1" caption="The verification loop: the agent's report points at artifacts, each check reads a primary source rather than the report, and only a failing check sends work back to the agent.">
  <VerificationLoopDiagram />
</Figure>

Seven checks, in the order I run them.

### 1. Read the diff, not the summary

The summary is the agent's opinion of the diff. Read the diff itself.

```bash
git fetch origin
git diff --stat origin/main...HEAD   # what files actually changed
git diff origin/main...HEAD -- lib/  # read the parts that matter
```

If the summary says "small refactor" and the stat shows forty files, you've learned something before reading a line.

### 2. Re-run the gate yourself and read the exit code

"Tests pass" is a claim. An exit code is evidence.

```bash
./scripts/check-phase.sh --hard; echo "exit=$?"
npm run build; echo "exit=$?"
```

Watch for pipelines that swallow failure. `cmd | grep -q ok && status=ok` without a `|| exit 1` turns a silent miss into a pass. A class-sweep with grep across your scripts finds those faster than another review round.

### 3. Confirm the check actually ran

A green check and a check that never executed can look the same. I had a path-authorization script survive 29 adversarial review rounds while no CI job invoked it; wiring it in, I then found a skipped job satisfying a required status check. That's [29 review rounds hardened a CI gate that nothing ran](/writing/29-review-rounds-hardened-a-ci-gate-that-nothing-ran).

```bash
gh api repos/OWNER/REPO/commits/SHA/check-runs \
  --jq '.check_runs[] | "\(.name)\t\(.status)\t\(.conclusion)"'
```

`skipped` is not `success`. Read the conclusion column, not the color of the badge.

### 4. Trace every claim to a primary source

"This PR is superseded by main" is a claim about git history. Check it against git history.

```bash
git merge-base --is-ancestor SHA origin/main && echo "on main" || echo "NOT on main"
git show SHA:path/to/file.sql | less      # the file as it was at that commit
git log --first-parent --oneline origin/main -- path/to/file
```

In my cleanup, the claim was that a migration repaired a field. Opening the migration at its SHA showed it never touched that field. One command, and a production fix would have survived on evidence instead of luck.

### 5. Reject verification artifacts without provenance

If a gate consumes a verification file, check each row for who verified it, when, and against what source. A row missing any of those is data shaped like a verification.

```bash
jq -c 'select(.verifier == null or .timestamp == null or .source_sha == null)' verify.jsonl
```

Any output from that line is a row your gate shouldn't count. Adjust the field names to your schema; the point is that the gate checks them, row by row.

### 6. Measure what shipped, not the source

Source files are intentions. Rendered pages, built bundles, and deployed responses are facts. When I audited this site's metadata, the numbers that mattered were in the built HTML, not the frontmatter; that's [12 of my 15 meta descriptions were too long for search](/writing/meta-description-length-truncated-snippets).

```bash
curl -s https://example.com/page | grep -o '<title>[^<]*</title>'
curl -sI https://example.com/page | head -1
```

"It's deployed" means a request to the real URL returned what you expected, this session.

### 7. Make sure your checks don't share one input

Three checks that all read the same agent-written table are one check wearing three hats. If that table is wrong, all three agree with it. For each gate, ask what it reads. If two gates read the same upstream artifact, at least one of them should read the primary source instead.

## How do you make verification a habit instead of a heroic act?

Put it where you can't skip it. In this repo, one gate script runs the claims check, typecheck, lint, and build, and the pre-commit hook runs it in hard mode. The process doc has a rule I hold agents and myself to: don't write "done," "deployed," or a number unless a command you ran this turn produced it.

That rule does more work than any single check. It turns "the agent said so" into "show me the command."

## What can't verification catch?

Whether the change was the right one. Every check above catches false claims: the file didn't change, the test didn't run, the commit isn't on main. None of them tells you the design was sound. In my cleanup, what saved the production fix was a model deciding to read the actual code instead of trusting the table. That's judgment, and it isn't something scaffolding can guarantee. I wrote about where that judgment has to live in [who owns the architecture when the AI writes the code](/writing/who-owns-the-architecture-when-ai-writes-the-code).

## FAQ

### How do I know if an AI agent actually ran the tests?

Re-run them yourself and read the exit code, or read the CI check run's conclusion for that exact commit. Don't accept "tests pass" in a summary, and treat a skipped job as not run.

### Should a second AI model verify the first one's work?

It can help, if the second model reads primary sources (the diff, the files at named commits) and not the first model's summary. A verifier fed the summary is the summary speaking twice.

### What's the fastest check if I only have a minute?

`git diff --stat` against the base branch, then re-run the one command that proves the change works. The stat catches scope surprises; the re-run catches false passes.

### Does this apply to non-code agent work?

Yes. Swap the commands for the domain's primary sources: the sent email in the outbox, the row in the database, the page at its live URL. The rule is the same: check the artifact, not the account of it.

<NewsletterCTA />
