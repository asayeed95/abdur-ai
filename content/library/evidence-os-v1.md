---
title: "Evidence Before Shipping"
subtitle: "A workbook for saying \"done\" about AI-assisted code only when something could have proved you wrong."
version: "v1-draft"
status: draft
updated: "2026-10-17"
sources:
  - slug: 29-review-rounds-hardened-a-ci-gate-that-nothing-ran
    title: "29 review rounds hardened a CI gate that nothing ran"
  - slug: the-analytics-call-that-couldnt-fail
    title: "The analytics call that couldn't fail"
  - slug: your-pager-is-not-your-customer
    title: "Your pager is not your customer"
---

> DRAFT — not approved for publication. Founder edits pending.

## Why this exists

Agents and humans both say "done" too early: the build is green, the review rounds are closed, the alert went quiet. Three things I've published on this site were that word being wrong in three different ways: a CI gate that nothing ran, analytics events that went nowhere for nearly ten weeks, and a page that proved something about a health check and nothing about users. In each case the code did what it said. The claim about the code was the part nobody checked.

This workbook is the loop I now run before I say a change works: write the claim down, say where it stops, name the check that could fail, and keep the artifact that shows it ran. It won't make your code correct. It makes it harder to confuse "nothing complained" with "it works," which is most of the problem. Every example below is cited so you can check it against the original.

## The loop

**Claim.** The one sentence you want to be true after this change, written so a stranger could disagree with it. "The gate protects main." "CTA clicks are tracked." "Users are down."

> You have a claim when it names a behavior someone else could observe, not an activity you performed.

**Boundary.** Where the claim stops: which events, environments, inputs, users, and time window it covers, and which it doesn't. Most false "done"s are true claims with the boundary left off.

> You have a boundary when you can name at least one case the claim does not cover, and say what happens there.

**Oracle.** The check that decides whether the claim is true, and that is able to come back false. A build that can't fail, a skip that counts as a pass, or a quiet dashboard is not an oracle.

> You have an oracle when you have seen it go red on purpose, or can describe the exact input that would make it go red.

**Receipt.** The thing a reader could check without trusting you: a SHA, a log line, a run, a measurement, produced for this change. "I remember it going that way" is not a receipt.

> You have a receipt when someone who doesn't believe you can verify the claim without asking you anything.

<!-- preview-end -->

## The worksheet

Copy this once per change, before you write "done."

| Field | Your answer |
|---|---|
| Claim (one sentence, observable) | ____ |
| Boundary: covered | ____ |
| Boundary: not covered, and what happens there | ____ |
| Oracle (the check that can fail) | ____ |
| Oracle seen failing? How? | ____ |
| Receipt (SHA / run / log line / measurement) | ____ |
| What would make this claim false | ____ |
| Known open holes, each with an owner | ____ |
| Rollback (exact steps, and who can run them) | ____ |

If a row is blank, the honest status is "unproven," and that's an allowed thing to ship as long as you say it.

## Worked example 1 — the gate nothing ran

**Situation.** Our monorepo had a script that decides whether a pull request touched only the files its build-plan row authorizes. It had been through twenty-nine adversarial review rounds on a sibling PR. Then someone asked which CI job runs it. None did. "It was a script an agent runs by hand and self-reports." Wiring it into a required-check job took one session and three review rounds, and round two found a bypass that needed no code edit: a job-level `if: github.event_name == 'pull_request'` meant a manual `workflow_dispatch` on the PR's branch produced a *skipped* job on the PR's head SHA, and GitHub treats a skipped job as satisfying a required status check.

- **Claim.** Before: the script is correct. After: a PR that touches files outside its authorized row cannot merge. The post's own line for the difference: "\"Hardened\" and \"enforced\" are different states."
- **Boundary.** Pull request events only. A push to `main` gets a named skip; any other event, including `workflow_dispatch`, is refused. The gate and the verifier are materialized from `origin/main`, not the PR's copy. A row that predates the convention gets a loud skip that says it is missing coverage, not a pass. Not covered, and said so in the PR: five known open holes, each named with an owner (among them: a same-repo PR can still edit the workflow file, and a branch named `age-1202-anything` inherits AGE-1202's row).
- **Oracle.** Its own job with its own required status context, reading the verifier's exit code. A verifier killed by a signal exits 2 with `VERDICT: no-verdict` instead of passing. Proven in both directions with real PRs, 186 fixtures, and six hand-mutations that each turn the suite red.
- **Receipt.** SHA `6a7442f1` on `.github/workflows/ci.yml`, `scripts/verify/build-plan-gate.mjs`, `scripts/test/run-all.sh`, `RETRO.md`, and the decision log. A live manual dispatch after the fix fails with `VERDICT: refuse reason=not-a-pull-request event=workflow_dispatch`. The bootstrap window was observed closed on the first post-merge run (`VERDICT: bootstrap` count: 0), not assumed closed.

