# Distribution draft — "A fact has two clocks"

**Status: DRAFT.** Post-publish URL: https://abdur.ai/writing/a-fact-has-two-clocks (404 until published).

## LinkedIn

> Your database tells a small, confident lie every day.
>
> A user moves to Lisbon on March 3rd. Your agent learns it on March 19th. You store one timestamp — the write time — and six weeks later the system cannot answer "where did the user live in early March" without either splitting the user in two or erasing the move entirely.
>
> The row isn't wrong. The model is: it collapsed two events into one timestamp. When a fact became true and when the system learned it are different events, on different clocks — and agents, which act on beliefs at machine speed, need both.
>
> New essay: the bi-temporal memory model I'm designing around — what two clocks buy you (replay, honest correction, gradable evals), and the cheap four-column version you can add this week.
>
> https://abdur.ai/writing/a-fact-has-two-clocks
>
> #AgentSystems #AIInfrastructure #DataEngineering

## X/Twitter thread

1/ A user moves to Lisbon on March 3rd. Your agent learns it on March 19th. You store one timestamp. Six weeks later, "where did the user live in early March?" is unanswerable without lying. New essay: a fact has two clocks, and agent memory needs both.

2/ Valid time: when the fact was true in the world. Knowledge time: when the system learned it. Different events, different clocks — and they diverge constantly, in both directions, for structural reasons.

3/ What two clocks buy you: Replay — what would the agent have believed on March 10th? Correction without self-deception — the 16-day gap between the clocks is itself data. Honest grading — "did the agent give the right answer" is meaningless unless you specify *as of when*.

4/ The discipline has teeth: never update a belief in place (corrections supersede; history stays). Valid time may disagree with write time — and when you can't determine it, the honest value is "unknown," not "assume now." Expiry closes a range; it doesn't delete a row.

5/ The cheap version fits in four columns: valid_from, valid_to, recorded_at, superseded_at. Append-only, no UPDATEs. You won't get the whole model — but your past can no longer be retroactively edited by your present.

6/ A memory system that keeps only one clock isn't recording history — it's drafting it. Full essay: https://abdur.ai/writing/a-fact-has-two-clocks

## Newsletter blurb

> **A fact has two clocks.** When it was true, and when your system learned it — different events, and collapsing them into one timestamp is how stale facts get quoted with fresh confidence. This week's essay is the public write-up of the bi-temporal model I've been promising since June, including the four-column version you can steal this week. https://abdur.ai/writing/a-fact-has-two-clocks
