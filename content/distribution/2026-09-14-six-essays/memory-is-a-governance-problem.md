# Distribution draft — "Memory for agents is a governance problem, not a database problem"

**Status: DRAFT.** Post-publish URL: https://abdur.ai/writing/memory-is-a-governance-problem (404 until published).

## LinkedIn

> Every team building memory for an AI agent starts with the same conversation: which store? Postgres with pgvector, a vector database, Redis with embeddings.
>
> Then the system goes live, and the questions that actually hurt arrive one at a time. A user says "forget that," and the team discovers the fact is copied into a summary, a cache, and three derived embeddings. A correction comes in, and now the old value and the new value both exist, both retrievable, both confident. Someone asks where the agent "learned" a claim it just made — and nobody can reconstruct it.
>
> None of those are database problems. Every one of them survives a perfect database.
>
> New essay: why agent memory is a governance problem — admission, authority, time, and death — and what it looks like when those four are implemented in code instead of promised in a docs PDF.
>
> https://abdur.ai/writing/memory-is-a-governance-problem
>
> #AgentSystems #AIInfrastructure #LLMs

## X/Twitter thread

1/ Every team building agent memory starts by picking a database. The failures that actually hurt — facts that won't die, corrections that don't stick, provenance nobody can reconstruct — survive a perfect database. New essay on why memory is a governance problem, not a database problem.

2/ A database promises one thing: what you stored, you can get back. But an agent doesn't just retrieve — it *relies*. The moment it injects a remembered fact into a prompt and acts on it, four new questions attach to that fact. None live in the store.

3/ Admission: was this fact ever allowed to become memory? Authority: who may rely on it — and was it stated, inferred, or written by another tenant's agent? Time: when was it true vs. when did we learn it? Death: how does it end — and do the derived copies die with it?

4/ A schema can hold columns for all four. Holding the columns is not governing them — the way a drawer full of passports is not a border.

5/ The database framing persists because databases are buyable and governance isn't. You can adopt a vector store in an afternoon. You cannot adopt an admission policy in an afternoon — it's a pile of judgments about your product no vendor can make for you.

6/ So the industry conversation stays on the buyable part, and teams discover the governance part in production, in an incident, in the worst possible order. Do it in the other order. Full essay: https://abdur.ai/writing/memory-is-a-governance-problem

## Newsletter blurb

> **Memory is a governance problem.** Picking the store is the afternoon part. The hard part is deciding what is allowed to become a fact, who may rely on it, which clock it runs on, and how it dies — and implementing those decisions in code, in front of the database, not in a policy doc behind it. This week's essay argues the case and names the four mechanisms. https://abdur.ai/writing/memory-is-a-governance-problem
