# Incident postmortem template

Part of the Agent Reliability Kit from abdur.ai. This is the blank form of the
format I use for the Mistakes TLDR postmortems on abdur.ai/writing: short,
evidence-anchored, one named pattern per incident.

How to use it:

- Write it in the first person, as plainly as you'd say it to a colleague.
- Every factual line traces to a receipt: a commit SHA, a file path, a command
  and its output, an error code, a log line. If you can't point at one, cut
  the line or mark it as unverified.
- Name one pattern. The name is what you'll search for the next time this
  happens, so make it a phrase someone else could apply to their own system.
- Delete these instructions and every `<placeholder>` before you share it.

---

```yaml
title: "<short, concrete: what broke, in plain words>"
date: <YYYY-MM-DD>
author: <name>
status: <draft | reviewed | shared>
pattern:
  id: <P-001, your own running id>
  name: "<the generalized pattern, in a few words>"
receipts:
  - path: "<repo-relative path>"
    sha: "<short sha>"
    note: "<one line: what this receipt proves>"
```

# <Title>

<Cold open, 2 to 4 sentences: the failure and why it matters. No throat-clearing.>

## What broke

<The concrete failure mechanics. What ran, what it read, what it did instead of
what you expected. Name the component, the input and the output.>

## What it cost

<Honest impact. Who or what saw it, for how long. If it was caught before
anyone was affected, say so and price the engineering time instead. No
estimated numbers presented as measured ones.>

## The receipts

| Receipt | Where | What it shows |
| --- | --- | --- |
| <sha> | <repo-relative path> | <one line> |
| <command> | <where you ran it> | <the output that matters, quoted> |
| <error code or log line> | <service / file> | <one line> |

## The pattern

**<P-id> <Pattern name>.** <State the generalized lesson so another builder can
apply it without knowing your system. One pattern per postmortem. If the lesson
is the same as an earlier one, reuse its id instead of inventing a new name.>

## The fix

<What actually fixed it, with the commit or change that did. If part of it is
still open, say which part and where it's tracked.>

<One final sentence: the takeaway. No heading.>

---

## Before you share it

- [ ] Every number, date and quote traces to a receipt above.
- [ ] No secrets, API keys, session URLs or machine-local paths.
- [ ] One pattern, with an id and a name.
- [ ] "What it cost" is honest, including "caught before anyone saw it."
- [ ] Someone other than the author read it against the receipts.

## Pattern names, for reference

These are pattern names from the postmortem "The night the doctrine failed" on
abdur.ai, to show the style. They name a failure shape, not a single bug.

- Potemkin verification
- Disposition tables carry false facts forward
- N safety layers consuming one upstream artifact

---

Agent Reliability Kit · abdur.ai/kit · Abdur Rahman Sayeed
