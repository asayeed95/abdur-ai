---
slug: give-your-ai-agent-durable-memory
title: "Give your AI agent memory that survives a restart"
subtitle: "A durable-memory pattern that isn't a vector database"
description: "Agents forget everything when the process dies. You don't need a vector store to fix that — an append-only event log plus summarize-on-load gets you durable memory with a file and a loop."
dek: "The default agent forgets everything the moment the process restarts. Before you reach for a vector database, reach for the cheaper thing that actually solves the restart problem: an append-only event log and summarize-on-load."
date: 2026-09-25T09:00:00-04:00
author: Abdur Rahman Sayeed
section: "Agent Systems"
register: argued
status_note: "A how-to that stakes a position: most agents need durable memory, not semantic search. Argued from patterns I run, not a benchmarked claim — correct me if your workload says otherwise."
flagship: false
pinned: false
featured: false
reading_time: 4
tags:
  - AI agents
  - memory
  - architecture
---

<!--
REVIEW DRAFT — not published. This file is content/posts/_drafts/*.md, so the
loader skips it and the publish gate never sees it.
To publish after founder review:
  1. Rename to give-your-ai-agent-durable-memory.mdx
  2. Move to content/posts/
  3. Confirm the register/status_note above still hold
  4. Add a content-publish-override: entry naming the exact path in
     docs/superpowers/specs/overrides.md
  5. ./scripts/check-phase.sh --hard must pass
-->

The first agent I shipped had a great memory for about as long as its process stayed up. Restart the container, redeploy, or just let the session time out, and it woke up a stranger. Every preference it had learned, every fact the user had corrected, every decision it had already made — gone. It would cheerfully re-ask a question it had answered an hour earlier.

The reflex fix, the one every thread on this points to, is "add a vector database." I want to argue you against that reflex — at least as step one. The restart problem is not a search problem. It's a persistence problem, and you can solve it with a file and a loop.

## The failure, precisely

An agent's working memory is its context window, and the context window lives in RAM inside a single process. Nothing about a language model is stateful across calls. The illusion of memory in a chat session is just the transcript getting replayed into the prompt each turn. Kill the process and the transcript dies with it unless *you* wrote it down somewhere.

So the whole game is: write down what happened, and reload it on boot.

## The cheap durable pattern: append-only log + summarize-on-load

Two moving parts. An append-only event log that records what happened, and a summarize-on-load step that folds that log back into the context window when the agent starts.

Append is the important word. You never edit or delete past events — you only add new ones. That makes writes trivial, gives you a full audit trail for free, and means a crash mid-write costs you one line, not the file.

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

On boot, you don't dump the whole log into the prompt — that grows without bound and reintroduces the context-window pressure you were trying to escape. You summarize it:

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

That's the whole pattern. `remember()` on every meaningful event, `loadMemory()` into the system prompt on startup. The agent now survives a restart because its memory outlives its process.

## When you actually do need vectors

Vectors earn their keep when the question is *"which of my ten thousand past notes is relevant to this query?"* — semantic retrieval over a corpus too large to fit in context. A support agent searching years of tickets, a research agent over a document pile: yes, embed and retrieve.

But an agent that needs to remember *this user's* last dozen decisions and preferences does not have a search problem. It has maybe a few hundred events, all relevant, all cheap to replay or summarize. Reaching for a vector store there buys you an embedding pipeline, a similarity index, and a new class of "why did it retrieve *that*" bugs — to solve a problem a JSONL file already solved. Add vectors when scale forces the search question, not before.

## The operational gotchas

- **Summary drift.** Every time you re-summarize a summary, you compress lossy output into lossier output, and small errors calcify into "facts." Summarize from the *raw* older events each load where you can, not from yesterday's summary. Keep the raw log as ground truth.
- **Unbounded log growth.** Append-only means the file only grows. Roll it — segment by date or size, snapshot a summary at each boundary, and archive the cold tail. The recent window stays hot; history stays recoverable.
- **Persist events, not derived state.** Write the facts that happened ("user chose plan B", "tool call failed with X"), not the model's paraphrase of them. Derived state you can always recompute from events; a bad paraphrase you can't un-remember.
- **One writer.** Concurrent appends from multiple workers interleave lines and corrupt your JSONL. Funnel writes through a single owner or a real append-safe store before you scale out.

This is the exact problem space Northsun works in — it's the memory and enrichment layer for AI agents — and the pattern above is the honest floor you should build before you decide you need more than a file.

<MnemixCTA />

<NewsletterCTA />
