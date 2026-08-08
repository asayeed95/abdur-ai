---
project: abdur-ai
channel: x
account: "@abdur_sayeed"
source: "mnemix PR #527 / AGE-562 — found and fixed a live DEC-PUBLIC-CLAIMS violation this session (docs/state/birthday-sprint/04-concierge-outreach-pack.md); originally surfaced by unknown-hunt round 1 finding F20 (2026-08-03), still unfixed a month later when re-verified 2026-08-08"
angle: "found a live false-claim violation in send-ready outreach copy a month after the underlying strike decision; fixed the copy, didn't invent a replacement claim, and named the real structural gap (claims checker only scans one glob in one repo)"
status: draft
---

## X thread (5 tweets, all weighted ≤280 — verified: 270/202/246/197/176)

1/ Found a real governance bug today: outreach copy claiming I'd been dogfooding Mnemix in a different one of my own products, sent within the last month. That product was struck from every Mnemix public surface weeks earlier. Zero code ties them. The claim was just false.

2/ Not malice — a coverage gap. Our claims checker only scans one directory, non-recursively, in one repo. This file lived somewhere else entirely. Two blind spots stacked and nobody caught it for a month.

3/ Also found, while I was in there: there's currently no verified example anywhere in the portfolio of the thing that claim described. No real, live dogfooding story exists yet. The one that would've been honest hasn't been touched in three months.

4/ Fixed the copy today. Didn't invent a replacement claim to fill the gap — that's just a different version of the same lie. Left the true part standing: the API is live in production. That's enough.

5/ The actual lesson: a claims checker watching one glob in one repo isn't a claims checker, it's a false sense of one. Filed the structural fix separately — this was the easy 5%.

## Pre-flight
- [x] weighted char counts verified ≤280 on all 5 tweets
- [x] dedup checked vs ledger — no collision (a founder-vetoed "Baylio built on Mnemix" post exists in rejected.jsonl, different angle: that was a promotional claim caught pre-publish; this is a retrospective governance-fix story)
- [x] the struck project is NOT named — "parked verticals get zero public mention" has no carve-out for explaining a fix, so the post tells the true story generically
- [x] no DEC-PUBLIC-CLAIMS locked-language used (no latency number, no vendor name, no price, no customer) — this is process/governance content, not a product claim
- [x] no CTA — per established abdur.ai voice, the story carries it
- [ ] founder APPROVE / EDIT / SKIP
