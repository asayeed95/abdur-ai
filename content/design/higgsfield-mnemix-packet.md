# Higgsfield Design-Learning Packet — Mnemix

**System:** Signal Noir
**Scope:** every Higgsfield-generated still or motion asset for Mnemix (IG/FB, X, LinkedIn, YouTube thumbnails/shorts, docs/site hero art).
**Not in scope:** the abdur.ai personal-brand packet (separate visual DNA — don't cross-pollinate).

This packet exists so any agent (or Abdur) can generate an on-brand Mnemix visual without re-deriving the design system or re-checking the public-truth locks from scratch. Read the locks section first — it's a hard gate, not context.

---

## 0. Mnemix locks — the gate every visual passes through

Reproduced here because a visual that violates these is worse than no visual. Before generating or shipping anything:

- Mnemix is the **memory + enrichment layer for AI agents**. Voice is the wedge, not the identity. We do not build agents — never depict Mnemix "talking" as a voice assistant character or chatbot avatar.
- Enrichment vendors in any visual copy: **Trestle + Twilio Lookup only.** No other data-provider names or logos.
- Latency: only ever "**designed for sub-300ms voice recall**." Never render a specific number (no "247ms," no "10x faster," no invented benchmark chart, no comparison bar graph against named competitors).
- Pricing: **Hobby $0**, paid tiers **"Contact sales."** Never put a $ figure, quota number, or "starting at" price in a visual.
- Closer line, verbatim when a closer appears in-frame: **"Choose Mnemix as your agent memory layer."** Plus `mnemix.ai`.
- No fake customers, logos, testimonials, star ratings, "trusted by X companies," or fabricated dashboards with invented metrics.
- Public v1 surface only if an endpoint/route is shown on-screen: `POST /v1/recall_and_enrich`, `POST /v1/calls/end`, `GET /v1/caller/{phone_number}`. Never render internal/legacy route names.

If a prompt or a generated frame would put an unverified number, name, or claim on screen, cut it or make it structural/abstract instead (a ledger schema, a state-machine diagram, a code diff — not a stat).

---

## 1. Visual DNA — Signal Noir

### 1.1 Palette

| Token | Hex | Role |
|---|---|---|
| Void | `#09090b` | Base canvas. Near-black, not pure black — everything sits on this. |
| Cyan | `#22d3ee` | Primary signal color. Rest-state glow, primary UI accents, link/action color. |
| Violet | `#c9a8ff` | Peak/conscious-state color. Reserve for the moment something "activates" — a recall firing, a gate passing, a hub lighting up. This is the exact `colorPeak` value in the production NeuralSphere component (`web/src/components/NeuralSphere.jsx`) — it's not a mood choice, it's the literal awaken-state color the product renders. Using it elsewhere dilutes the signal. |
| Rose | `#fb7185` | Alert/failure accent only. Race conditions, dropped recall, gate rejection, "this broke." Never used decoratively. |
| Ink/fog | near-black with low-alpha cyan/violet | Background gradients, depth — never a saturated color field. |

Rule: three accent colors, three jobs. Cyan = normal operation. Violet = the exact instant of activation/recall/success. Rose = failure/incident. Don't reassign these.

### 1.2 Typography

- **Geist Mono** — code, schema fields, route paths, terminal output, timestamps, any "this is real system output" text.
- **Manrope** — headlines, captions, human-readable copy layered over the visual.
- Never mix in a third display font. Never use a rounded/friendly sans for anything technical — the mono typeface *is* the credibility signal.

### 1.3 The motif: NeuralSphere ("Living Brain")

This is Mnemix's one recurring visual organism — grounded in the actual shipped React/Three.js component, not an invented metaphor:

- **Structure**: nodes placed on a Fibonacci sphere (not a random cloud — a deliberate, even distribution). A subset are "hub" nodes with more connections. Great-circle arcs connect hubs; thinner edges connect regular nodes.
- **Five-phase cycle** (~10s default loop): `rest` (dim ghost-mesh, low opacity, slow drift) → `awaken` (eased brighten, cyan → violet) → `conscious` (peak brightness, violet, hubs fully lit, signal pulses race along "highway" edges) → `return` (eases back down) → `rest-after` (back to dim ghost). This is a breathing organism, not a static logo.
- **Color behavior**: rest state = cyan (`colorRest`), peak/conscious state = violet (`colorPeak`) — exactly the palette above. Bloom/glow post-processing on the lit edges and hub nodes; background is transparent/void.
- **Variants**: `hero` (dense, ~800 nodes, big), `logo` (medium, ~380 nodes, compact), `loader` (sparse, ~220 nodes, small/looping) — pick density by frame size, not arbitrarily.
- **What it represents**: a memory graph at rest vs. a memory graph mid-recall. When a prompt needs to visualize "the system remembering something," this is the visual — not a brain illustration, not a lightbulb, not a generic circuit board.

### 1.4 Composition rules

- Dark canvas always. No white/light backgrounds, no pastel gradients, no "SaaS-friendly" soft illustration style.
- Thin glowing lines, particle/node fields, terminal windows, code diffs, timeline/state-machine diagrams, ledger tables — these are the vocabulary. Not stock photography, not generic "AI orb" clip art, not human faces (Mnemix has no spokesperson persona and no Soul ID trained — don't improvise one).
- Depth via glow/bloom and thin-line perspective, not skeuomorphic 3D render or glassmorphism cliché.
- Every frame should look like it could be a screenshot from a real engineering tool (terminal, observability dashboard, architecture diagram) rendered with taste — not like marketing art pretending to be technical.

---

## 2. Content-angle → visual rule

Every Mnemix visual serves one of these angles. If a generated image doesn't map cleanly to one, don't ship it — genericness is the failure mode Signal Noir exists to prevent.

| Angle | What it visualizes |
|---|---|
| Agent memory failures | The gap: an agent that forgot, a recall returning empty, a broken context handoff |
| Race conditions | Two writes colliding — concurrent paths converging on one record, only one surviving |
| Recall collapse | A memory graph that should light up staying dim — the failure state of the NeuralSphere motif |
| Evidence refs | The provenance chain — a claim linked back to its source record, not just asserted |
| Audit trails | A ledger — append-only, timestamped, inspectable |
| Bi-temporal memory | Two time axes at once — when something was *true* vs. when the system *learned* it (tstzrange, not a single timestamp) |
| Build discipline | The gate itself — a check that blocks a bad change before it ships |
| Real demos | An actual call/request-response, endpoint and payload visible, not a mockup |

---

## 3. Model routing (Higgsfield MCP/CLI — verified model IDs)

Per `~/projects/CREATIVE_STACK.md` (read that first for the full routing table). Mnemix-specific defaults:

| Need | Model | Notes |
|---|---|---|
| Hero still w/ text overlay (carousel cover, X card) | `nano_banana_2` (Nano Banana Pro) | Best instruction-following for on-image text/labels |
| Volume stills / variants | `nano_banana_flash` (Nano Banana 2) | Unlimited on current bundle; use for drafts and A/B variants |
| Daily-volume motion (NeuralSphere loops, short cuts) | `kling3_0` | Unlimited via **web app only** — CLI/API still charges credits, budget accordingly |
| Premium hero motion w/ native audio | `veo3_1` (or Gemini Ultra Veo 3.1 web, zero Higgsfield credits — route there first) | Reserve for launch-grade pieces |
| Upscale finals | `bytedance_image_upscale` | 4096px per-pass ceiling; needs input width/height |

No human characters, no Soul ID — Mnemix has none trained and none planned. Skip anything in the stack that's about faces/UGC/lifestyle (Marketing Studio talking-heads, Recast, Speak) — that vocabulary belongs to product brands like GlowFuel, not Mnemix.

---

## 4. Prompt recipes by surface

Each recipe below is labeled with the content angle it serves. Every prompt is written to produce a frame that would pass the QA checklist in §6 — no invented numbers, no fake logos, no route names outside the public v1 surface.

### 4.1 IG/FB carousel

**Format:** 1080×1350 (4:5), first slide = cover with headline space (Manrope, top or bottom third), subsequent slides = supporting diagram frames in the same palette.

**#1 — Angle: Recall collapse (carousel cover)**
```
Model: nano_banana_2
Aspect: 4:5 (1080x1350)
Prompt: Near-black void background #09090b. A Fibonacci-sphere neural mesh,
dim ghost-state, cyan #22d3ee nodes at 15% opacity, mostly dark — the sphere
is NOT lit up. One thin broken edge where a connection should be, rendered
in rose #fb7185, subtly pulsing. Empty space in the upper third for a
headline in Manrope. Geist Mono micro-label bottom-left reading
"recall: empty". Cinematic dark, soft bloom only on the rose fracture point,
no other light sources. No text baked in beyond the micro-label.
Negative: no human faces, no stock photo, no bright background, no
competitor names, no fake numbers, no lightbulb/brain-illustration cliché.
```

**#2 — Angle: Bi-temporal memory (carousel interior slide)**
```
Model: nano_banana_2
Aspect: 4:5 (1080x1350)
Prompt: Near-black #09090b canvas, Geist Mono throughout. Two parallel
horizontal timelines rendered as thin glowing lines — top line labeled
"valid_time" in cyan #22d3ee, bottom line labeled "system_time" in violet
#c9a8ff — with a handful of small node markers on each axis connected by
thin diagonal threads where the two axes diverge (a fact recorded later
than when it became true). No calendar dates, no invented timestamps beyond
generic tick marks. Clean technical-diagram aesthetic, like a well-designed
architecture doc figure, not decorative art. Subtle bloom on the two axis
lines only.
Negative: no fake numbers, no company logos, no 3D skeuomorphism, no
gradients outside the locked palette.
```

**#3 — Angle: Audit trails (carousel interior slide)**
```
Model: nano_banana_2
Aspect: 4:5 (1080x1350)
Prompt: Near-black #09090b background. A vertical append-only ledger
rendered as a stack of thin glowing rows in Geist Mono, each row showing
generic field placeholders (evidence_ref id, timestamp, actor) in
low-opacity cyan #22d3ee text — the bottom-most row (most recent) glows
brighter in violet #c9a8ff, as if just appended, with a faint upward light
trail. Rows above fade to dim cyan/gray. Terminal-window framing, thin
1px border, no drop shadows. Feels like a real audit-log screenshot, not
an illustration.
Negative: no real/specific data values, no fabricated customer names, no
bright UI chrome, no glassmorphism.
```

### 4.2 X (Twitter) images

**Format:** 1600×900 (16:9) or 1200×1200 (1:1) for reply-thread inline images — dense information, reads well small.

**#4 — Angle: Race conditions (X image, standalone or thread header)**
```
Model: nano_banana_2
Aspect: 16:9 (1600x900)
Prompt: Near-black #09090b canvas. Two thin cyan #22d3ee lines converge
from left toward a single point on the right, representing two concurrent
writes racing toward one record. At the convergence point, one line
continues in violet #c9a8ff (the write that won, atomically) and the other
terminates abruptly in rose #fb7185 with a small fracture mark (the write
that lost). Geist Mono micro-labels: "writer A", "writer B" near the line
origins, no other text. Minimal, diagram-like, high contrast, generous
negative space — built to be legible as a small thumbnail in a timeline.
Negative: no invented percentages, no "before/after" stat callouts, no
stock icons, no bright background.
```

**#5 — Angle: Build discipline (X image, "here's the gate" post)**
```
Model: nano_banana_2
Aspect: 1:1 (1200x1200)
Prompt: Near-black #09090b terminal-window frame, thin 1px cyan-tinted
border, Geist Mono monospace text rendered as a real terminal transcript:
a command line, then a short check-style output with one line in violet
#c9a8ff reading a pass-state check mark and one line in rose #fb7185
reading a fail-state block mark above it (showing the gate catching
something before the pass). Scanline-subtle CRT glow, no other decoration.
Feels like an actual terminal screenshot, not stylized text art.
Negative: no invented tool names outside generic CI language, no fake
percentages, no company logos, no drop shadows or glassmorphism.
```

### 4.3 Motion / NeuralSphere animation

**Format:** 9:16 vertical for Reels/Shorts/TikTok-style cuts, 16:9 for X/LinkedIn native video and YouTube thumbnails-with-motion.

**#6 — Angle: Real demos (motion clip syncing to an actual request/response)**
```
Model: kling3_0 (draft/volume) → veo3_1 or Gemini Ultra Veo 3.1 web (hero final)
Aspect: 9:16 vertical, 6-8s loopable
Prompt: Start on the NeuralSphere in its dim rest state — cyan #22d3ee
ghost-mesh on void #09090b, slow ambient drift, low opacity. A single thin
line of Geist Mono text fades in at the bottom edge reading a generic
request line (POST /v1/recall_and_enrich) — no fabricated payload values.
As the text line completes, the sphere eases through its awaken phase:
brightness rises, color shifts cyan toward violet #c9a8ff, hub nodes light,
thin arcs pulse signal trails along the great-circle edges toward the
center. Hold at peak violet "conscious" brightness for one beat, then ease
back down to the dim rest state as the text line fades out. Smooth eased
motion (not linear), soft bloom on lit edges only, transparent-feeling
void background throughout.
Negative: no invented latency number on screen, no fake payload JSON with
made-up customer data, no human presence, no upbeat stock-music cues
implied by the visual (music sourced separately, keep this clinical/calm).
```

**#7 — Angle: Recall collapse (motion — the failure-state counterpart to #6)**
```
Model: kling3_0
Aspect: 9:16 or 1:1, 4-6s loop
Prompt: NeuralSphere in dim rest state, cyan #22d3ee ghost-mesh, void
#09090b background. The same request-line text fades in as in the
successful-recall clip, but this time the sphere does NOT awaken — instead
one hub node flickers briefly in rose #fb7185 and a single thin edge
fractures with a small spark, then the whole mesh dims further and drifts,
unresolved. No violet peak state reached at all. Slow, uneasy pacing —
noticeably slower and less triumphant than the successful-recall loop, so
the two read as clear opposites when placed side by side.
Negative: no dramatic explosion/glitch-art VFX, no invented error codes,
no red alert siren imagery — the failure should read as an absence
(nothing happened) not a catastrophe.
```

**#8 — Angle: Evidence refs / provenance (motion, short cut for a thread or reel B-roll)**
```
Model: kling3_0
Aspect: 16:9, 5-7s loop
Prompt: Near-black #09090b canvas. A single glowing node in violet
#c9a8ff (a claim/fact) sits center-frame with a thin cyan #22d3ee line
extending backward to a smaller node labeled generically "source" in
Geist Mono — the line stays lit and traceable the entire time, never
breaking. Camera holds mostly static with a very slow, subtle push-in.
The emphasis is the unbroken line itself: the point being made visually
is "this claim always traces back," so the line must read as continuous
and inspectable, not decorative.
Negative: no invented source names, no fabricated citation text, no fast
cuts, no glitch effects.
```

---

## 5. Text-overlay / caption voice (when a visual carries copy)

Reuses the Mnemix voice contract — a visual's on-screen text or accompanying caption is held to the same bar as any post:

- Sound like Abdur: direct, specific, technical when it matters, never robotic SaaS voice, never hype.
- Banned on any overlay or caption: *game-changer, revolutionary, cutting-edge, "the future of," "X will change everything," world-class, best-in-class, supercharge, unlock, unleash, empower, seamless, frictionless, disrupt, paradigm shift, "let's dive in," "here's the thing," "grateful/excited/thrilled to announce," "move the needle," leverage (as a verb), utilize, "blazing fast," "trusted by thousands," "studies show," "buckle up," "stop scrolling,"* fake thread-bait framing.
- Every line of on-image copy must trace to real work — a repo change, a bug, a decision, a demo, a doc. If a caption could sit under any generic SaaS graphic, the visual failed its job — rewrite it specific to this system.

---

## 6. QA checklist — run before shipping any generated Mnemix visual

1. Does it violate any Mnemix lock in §0 (invented latency number, fabricated price, fake customer, wrong enrichment vendor, "we build agents" framing, non-public route name)?
2. Does it use only the locked palette (§1.1) with correct color *jobs* (cyan=normal, violet=peak/activation, rose=failure only)?
3. Is the typeface pairing correct (Geist Mono for system/technical text, Manrope for headline/caption)?
4. If the NeuralSphere motif appears, does its state (rest/awaken/conscious/failure) match the content angle it's illustrating?
5. Does it map to exactly one content angle from §2 — memory failures, race conditions, recall collapse, evidence refs, audit trails, bi-temporal memory, build discipline, or real demos?
6. Is it free of stock-photo/generic-AI-art tells (brain illustrations, lightbulbs, glassmorphism dashboards, human faces, handshake/team-photo clichés)?
7. Would this frame survive being asked "what specific, real thing does this visual point to?" — if the honest answer is "nothing, it's just vibes," don't ship it.
8. Asset banked per the Creative Stack rule — generated assets that only live in Higgsfield's CDN expire from working memory; save finals into `docs/content/design/` (or the relevant channel-variant path) once selected.

---

## 7. Quick reference — palette + type as copy-paste tokens

```
--void:   #09090b
--cyan:   #22d3ee   /* rest / normal operation */
--violet: #c9a8ff   /* peak / activation / success */
--rose:   #fb7185   /* alert / failure — never decorative */

font-mono: "Geist Mono"     /* code, schema, terminal, timestamps */
font-sans: "Manrope"        /* headlines, human-readable copy */
```
