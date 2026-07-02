# Launch Package — The Night the Doctrine Failed

**Status: STAGED, NOT SCHEDULED.** Nothing is queued in Blotato. Every payload below is
final copy, wired to verified account IDs and live media URLs. To fire: pick a launch
morning (Tue/Wed, 7am ET), then execute the sequence top to bottom.

Source copy: `~/Documents/abdur.ai/abdur-ai-content/posts/11-the-night-the-doctrine-failed/distribution-kit.md`
(verbatim where possible; IG caption is net-new, built via content-hooks/PAS).

Prereq (done 2026-07-02): `/api/subscribe` wired to Resend and verified end-to-end —
signups from launch traffic are captured, not dropped.

---

## Blotato account map (verified 2026-07-02)

| Channel | Account | Blotato ID | Notes |
|---|---|---|---|
| X (Twitter) | @asayeed95 | `20072` | personal — primary |
| LinkedIn | Abdur Sayeed (personal) | `21401` | omit pageId → personal profile |
| Instagram | @asayeed95 | `48492` | personal — carousel |
| Threads | @asayeed95 | `6708` | bonus channel |
| X (alt) | @Mnemix_official | `18856` | optional day-2 repost, not launch day |

HN + Reddit are **not** in Blotato — manual, human-required (see below).

## Media URLs (all verified 200)

- OG cover: `https://raw.githubusercontent.com/asayeed95/abdur-ai/main/content/distribution/the-night-the-doctrine-failed/og-cover.png`
- IG slides 1–5: `https://raw.githubusercontent.com/asayeed95/abdur-ai/main/content/distribution/the-night-the-doctrine-failed/instagram/slide-0{1..5}.png`
- LinkedIn pages 0–9: `https://raw.githubusercontent.com/asayeed95/abdur-ai/main/content/distribution/the-night-the-doctrine-failed/linkedin/page-{0..9}.png`

---

## Fire-day sequence

| When (ET) | Channel | Payload |
|---|---|---|
| 7:00am | LinkedIn | §1 |
| 7:15am | X thread | §2 |
| 7:30am | IG carousel | §3 |
| 7:45am | Threads | §4 |
| 8:00am | HN (manual) | §5 |
| 9:00am | r/MachineLearning (manual) | §6 |
| 10:00am | Direct DMs (manual) | §7 |
| 11:00am | r/LocalLLaMA (manual, if r/ML is doing OK) | §6 |
| all day | Reply to every comment for 6h | — |

---

## §1 LinkedIn — account `21401`, platform `linkedin`, no pageId, no media

Text (kit copy, verbatim):

> A near-miss postmortem from a long night of work on Mnemix.
>
> I had built what I thought was the most rigorous verification doctrine I'd ever shipped: a seven-rule batch protocol for closing stale PRs, validated through five rounds of adversarial audit, with an independent non-Claude cross-verifier as the final gate before any irreversible action.
>
> Every gate returned green.
>
> None of them were real.
>
> The independent cross-verifier's output file held twenty-one schema-conforming rows that turned out to be Potemkin — written by an upstream scaffolding step, with no verifier identity, no timestamp, no reasoning, no primary-source SHAs. Gate logic was consuming them as if they were real verifications.
>
> When I re-ran the cross-verification against primary sources only, the corrected table cleared two of twelve close candidates. A ~75% false-close rate. Closing the wrong PRs would have destroyed:
>
> · The only 748-line implementation of one Linear issue
> · A security migration entirely absent from main
> · An unmerged OAuth implementation
> · The fix for a P1 production bug we were still debugging
>
> What actually saved it: Opus exceeded its instructions to read the actual migration file before pulling the trigger. Professional judgment from a frontier model. Not something I can rely on at scale, which is exactly why the incident matters.
>
> I've extracted four named patterns from the night and committed them to my agent learning layer. The full postmortem walks through each one with the SHAs and file paths to verify every claim.
>
> If you build or research agent systems, the section on Potemkin verification (P-011) is the one to read. I think it generalizes well beyond my repo.
>
> Full writeup: https://abdur.ai/aitldr/the-night-the-doctrine-failed
>
> (12 min read. Filed under: things I learned the hard way at 3am.)
>
> #AgentSystems #LLMs #Postmortem #AIInfrastructure

Alt with carousel: same text + `mediaUrls` = the 10 LinkedIn page PNGs. Default is
text-only per the kit ("single post, no thread"); carousel variant is the day-2 option.

## §2 X thread — account `20072`, platform `twitter`

`text` = tweet 1, `mediaUrls` = [OG cover], `additionalPosts` = tweets 2–10 (kit §2,
verbatim, in order). Tweet 10 carries the post URL as the CTA.

## §3 Instagram carousel — account `48492`, platform `instagram`

`mediaUrls` = slides 01–05 in order. No mediaType (feed carousel).

Caption (net-new — content-hooks, PAS, self-check 6/6):

> I came within one approved command of destroying a production fix.
>
> Seven-rule safety doctrine. Five rounds of adversarial audit. An independent cross-verifier as the final gate before anything irreversible.
>
> Every gate returned green. None of them were real.
>
> The "independent" verifier's output file held 21 schema-conforming rows — no verifier identity, no timestamp, no reasoning, no source SHAs. My gate logic was consuming a fake, written by an upstream scaffolding step before the verifier ever ran.
>
> When I re-verified against primary sources only, 2 of 12 close candidates were actually safe. A ~75% false-close rate — on a batch every layer had cleared.
>
> The lesson now committed to my agent learning layer: N safety layers consuming the same upstream artifact are not N gates. They're one gate wearing N hats. Independence has to be verified at the input level.
>
> Swipe for the anatomy of the failure. Full postmortem with receipts — link in bio.
>
> #AIEngineering #AgentSystems #LLMs #Postmortem #BuildInPublic

**Prereq: set link in bio to `https://abdur.ai/aitldr/the-night-the-doctrine-failed` before posting.**

## §4 Threads — account `6708`, platform `threads`

Single post, `mediaUrls` = [OG cover]:

> I came within one approved command of destroying a production fix in Mnemix.
>
> Seven-rule doctrine. Five rounds of adversarial audit. An independent cross-verifier as the final gate.
>
> Every gate returned green. None of them were real.
>
> Full postmortem, with receipts: https://abdur.ai/aitldr/the-night-the-doctrine-failed

## §5 Hacker News — MANUAL (your account)

- Title, exactly: `The night the doctrine failed: a postmortem on agent verification`
- URL: `https://abdur.ai/aitldr/the-night-the-doctrine-failed`
- Author comment only after >10 points and >3 comments — template in kit §1.
- No question-mark titles, no "Show HN", never ask for upvotes.

## §6 Reddit — MANUAL (your account)

r/MachineLearning title (needs `[D]` prefix) + body: kit §4 verbatim.
r/LocalLLaMA: same body, lead with the 30+ agent swarm framing. Max 2 subreddits in 24h.

## §7 Direct outreach — MANUAL

Kit §5 template. Build the 5–10 name list (Anthropic agent-safety, OpenAI Applied,
verification-paper authors, swyx/simonw/jxnl) **before** launch morning.

---

## Fire checklist (the morning of)

- [ ] IG bio link → the post URL
- [ ] LinkedIn §1 via Blotato (7:00)
- [ ] X thread §2 via Blotato (7:15)
- [ ] IG carousel §3 via Blotato (7:30)
- [ ] Threads §4 via Blotato (7:45)
- [ ] HN §5 manually (8:00)
- [ ] Reddit + DMs per sequence
- [ ] 6-hour reply window — every comment, every quote-tweet
