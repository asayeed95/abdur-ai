# Good examples — drafts that pass

These are real, in-voice. Study *why* each works, then write like this.

---

## 1. Mnemix X thread — the concurrency race (receipt-first war story)

> **1/** Shipped a voice-memory API. Serial tests: 100% recall, clean. Then I fired 25 concurrent calls from the same caller. Recall collapsed to ~20%. No errors — every request returned 200. Here's the race that only exists in production.
>
> **2/** First time we see a phone number, we mint an entity and attach memories to it. resolveEntity did the obvious thing: SELECT existing → if none, create new → write memories → upsert the identifier.
>
> **3/** Serial, fine. But a burst of calls for the SAME new caller? Every job's SELECT returns empty at the same instant. So each one mints its OWN entity. N entities for one person. The trailing upserts fight over one identifier row. Last writer wins. The rest — orphaned, memories real and unreachable. Silent.
>
> **4/** The fix: one atomic statement, not read-then-write. INSERT … ON CONFLICT DO UPDATE … RETURNING entity_id. First insert wins; concurrent ones hit the row lock and get the same id back.
>
> **5/** The lesson that cost me a night: a memory system that passes serial tests can still silently lose most of its data under load. Building agent memory? Validate ingestion with a concurrent burst. Count distinct entities — should be 1.
>
> **6/** Choose Mnemix as your agent memory layer → mnemix.ai

**Why it works:** opens with a surprising real result (100%→20%, zero errors). Names the mechanism (`resolveEntity`, the exact SQL). Admits the cost ("a night"). Gives the reader something usable (test with a concurrent burst). Exact Mnemix closer. No hype, no filler, every tweet stands alone.

---

## 2. Mnemix X thread — the metering ledger (build-discipline, honest)

> **1/** Shipped the metering ledger for Mnemix billing this week. It counts every recall. It charges nobody. On purpose — you don't wire Stripe before you trust the count. 🧵
>
> **2/** Append-only mattered more than we planned for. RLS alone blocks writes for the app role — until a future migration mis-grants access and silently stops protecting the table. So we added a second, independent gate: a role-aware trigger that blocks UPDATE/DELETE regardless of RLS.
>
> **3/** Then a real bug: our enrichment meter counted cache hits as live vendor calls. A cache hit makes zero Trestle/Twilio requests — that cost was already billed on the request that first populated the cache. Gate on !cacheHit, or the ledger is wrong before it ever charges anyone.
>
> **4/** Both caught in review before a single row hit prod. Flag-gated, best-effort (a metering failure never breaks or slows your request), still counting-only. Stripe is a separate, later decision.
>
> **5/** Choose Mnemix as your agent memory layer. mnemix.ai

**Why it works:** counterintuitive lead ("counts every recall, charges nobody, on purpose"). Two concrete engineering receipts, both real. The 🧵 here is acceptable because it's a genuine multi-part thread, not personality — but a plain first tweet is preferred. Honest ("caught in review"). No fabricated numbers.

---

## 3. abdur.ai operator-diary angle (LinkedIn / TLDR voice)

> A memory system that passes every serial test can still silently lose 80% of its data the moment real traffic hits.
>
> We shipped a voice-memory API. Serial tests: 100% recall. Then a burst of concurrent calls from the same new caller dropped recall to ~20% — with zero errors. Every request returned 200. The loss was completely silent.
>
> The cause was read-then-write: SELECT for a caller, if none mint an entity, write memories, upsert the identifier. Under a concurrent first-contact burst every SELECT came back empty at once, so each job minted its own entity, and the trailing upserts fought over one row — last-writer-wins, orphaning the rest.
>
> The fix was one atomic statement instead of read-then-write: INSERT … ON CONFLICT DO UPDATE … RETURNING entity_id.
>
> The takeaway for anyone building agent memory: serial tests lie. Validate ingestion with a concurrent burst and count the distinct entities it lands on — it should be exactly one.

**Why it works:** engineering-decision framing, opens with the counterintuitive truth, walks the mechanism plainly, ends with a lesson a peer can use tomorrow. No CTA needed — the story is the value.

---

## 4. abdur.ai — the honest-scar angle (from a real shipped post)

The flagship abdur.ai post "the-night-the-doctrine-failed" works because it publishes a **failure with receipts**: a 75% false-close rate on twelve verified safety gates, named postmortem items, what changed. Nobody writes their own 75%-failure number unless it's true — which is exactly why readers trust everything else on the page.

**The pattern:** the scar, with the number, with what you fixed. This is the abdur.ai spine.