**What the post shows went wrong.** Twenty-nine rounds of hardening and no invocation. A job-level `if:` that worked as an off switch. A first version that read a table cell by position, which an appended Markdown cell could shift while the rendered row looked identical. One mutation that "survived" only because the mutant was a no-op: `false && X || Y` is just `Y`.

**What it shows went right.** Every non-enforced outcome is a named skip. The mutant was re-run with parentheses before anyone read "survived" as a gap: "A survived mutation is only evidence once the mutant is proven effective." Stale rows the author didn't own were listed with owners instead of quietly edited to turn the gate green. And the rule worth taping to the monitor: "a gate that cannot run must never be mistaken for a gate that passed."

Source: [29 review rounds hardened a CI gate that nothing ran](https://abdur.ai/writing/29-review-rounds-hardened-a-ci-gate-that-nothing-ran)

## Worked example 2 — the call that couldn't fail

**Situation.** From the first commit on abdur.ai (`82c5c59`, June 28), the in-post CTAs called `window.plausible?.(name)` and `window.va?.("event", ...)`, each behind a `@ts-expect-error` comment. No analytics package was installed and no provider script was loaded, so neither global ever existed. Optional chaining turned every call into `undefined` instead of an error, the type-checker directive kept the compiler quiet about the missing declarations, and every build passed. It stayed that way until September 4. "I can't tell you how many clicks it lost. That's the point: nothing recorded them."

- **Claim.** Before: CTA clicks are tracked. After the fix, the narrower honest claim: if the analytics package goes missing, the build fails instead of quietly doing nothing.
- **Boundary.** Covered: call sites now go through one typed wrapper that imports the SDK. Not covered: whether events land in the dashboard (unverified as of the post); ad blockers, where the SDK's `track` is a no-op, so counts under-report and the README says to treat them as directional; and plan gating, where Vercel custom events need Pro or higher and are dropped silently on Hobby.
- **Oracle.** Before: a green build, which could not fail on this. After: a module import that fails the build if the package is missing; event names typed against an `ANALYTICS_EVENTS` catalog, so a misspelled event is a compile error; a waitlist form that checks `res.ok` before firing its conversion event. The oracle the post still owes: fire one known event and find it in the dashboard.
- **Receipt.** `82c5c59` (the original call sites), `e8c24ac` (the fix, task A-1, September 4), `6c284f7` (typed catalog and the Hobby-plan note, a day later), plus the `RETRO.md` entry and the build-plan row that marks dashboard verification as still pending.

> TODO(founder): if the A-1 dashboard check has happened since 2026-09-25, add its receipt here. If not, leave this as an open receipt; it is the most useful part of the example.

**What the post shows went wrong.** Three layers each did their job exactly as written. Optional chaining swallowed the runtime miss: "A missing provider looks the same as a working one that returned nothing." The compiler had it right and was told to keep quiet. And the config looked done: an env var named for a provider, a comment pointing at a wrapper file that didn't exist yet.

**What it shows went right.** The fix moved the failure somewhere loud, and the post refuses to call the job finished: "Until one known event shows up in the dashboard, \"tracking works\" is the same unproven claim the old code was making." The closing line is the whole workbook in one sentence: "a check that can't fail looks exactly like a check that passes."

Source: [The analytics call that couldn't fail](https://abdur.ai/writing/the-analytics-call-that-couldnt-fail)

## Worked example 3 — the page that proved nothing about users

**Situation.** Sentry first saw a production synthetic health cron fatal-timing out on a Redis ping at 2026-08-12T17:08:08.393Z. A Sentinel packet collected on 2026-08-22, 05:54Z to 06:00Z, still saw it firing, sampled about once a minute. The documented slow-warn in that check is 2000ms; the abort that actually kills the probe is about 100ms. The ticket opened as P0 and sat in a backlog after the first hour. There is no proof a user felt it. This example is about who the evidence is for: the pager's evidence is about the check, not the customer.

- **Claim.** Tempting: users are down; this is a P0; it started on August 12. Supportable: a synthetic cron is fatal-timing out on a Redis ping, inside its own warn budget.
- **Boundary.** The timestamp is first-seen, not a proven start-of-failure. The sample is one window on one date. The abort is tighter than the warn, so "if abort is tighter than warn, the page is about your client policy, not customer impact, until you prove otherwise." Not covered: any user path.
- **Oracle.** For the signal: the cron itself, with a time and an identity. For recovery: "A second independent probe, later, that would have failed during the incident." That probe has not been run. The post is explicit about what does not count: "The absence of the original exception is not this box."
- **Receipt.** The Sentry issue on the production synthetic health cron (first-seen timestamp above) and the Sentinel packet collected 2026-08-22. Recovery has no receipt and is not claimed.

**What the post shows went wrong.** An auto-opened ticket carried a P0 label that nobody accepted, and a loud detector was on its way to being read as customer impact. "The graph is honest about the abort and silent about the customer."

**What it shows went right.** It keeps four evidence states apart (signal, diagnosis, mitigation, recovery), writes down what it refuses to say from the packet (users are down, we recovered, the P0 label is accepted severity, the cron "started" on August 12), and labels its own lesson as proposed, not ratified. "Muting a cron is mitigation. It is not recovery."

Source: [Your pager is not your customer](https://abdur.ai/writing/your-pager-is-not-your-customer)

## Blank evidence cards

### Release card

- Change: ____
- Claim (observable, one sentence): ____
- Covered: ____
- Not covered, and what happens there: ____
- Oracle: ____
- Oracle seen failing (how, when): ____
- Receipt (SHA / run URL / log line): ____
- Skips, and what each one prints: ____
- Known open holes, each with an owner: ____
- Rollback (exact steps): ____
- Status: proven / partly proven (say which part) / unproven

### Incident card

Keep the four states separate. Fill only the boxes you have evidence for.

| State | Evidence | Time | Source |
|---|---|---|---|
| Signal: which detector fired, with what identity | ____ | ____ | ____ |
| Diagnosis: the causal story (can be wrong) | ____ | ____ | ____ |
| Mitigation: harm or noise reduced, not "fixed" | ____ | ____ | ____ |
| Recovery: a second independent probe that would have failed during the incident | ____ | ____ | ____ |

- First seen vs. proven start: ____
- User-path evidence (or "none"): ____
- Severity (write `unknown` until a user-path probe exists): ____
- Statements I refuse to make from this evidence: ____

## Failure-injection checklist

Run these before claiming a gate or dependency works. Each traces to a post.

**Gates** (from the CI gate post)

- [ ] Grep `.github/workflows/` for the gate script's name. No hit means the gate is advisory.
- [ ] Confirm it is a required status context and its own job, not a step inside another job.
- [ ] Trigger a manual `workflow_dispatch` on the PR branch. It should refuse, not post a green skip.
- [ ] Confirm CI runs the gate copied from the base ref, not the PR's copy.
- [ ] Read what it prints on every skip path. A silent skip can't be told apart from a pass in the log.
- [ ] Kill the verifier mid-run. It should produce a named no-verdict, not zero failures.
- [ ] Feed it a row it can't parse (an extra Markdown cell, a mismatched cell count). It should refuse, not conclude the row is harmless.
- [ ] Mutate it in a fixture, never the live subject, and prove the mutant changed behavior before reading "survived" as a gap.

**Dependencies** (from the analytics post)

- [ ] On the production page, ask the global directly in the console (`typeof window.plausible` or your equivalent). `"undefined"` means every call does nothing.
- [ ] Grep for `window.` followed by `?.(`, and for `@ts-expect-error` or `as any` next to vendor calls.
- [ ] Remove or rename the package locally. The build should fail; if it doesn't, the call site isn't importing it.
- [ ] Misspell one event name. It should be a compile error.
- [ ] Force a 4xx or 5xx on a form submit. The success state and the conversion event should not fire.
- [ ] Check the plan and the dashboard setting for anything gated that fails quietly.
- [ ] Fire one known event and find it in the dashboard before treating an empty chart as data.

**Alerts** (from the pager post)

- [ ] Print the abort timeout next to the warn budget in the same file. If abort is tighter, severity is `unknown`.
- [ ] Before claiming recovery, run a second, later, independent probe that does not share the original abort.

## Rollback prompts

Answer these before you ship, in writing.

1. What exactly do I revert (SHA, files, setting), and is it written down before merge?
2. If the gate runs from the base ref, does rolling it back itself require merging to `main` first?
3. If this check reddens honest work, what stops someone from disabling it, and what covers the gap if they do?
4. What signal tells me to roll back, and does it come from a user path or only from my own check?
5. If I mute an alert, am I recording that as mitigation, or am I about to call it recovery?
6. Which known holes ship with this change, and who owns each one?
7. After rollback, what is the honest status: unprotected, advisory, or unknown? Who needs to hear that?
8. Is there exactly one writer on this branch right now, and how would I know if there weren't?

## Sources

- [29 review rounds hardened a CI gate that nothing ran](https://abdur.ai/writing/29-review-rounds-hardened-a-ci-gate-that-nothing-ran)
- [The analytics call that couldn't fail](https://abdur.ai/writing/the-analytics-call-that-couldnt-fail)
- [Your pager is not your customer](https://abdur.ai/writing/your-pager-is-not-your-customer)

## Changelog

- v1-draft (2026-10-17): first draft assembled from three published posts; awaiting founder edit.
