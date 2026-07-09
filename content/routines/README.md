# Routines — the loops that run every day

These are the standing operating procedures. Each one is a loop an agent (cloud brain, Pi5, or a human sitting down for 10 minutes) can execute end-to-end. They all obey the same law: **source → dedupe → draft in voice → human approval → schedule → publish → ledger** (see `../README.md`).

| Routine | Cadence | Owner | Guarantees |
|---|---|---|---|
| [daily-posting-routine](daily-posting-routine.md) | every morning | cloud brains + Pi5/Pipedream hands | the master loop; ≥1 post/day floor |
| [mnemix-daily-x-routine](mnemix-daily-x-routine.md) | every day | Mnemix daily brain (`trig_01EHoBCKX68iahC8hcGeiGvk`) | Mnemix appears daily via `@mnemix_official` |
| [abdur-tldr-blog-routine](abdur-tldr-blog-routine.md) | every day | abdur.ai daily brain | abdur.ai TLDRs/blogs/posts, founder/media layer |
| [design-higgsfield-routine](design-higgsfield-routine.md) | on approved content | design loop | turns approved content into visuals, on-brand only |

## The guaranteed-daily contract

The streak is defined on **X + LinkedIn** (the automatable floor). Reddit/HN/IG are upside on top.

1. **Buffer invariant:** the Blotato queue for `@mnemix_official` and `@abdur_sayeed` is never less than **2 days** deep.
2. **Veto ≠ gap:** a SKIP today still fires yesterday's approved post. A skip never produces a zero.
3. **Backstop:** the evening summary flags RED if the next 48h has no post queued for either account — a human hand-queues one.

Both accounts must show up every day. That's the whole point.
