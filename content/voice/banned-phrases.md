# Banned phrases — the kill list

Any draft containing these gets rewritten before it moves past DRAFT. This list is **grep-able on purpose** — the approval workflow lints drafts against the machine-checkable block at the bottom. If a banned phrase is genuinely the right word in a rare case, a human overrides at approval; agents never self-exempt.

**Lint scope:** the machine block is a hard gate on **shipping copy** — everything in `drafts/`, `approved/`, `posts/_drafts/`, captions, and any text overlaid on a visual. Internal docs (briefs, templates, workflow specs) should stay clean too, but a technical term there (e.g. a video "loop seam" spec) is a reword-on-sight, not a blocker.

## Hype words (the SaaS-bot tells)
- game-changer / game-changing
- revolutionary / revolutionize
- cutting-edge / bleeding-edge / next-generation / next-gen
- the future of / the future is
- "AI will change everything" and all "X will change everything" filler
- world-class / best-in-class / industry-leading / world's first (unless literally, provably true)
- supercharge / turbocharge
- unlock / unleash / empower / elevate
- seamless / seamlessly / frictionless / effortless
- transformative / disrupt / disruptive / paradigm shift
- magical / magic (as product描述)
- delight / delightful (as SaaS filler)

## Empty connective tissue
- "Let's dive in" / "Let's break it down" / "Let me explain why"
- "Here's the thing" / "Here's why 👇" / "Here's what nobody tells you"
- "In today's fast-paced world"
- "It's no secret that…"
- "Buckle up"
- "STOP scrolling" / "You need to see this"
- "grateful to announce" / "excited to share" / "thrilled to announce"
- "small win but" / "humbled to"
- "at the end of the day"
- "needle-moving" / "move the needle"
- "leverage" (as a verb) / "utilize" (just say "use")

## Fake-thread / engagement-bait patterns
- "🧵" or "(a thread)" used as personality rather than a plain thread
- "Read till the end"
- "Retweet if you agree" / "Like if…"
- "Comment 'X' and I'll DM you"
- numbered "1/ Why this matters" openers that don't open with a real fact

## Vague-claim patterns (require a source or they're cut)
- "significantly improved" / "dramatically faster" — give the number
- "blazing fast" / "lightning fast" — give the number
- "trusted by thousands" / "everyone is talking about" — name the receipt or cut it
- "studies show" / "research proves" — link it or cut it
- any latency/benchmark/user-count figure with no command, screenshot, or repo line behind it

## Mnemix-specific forbidden (positioning locks)
- any enrichment vendor other than **Trestle** or **Twilio Lookup**
- any specific sub-300ms latency **number** (only "designed for sub-300ms voice recall")
- any Mnemix **paid price or quota** (paid = "contact sales")
- any fabricated customer, compliance cert, benchmark, or integration
- calling Mnemix an "agent" product (it's the memory + enrichment layer; customers build agents)

---

## MACHINE-CHECK BLOCK (lint drafts against these, case-insensitive)
```
game-chang
revolutionary
revolutionize
cutting-edge
bleeding-edge
next-generation
the future of
will change everything
world-class
best-in-class
industry-leading
supercharge
turbocharge
unlock the
unleash
empower
seamless
frictionless
effortless
paradigm shift
disrupt
let's dive in
let's break it down
here's the thing
here's why 👇
grateful to announce
excited to share
thrilled to announce
move the needle
leverage
utilize
blazing fast
lightning fast
trusted by thousands
studies show
buckle up
stop scrolling
```
