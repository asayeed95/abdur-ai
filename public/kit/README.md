# The Agent Reliability Kit

Three files for engineers building AI agents, taken from work published on
abdur.ai. Free. Use them, copy them, change them.

| File | What it is |
| --- | --- |
| `agent-verification-checklist.md` | Seven checks to run before you trust an agent's report, with the commands for each. |
| `durable-memory-starter/` | `memory.mjs`, a single-file append-only JSONL memory log that survives a restart, and a short README. Node.js 22+, no dependencies. |
| `incident-postmortem-template.md` | A blank postmortem in the Mistakes TLDR format: what broke, what it cost, the receipts, one named pattern, the fix. |

Quick start for the memory starter:

```bash
cd durable-memory-starter
node memory.mjs remember preference '{"units":"metric"}'
node memory.mjs load
```

None of this is a product or a benchmark. The checklist is how I check agent
work; the memory starter is a demonstration with explicit limits; the template
is the format I write postmortems in. Read the limits in each file before you
rely on it.

New essays go out on the abdur.ai TLDR list: abdur.ai/subscribe

Abdur Rahman Sayeed · abdur.ai
