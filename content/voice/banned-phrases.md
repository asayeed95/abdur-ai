---
profile: banned-phrases
purpose: deny-list; nothing in this file is ever allowed in public copy
authority: content/brand/brand-map.json#stale_company_patterns
brand_map_blob: 4e8dbd5643bed2af47995add45032298dbac135a
version_manifest: content/voice/VERSION.json
---

# Banned phrases and refused claims

Everything below is refused. Presence on this list is the reason a runtime
rejects a draft; absence from this list proves nothing (the mechanical
classifier in `content/workflows/claims_policy.py` still runs).

## Refused claims (verbatim, unratified — never publish)

| id | refused claim |
| --- | --- |
| mnemix-v2.4 | Mnemix v2.4 (any Mnemix version-release claim) |
| latency-420-18 | 420ms → 18ms (and either number alone as a latency claim: 420ms, 18ms) |
| streams-100k | 100,000 concurrent streams (also unformatted: 100000 concurrent streams) |
| memory-64pct | 64% memory reduction |
| price-12400 | $12,400/month (also unformatted: $12400/month) |
| cost-68pct | 68% cost (any 68% cost-savings framing) |
| faster-95pct | 95% faster |
| sub-20ms-retrieval | sub-20ms retrieval |

These are refused as claims in any grammar — quoted, hedged, "roughly",
"about", or attributed to a benchmark. The only ratified latency wording is
the hedge in `claims_policy.ALLOWED_LATENCY` ("designed for sub-300ms voice
recall"); the only ratified pricing vocabulary is
`brand-map.json#brands.northsun.public_pricing`.

They originate as unsupported illustrative claims in
`Adaptive Copywriting System Research.docx`. That file is research input, not brand law,
not claims authority, not a positive-example corpus, and
not publishing authorization. Its fixed X weights, link penalties,
posting-time rules, reply timing, AEO formulas, and Bayesian thresholds
are hypotheses requiring measurement — not permanent rules. The cleaned
strategic research input is `abdur-authority-growth-10k-2026-09-30.md`.

## Brand-level banned phrasing (pointers into the brand map)

The authoritative regexes live in `content/brand/brand-map.json` under
`stale_company_patterns`; runtimes must compile them from the map. The
renderings below are defanged with the `[LAB]` placeholder (`[LAB]` =
the Memory Lab brand name) so this file never matches the patterns it
documents:

- `stale-closer` — "Choose [LAB] as your agent memory layer." The closer is
  Northsun's, verbatim: `brands.northsun.closer`.
- `stale-identity` — "[LAB] is the memory and enrichment layer …". The
  identity belongs to Northsun: `brands.northsun.identity`.
- `stale-waitlist-cta` — "Join the [LAB] waitlist", "[LAB] is in private
  beta", "[lab-domain]/#waitlist". Product CTAs belong to Northsun via
  `cta_policy.cta_href`.
- `stale-lead-magnet` — "lead magnet for [LAB]". abdur.ai is a lead magnet
  for Northsun.
- `stale-spine` — "[LAB] is the spine" / "memory spine, [LAB]". The
  portfolio spine is Northsun.

## Channel bans

- Any publish path for @abdur_sayeed other than the governed Zernio
  founder profile: no browser posting, no direct platform API, no OAuth
  re-connection, no account changes. (Ordinary posts through Zernio are
  authorized — founder, 2026-09-02.)
- Abdur first-person copy on @northsunai (company voice only).
- Abdur first-person copy, or Northsun sales/waitlist copy, on
  @Mnemix_official (Lab voice only: Memory Lab, Forgetting Test, technical
  education, free utilities).
- northsun.ai written as a live CTA, signup link, or onboarding step (DNS is
  not live; it is a canonical reference only).
- Any claim of product access now ("available today", "GA") — the public
  offer is the waitlist at `cta_policy.cta_href`.
- Treating credentials, a browser login, or an available token as standing
  publishing authorization.
