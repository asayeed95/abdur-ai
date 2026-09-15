# Distribution draft — "Erasure that survives caches"

**Status: DRAFT.** Post-publish URL: https://abdur.ai/writing/erasure-that-survives-caches (404 until published).

## LinkedIn

> A user tells your agent: forget me. Someone runs the delete. The row is gone. Everyone feels done.
>
> Nobody should feel done. That row was never the fact. The fact had already been read into an embedding in a vector index, absorbed into a rolling summary, cached at the edge, and written to a log. The row was the one copy with a name.
>
> Erasure is not an operation on a row. It's a propagation problem across every derived representation of a fact — and the deliverable isn't a successful DELETE, it's a proof of absence you can show someone.
>
> New essay: the five places a fact actually lives, why summaries are the hard case (and the only two honest options for them), how to bound caches with a generation counter, and the post-erasure probe that turns "we deleted it" into a document instead of a reassurance.
>
> https://abdur.ai/writing/erasure-that-survives-caches
>
> #AgentSystems #Privacy #AIInfrastructure

## X/Twitter thread

1/ "Forget me." Someone runs DELETE FROM. The row is gone. Everyone feels done. Nobody should feel done — the row was the one copy with a name. New essay: erasure that survives caches.

2/ One retained fact fans out to at least five places: the primary row, the embedding, the summaries that absorbed it, the caches that served it, the logs. A deletion that covers the first and ignores the rest isn't erasure. It's tidying.

3/ The engineering difficulty isn't the deletes — it's the reference problem. Tag every vector with the fact IDs it encodes or erasure is impossible in principle: you cannot delete what you cannot find, and you cannot find what you never linked.

4/ Summaries are the hard case. Once a fact is absorbed into prose there is no surgical removal — so summaries must be regenerable computations over primary facts, with lineage recorded, or they don't get stored. Most architectures have it backwards.

5/ Caches are a clock problem: no cache entry derived from memory may outlive your erasure budget. Better: version cache keys by a per-principal generation counter, and erasure propagates at the speed of an increment.

6/ Then prove the absence: a post-erasure probe replays the retrieval paths that used to surface the fact and asserts it's gone from each. The machinery's own success report doesn't count. Full essay: https://abdur.ai/writing/erasure-that-survives-caches

## Newsletter blurb

> **Erasure that survives caches.** DELETE FROM removes a row — not the embedding, not the summary that absorbed the fact, not the cache that served it. This week's essay treats "forget me" as the propagation problem it actually is, and ends with the part most designs skip: proving the absence after the machinery reports success. https://abdur.ai/writing/erasure-that-survives-caches
