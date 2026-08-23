---
profile: examples-bad
purpose: counter-examples; every line here is a defect with the reason named
authority: content/brand/brand-map.json
brand_map_blob: 4e8dbd5643bed2af47995add45032298dbac135a
version_manifest: content/voice/VERSION.json
---

# Bad examples

Each block shows a draft that must be rejected and why. Brand-level stale
phrasings are defanged with `[LAB]` (the Memory Lab brand name) so this file
documents them without containing them; the authoritative regexes are
`brand-map.json#stale_company_patterns`.

## Invented metrics (refused claims)

> We cut retrieval from 420ms to 18ms.

Rejected: unratified latency numbers (`latency-420-18`). The only latency
wording allowed is the ratified hedge in `claims_policy.ALLOWED_LATENCY`.

> Northsun handles 100,000 concurrent streams with a 64% memory reduction.

Rejected: unratified scale and efficiency metrics (`streams-100k`,
`memory-64pct`).

> One customer saves $12,400/month — a 68% cost reduction — and reports
> queries run 95% faster with sub-20ms retrieval.

Rejected: four refused claims in one sentence (`price-12400`, `cost-68pct`,
`faster-95pct`, `sub-20ms-retrieval`), plus an unverifiable customer story.

## Wrong brand doing the selling

> [LAB] v2.4 is generally available. Choose [LAB] as your agent memory layer.

Rejected: version-release claim for the Lab (`mnemix-v2.4`) and the stale
closer (`stale-closer`). Mnemix is not a commercial product line; the closer
belongs to Northsun, verbatim.

> [LAB] is the memory and enrichment layer for AI agents.

Rejected: stale company-level identity (`stale-identity`). That identity
line is Northsun's.

## Fake urgency and dead CTAs

> Try Northsun today.

Rejected: implies product access now; the public offer is the waitlist.

> Sign up at northsun.ai.

Rejected: northsun.ai DNS is not live; it is never a CTA. CTAs point at
`cta_policy.cta_href` (/#waitlist).

## Wrong voice on the wrong channel

> (posted from @northsunai) I stayed up all night fixing the recall bug and
> honestly I nearly gave up.

Rejected: Abdur first-person on the company channel. @northsunai is company
voice only.

> Scheduling this thread to publish from @abdur_sayeed tomorrow.

Rejected: @abdur_sayeed is compromised and paused; no publish paths exist
for it.
