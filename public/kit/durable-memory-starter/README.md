# Durable-memory starter

Part of the Agent Reliability Kit from abdur.ai. One file, `memory.mjs`, that
gives an AI agent memory that survives a restart: an append-only JSONL event
log on disk and a bounded replay window you put back into the prompt.

It is the example from the abdur.ai guide "How do you give an AI agent memory
that survives a restart?", with a small command-line entry point added so it
runs on its own. No dependencies, no API key, no vector database.

## Run it

Node.js 22 or later.

```bash
node memory.mjs remember preference '{"units":"metric"}'
node memory.mjs load
```

The first command appends one event to `./agent-memory.jsonl`, creating it
owner-only (`0600`). The second is a separate process: it reads the log back
and prints the replay text you would hand to the model.

Set `MEMORY_LOG` to put the log somewhere else. Use a file in an existing
directory on storage that survives the kind of restart or redeploy you
actually do, and test that separately.

## Use it from code

```js
import { remember, loadMemory } from "./memory.mjs";

remember("tool_call_failed", { tool: "search", error: "timeout" });
const context = loadMemory(); // newest whole records that fit 8 KiB, plus a header
```

## What it does

1. **Record:** validates the event, refuses one over 2 KiB, appends a
   newline-terminated JSON line and flushes it.
2. **Restart:** parses complete records with strict UTF-8. A damaged complete
   record stops the load so you can investigate it. An unfinished final record
   is reported and left out.
3. **Resume writing:** removes that unfinished tail before the next append.
4. **Replay:** returns the newest whole records that fit the 8 KiB replay
   budget, and says how many older records it left out.

## Limits, on purpose

- **One principal, one writer.** Concurrent appends from several workers can
  interleave and corrupt the file. Route writes through one owner.
- **Owner-only log.** On POSIX systems an existing log with any group or other
  permission is refused until you `chmod 600` it.
- **Byte limits, not token limits.** 2 KiB per event, 1 MiB per log, 8 KiB of
  replay. These are demonstration values. Budget the whole prompt with your
  provider's tokenizer.
- **Log full means stop.** At the cap, writes fail. With the writer stopped,
  back up the log, move it to a dated archive and start a new file.
- **Not a durability guarantee.** Flushing narrows the window for lost writes.
  It does not promise survival of every filesystem or hardware failure, and a
  retry can append the same event twice.
- **The replay header is a label, not a security boundary.** Treat replayed
  records as untrusted data, not instructions.

When identity, time and forgetting start to matter (several users, facts that
stop being true, deletion), a single log is no longer enough. That is the job
of a memory layer.

---

Agent Reliability Kit · abdur.ai/kit · Abdur Rahman Sayeed
