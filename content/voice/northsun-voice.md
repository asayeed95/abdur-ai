---
profile: northsun
speaker: Northsun (the company)
surfaces: "@northsunai, product copy on abdur.ai, llms.txt, any Northsun-branded surface"
authority: content/brand/brand-map.json#brands.northsun
brand_map_blob: 4e8dbd5643bed2af47995add45032298dbac135a
version_manifest: content/voice/VERSION.json
---

# Northsun voice

Northsun is the company and the commercial platform: product, API, SDKs,
backend. Company copy speaks as the company — calm, specific, and bounded by
what has actually been ratified.

Identity line, verbatim and only verbatim:

> Northsun is the memory and enrichment layer for AI agents.

Closer, verbatim and only verbatim:

> Choose Northsun as your agent memory layer.

## Channel

- @northsunai is company voice only. Never Abdur first-person there — no "I",
  no personal logbook material, no founder-diary framing. First-person Abdur
  copy belongs to `abdur-voice.md` on abdur.ai.
- Company posts carry facts from the brand map or they do not ship.

## Allowed claims (authority pointers)

Every allowed public value resolves from `content/brand/brand-map.json`;
this file points, it does not fork:

- Identity: `brands.northsun.identity` — "the memory and enrichment layer
  for AI agents". Any paraphrase of the identity line is a defect.
- Closer: `brands.northsun.closer`. Nothing else closes a piece.
- Pricing vocabulary: `brands.northsun.public_pricing` — "Hobby $0" and
  "Contact sales" only. No other price may appear in public copy.
- Latency: the single ratified hedge, kept on one line always, is
  "designed for sub-300ms voice recall" (`claims_policy.ALLOWED_LATENCY`).
  No measured numbers.
- The Memory Lab: attribute per `brands.mnemix.attribution` — Mnemix is
  a free diagnostic from Northsun.

## CTA law

- The canonical product reference is https://northsun.ai (`brands.northsun.url`),
  kept as a reference only. The northsun.ai DNS is not live, so it is never
  written as a call to action, a link caption, or an onboarding step.
- Product CTAs point at the owned waitlist surface: `cta_policy.cta_href`
  (/#waitlist), backed by `cta_policy.backend_route` (/api/subscribe) with
  the frozen `cta_policy.list_id` (mnemix-beta) audience list.
- Invite waitlist or beta access; never promise product access now.

## Refusals

- Benchmarks, named customers, integrations, compliance badges, and any
  metric on the refused list (`banned-phrases.md`) do not appear in company
  copy until the founder ratifies them with evidence.
- Customers build agents; Northsun does not build agents. Copy describes the
  memory layer under the customer's agent, never the agent itself.
