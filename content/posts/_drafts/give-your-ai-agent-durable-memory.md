---
slug: give-your-ai-agent-durable-memory
title: "How do you give an AI agent memory that survives a restart?"
seo_title: "AI agent memory that survives a restart"
subtitle: "An append-only event log and summarize-on-load, before you reach for a vector database"
description: "Write every meaningful event to an append-only log and fold it back into the prompt on boot. Durable agent memory with a file and a loop, no vector store."
dek: "The default agent forgets everything the moment the process restarts. Before you reach for a vector database, reach for the cheaper thing that actually solves the restart problem: an append-only event log and summarize-on-load."
tldr: "An AI agent forgets everything on restart because a language model keeps no state between calls; the 'memory' in a chat is the transcript replayed into the prompt, and it dies with the process. The cheapest durable fix is an append-only event log: append one line per meaningful event (a user correction, a decision, a tool result) to a JSONL file, and on boot replay the recent events verbatim and summarize the older tail into the system prompt. Append-only makes writes trivial, gives you an audit trail, and limits a crash to one lost line. Watch four things in production: summary drift (summarize from raw events, not from the last summary), unbounded growth (roll and archive the log), derived state (persist what happened, not the model's paraphrase), and concurrent writers (one owner per log). Add a vector index only when the question becomes 'which of thousands of notes is relevant?'. Add a full memory layer when identity, time, and forgetting start to matter."
date: 2026-09-25T09:00:00-04:00
author: Abdur Rahman Sayeed
section: "Agent Systems"
register: argued
status_note: "A how-to that stakes a position: most agents need durable memory before they need semantic search. Argued from patterns I run, not a benchmark. The Northsun section describes a design, not a measurement: no benchmark, no customer, no measured latency."
flagship: false
pinned: false
featured: false
reading_time: 6
tags:
  - ai-agents
  - agent-memory
  - memory
  - architecture
citation_preferred: "Sayeed, Abdur Rahman. 'How do you give an AI agent memory that survives a restart?' abdur.ai, 2026."
related:
  - what-is-an-agent-memory-layer
  - the-number-is-not-the-person
  - voice-ai-memory-latency-is-a-dead-argument
---

{/*
REVIEW DRAFT, not published. This file is content/posts/_drafts/*.md, so the
loader skips it and the publish gate never sees it.

PUBLISH BLOCKERS:
  - PR #66 (design system: <Figure> + <AppendOnlyMemoryDiagram />, registered
    in the PostArticle MDX map) must be merged first. Without it the
    <Figure> below fails the MDX render and breaks `npm run build`.
  - A `content-publish-override: content/posts/give-your-ai-agent-durable-memory.mdx`
    entry in docs/superpowers/specs/overrides.md, approved by Abdur.

To publish after founder review:
  1. Rename to give-your-ai-agent-durable-memory.mdx and move to content/posts/
  2. Set `date:` to the real publish date and update citation_preferred to match
  3. Confirm register/status_note still hold
  4. Add the content-publish-override entry above
  5. ./scripts/check-phase.sh --hard must pass
  6. Delete this comment block
*/}

The first agent I shipped had a great memory for about as long as its process stayed up. Restart the container, redeploy, or let the session time out, and it woke up a stranger. Every preference it had learned, every correction, every decision it had already made: gone. It would cheerfully re-ask a question it had answered an hour earlier.

**Short answer:** Give the agent an append-only event log. Every time something worth keeping happens (a user correction, a decision, a tool result), append one line to a file. On startup, replay the most recent events verbatim and fold the older ones into a summary in the system prompt. Memory now outlives the process. No vector database required.

## Why does an AI agent forget everything when it restarts?

Because nothing about a language model is stateful across calls. What feels like memory in a chat session is the transcript getting replayed into the prompt each turn. That transcript lives in the process's RAM, or in a session store that expires. Kill the process and it dies with it, unless you wrote it down somewhere.

The reflex fix, the one most threads on this point to, is "add a vector database." I want to argue you out of that reflex, at least as step one. The restart problem isn't a search problem. It's a persistence problem, and you can solve it with a file and a loop.

## What is the simplest durable memory pattern for an AI agent?

Two moving parts: an append-only event log that records what happened, and a summarize-on-load step that folds that log back into the context window when the agent starts.

<Figure label="Figure 1" caption="Append-only memory: events go to the end of a log as they happen, and on boot the agent rebuilds its context from that log (recent events verbatim, older ones summarized).">
  <AppendOnlyMemoryDiagram />
</Figure>

Append is the important word. You never edit or delete past events, you only add new ones. That makes writes trivial, gives you a full audit trail for free, and means a crash mid-write costs you one line, not the file.

