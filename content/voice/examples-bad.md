# Bad examples — the slop to never ship

Each of these is the *wrong* version of content we could actually post. The point is to recognize the failure mode instantly.

---

## Bad 1 — hype with no receipt

> 🚀 We're revolutionizing AI agent memory! Mnemix is a game-changing, world-class solution that empowers developers to build seamless voice experiences. The future of AI is here. ⚡ Unlock the power of memory today! 🧵👇

**Why it's garbage:** every word is a banned hype term. Zero specifics, zero source, zero mechanism. Could describe literally any product. "revolutionizing / game-changing / world-class / empowers / seamless / the future of / unlock the power" — a full house of the kill list. A hostile reader learns nothing and trusts nothing. Delete on sight.

**The fix:** show one real thing (a bug you fixed, a decision you made) with the number and the mechanism. See `examples-good.md` #1.

---

## Bad 2 — vague-claim SaaS voice

> At Mnemix, we're passionate about helping teams unlock blazing-fast, best-in-class memory for their AI agents. Our cutting-edge platform is trusted by thousands and delivers dramatically improved performance. Let's dive in! 👇

**Why it's garbage:** "blazing-fast / best-in-class / cutting-edge / trusted by thousands / dramatically improved / let's dive in" — banned. "trusted by thousands" is also a **fabricated claim** (we can't name the receipt) which violates the truth rule outright. "dramatically improved performance" with no number is meaningless.

**The fix:** one specific latency behavior with the honest framing ("designed for sub-300ms voice recall"), or a real design decision. Never a user-count you can't prove.

---

## Bad 3 — engagement-bait thread

> STOP scrolling. 🛑 This will change how you think about databases forever. A thread on what nobody tells you about Postgres 🧵 Buckle up. (1/17) Read till the end and retweet if you learn something.

**Why it's garbage:** "STOP scrolling / change how you think forever / what nobody tells you / buckle up / read till the end / retweet if" — pure engagement-bait, the exact thread-bro template the voice forbids. It promises everything and says nothing. 17 tweets of padding almost always follows.

**The fix:** open tweet 1 with the actual surprising fact. If the fact is good, no bait is needed. See `examples-good.md` #2.

---

## Bad 4 — fake-humble announcement

> Humbled and grateful to announce that we've shipped a small update to our metering system 🙏 Excited to share this journey with you all! Big things coming. Stay tuned! 🚀

**Why it's garbage:** "humbled and grateful to announce / excited to share / big things coming / stay tuned" — all banned. It announces a *feeling*, not a *fact*. There's real, interesting engineering in that metering ledger (the double-gate, the cache-hit bug) and this version throws all of it away for LinkedIn-influencer noise.

**The fix:** lead with the actual engineering decision ("It counts every recall. It charges nobody. On purpose."). See `examples-good.md` #2.

---

## Bad 5 — technically-real but robotic

> Mnemix leverages a role-aware trigger to ensure append-only integrity, enabling us to deliver a robust, scalable solution that empowers seamless auditability across the platform.

**Why it's garbage:** the underlying fact is real (role-aware trigger, append-only) but it's buried in "leverages / ensure / enabling / robust, scalable solution / empowers seamless." It reads like a compliance brochure. A builder's eyes glaze.

**The fix:** say it like a person. "RLS alone wasn't enough — if a future migration mis-grants write access, the table silently stops protecting itself. So we added a second gate: a trigger that blocks UPDATE/DELETE regardless of RLS." Same fact, human.

---

## The one-line diagnostic

If you can swap the product name for any other SaaS and the post still "works," it's slop. Real content only works for *this* product because it's about *this* specific work.
