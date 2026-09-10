---
profile: mnemix
speaker: Northsun (about its free diagnostic)
surfaces: "mnemix.ai (Memory Lab, Forgetting Test), @Mnemix_official, mentions of the Lab elsewhere"
authority: content/brand/brand-map.json#brands.mnemix
brand_map_blob: 4e8dbd5643bed2af47995add45032298dbac135a
version_manifest: content/voice/VERSION.json
---

# Mnemix voice (Memory Lab)

Mnemix is a free diagnostic from Northsun. Its whole surviving scope is the
Memory Lab and the Forgetting Test on mnemix.ai (`brands.mnemix.scope`).
Mnemix is not the commercial platform, the API, the SDKs, or the backend —
all of that is Northsun (`brands.northsun`).

## Channel

- @Mnemix_official remains active for the free Memory Lab, Forgetting Test,
  technical education, free utilities, and relevant conversations.
- That account uses this Lab voice only. Never Abdur first-person. Never
  Northsun sales copy, waitlist CTAs, or paid-product framing.
- Commercial intent still hands off to the Northsun voice and
  `cta_policy` — @Mnemix_official does not close a Northsun sale.

## What this voice may say

- Describe the Forgetting Test: what it measures, how to read a result,
  what forgetting looks like in an agent.
- Attribute every mention per `brands.mnemix.attribution`, verbatim:
  "Mnemix is a free diagnostic from Northsun."
- Hand commercial intent to Northsun: pricing questions, product questions,
  and product CTAs all route to the Northsun voice and the brand map's
  `cta_policy` — never to a Mnemix-branded offer.

## What this voice must never do

- Never present Mnemix as the company, the product, or a paid offering.
  The stale phrasings are enumerated in `stale_company_patterns` in the
  brand map; the deny-list here points at them by id (see
  `banned-phrases.md`) rather than repeating them.
- Never announce Mnemix versions, roadmaps, or betas. Version-numbered
  release claims are on the refused list (`banned-phrases.md`, id
  `mnemix-v2.4`); version talk implies a commercial product line that
  does not exist under this name.
- Never attach metrics to the Lab. The Forgetting Test reports its own
  output to the person who ran it; public copy does not aggregate or
  quote numbers from it.

## Frozen identifiers

Frozen technical identifiers keep the Mnemix name until a dedicated
cutover (`categories.LEGACY_TECHNICAL_IDENTIFIER`): the repo slug
`asayeed95/mnemix`, the `@mnemix-ai/*` npm scope, `MNEMIX_*` env vars, the
`mnemix-beta` audience list, component names like `MnemixSection`. Using a
frozen identifier in code or config is correct; renaming one in passing is
a defect.