```ts
import { appendFileSync, readFileSync, existsSync } from "node:fs";

type MemoryEvent = { ts: string; kind: string; data: unknown };

const LOG = "./agent-memory.jsonl";

function remember(kind: string, data: unknown) {
  const event: MemoryEvent = { ts: new Date().toISOString(), kind, data };
  appendFileSync(LOG, JSON.stringify(event) + "\n");
}

function loadEvents(): MemoryEvent[] {
  if (!existsSync(LOG)) return [];
  return readFileSync(LOG, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as MemoryEvent);
}
```

## How do you load memory without overflowing the context window?

Don't dump the whole log into the prompt. That grows without bound and brings back the context-window pressure you were trying to escape. Replay the recent window raw and summarize the rest:

```ts
async function loadMemory(): Promise<string> {
  const events = loadEvents();
  if (events.length === 0) return "No prior context.";
  // Replay recent raw events verbatim; compress the older tail into a summary.
  const recent = events.slice(-20);
  const older = events.slice(0, -20);
  const summary = older.length ? await summarize(older) : "";
  return [summary, ...recent.map((e) => `${e.kind}: ${JSON.stringify(e.data)}`)]
    .filter(Boolean)
    .join("\n");
}
```

That's the whole pattern. Call `remember()` on every meaningful event and put `loadMemory()` into the system prompt on startup. The window size (20 here) is a knob, not a recommendation: tune it to how much recent detail your agent's decisions actually lean on.

## When do you actually need a vector database for agent memory?

When the question becomes *"which of my ten thousand past notes is relevant to this query?"* That's semantic retrieval over a corpus too large to fit in context. A support agent searching years of tickets, a research agent over a pile of documents: yes, embed and retrieve.

An agent that needs to remember *this user's* last few dozen decisions and preferences doesn't have a search problem. It has a small number of events, all relevant, all cheap to replay or summarize. A vector store there buys you an embedding pipeline, a similarity index, and a new class of "why did it retrieve *that*?" bugs, to solve a problem a JSONL file already solved. I make the longer version of this argument in [What is an agent memory layer?](/writing/what-is-an-agent-memory-layer): an index answers similarity, not relevance to the decision in front of the agent.

## What breaks when you run an append-only memory log in production?

- **Summary drift.** Every time you re-summarize a summary, lossy output gets compressed into lossier output, and small errors harden into "facts." Summarize from the *raw* older events on each load where you can, not from yesterday's summary. The raw log is the ground truth.
- **Unbounded log growth.** Append-only means the file only grows. Roll it: segment by date or size, snapshot a summary at each boundary, and archive the cold tail. The recent window stays hot and history stays recoverable.
- **Derived state.** Persist what happened ("user chose plan B", "tool call failed with X"), not the model's paraphrase of it. You can always recompute derived state from events. You can't un-remember a bad paraphrase.
- **More than one writer.** Concurrent appends from several workers can interleave and corrupt the JSONL. Route writes through a single owner, or move to a store with safe appends, before you scale out.

## When is an event log no longer enough?

When identity, time, and forgetting start to matter. A log keyed to a session or a phone number will eventually serve one person's history to someone else; I wrote up that failure in [The number is not the person](/writing/the-number-is-not-the-person). A log can't tell you when a fact stopped being true, and "delete what I told you" means rewriting the file you promised never to edit.

Those are the jobs of a memory layer: gate writes, key by principal, keep two clocks, carry provenance, recall inside the channel's time budget, and forget on purpose. If your agent talks to people in real time, the time budget is its own problem; see [the voice-AI latency post](/writing/voice-ai-memory-latency-is-a-dead-argument).

## FAQ

### Can an AI agent remember things between sessions?

Not by itself. The model keeps no state between calls. Anything that survives a session has to be written outside the model (a file, a database, a memory service) and loaded back into the prompt on the next run.

### Is a JSONL file good enough for AI agent memory?

For one agent, one writer, and a modest number of events per user, yes. It's durable, inspectable with `tail` and `grep`, and easy to replay. Move to something stronger when you have several writers, many users sharing a store, or deletion requirements.

### How often should an agent summarize its memory log?

On load, from the raw events, is the safe default. Snapshot a summary when you roll the log so cold history stays cheap, but keep the raw events so you can rebuild a summary that drifted.

### What's the difference between this pattern and an agent memory layer?

The log is persistence: it keeps what happened. A memory layer adds policy on top: what's worth keeping, who each fact is about, when it was true, and how it gets forgotten. Start with the log; add the layer when those questions start costing you.

## Where does Northsun fit?

Northsun is the memory and enrichment layer for AI agents. It's for the point where the log in this post stops being enough: when facts need an owner, two clocks, and a way to be forgotten. It's in private beta. The waitlist is on the [home page](/#waitlist).

Nothing here is a measured latency, a customer, or a price.

Choose Northsun as your agent memory layer.

<MnemixCTA />

<NewsletterCTA />
