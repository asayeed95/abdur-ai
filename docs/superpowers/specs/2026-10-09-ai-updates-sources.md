# abdur.ai AI Updates — verified source map

| Editorial input | What it establishes | What it does not establish |
|---|---|---|
| Official releases | What changed, where, and under which availability conditions | Whether Abdur has used it |
| Google Trends and social observations | What people are searching for or discussing within a recorded sample | Product quality, adoption, or a universal popularity ranking |
| Abdur's own evidence | What I tried, what worked, and what I would try next | Results from workflows that have not actually been run |
| Published writing | A useful explanation, a real example, and direct source links | A verbatim mirror of every upstream changelog |

Verified on **October 9, 2026**. This is source research and an implementation recommendation, not proof that ingestion, scheduling, or publishing is running. Native feed verification below means a direct HTTP request succeeded and its XML was parsed. Web-readable sources were also checked against their primary publisher pages. Item counts are observation receipts, not promises about feed retention.

## Start with the big two

| Lane | Primary source and adapter | Verification and important distinction |
|---|---|---|
| Claude Code | [Official RSS](https://code.claude.com/docs/en/changelog/rss.xml), RSS adapter | HTTP 200; valid RSS; 15 entries. Ready for a first ingestion adapter. Keep version identifiers and link to the matching upstream release. |
| ChatGPT + Codex | [Official combined changelog RSS](https://learn.chatgpt.com/docs/changelog/rss.xml), RSS adapter; [human-readable changelog](https://learn.chatgpt.com/docs/changelog) | HTTP 200; valid RSS; 122 entries. The old `developers.openai.com/codex/changelog/rss.xml` redirects here. This is a combined ChatGPT and Codex changelog, not a feed exclusively for consumer ChatGPT. |
| ChatGPT consumer experience | [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes), dated-section HTML adapter or editorial import | Primary source was readable through web research; direct server fetch returned 403 in this check. Retain as the completeness/reference source. Do not pretend a blocked automated read succeeded. |
| OpenAI product release aggregation | [Release notes page](https://openai.com/products/release-notes/) and [its RSS endpoint](https://openai.com/products/release-notes/rss.xml), candidate RSS adapter | The official page offers RSS and has ChatGPT, Codex, and API filters. The web fetch recognized the endpoint as XML, but direct fetching returned 403, so item-level parsing and product filters remain unverified. Recheck from the intended runtime before enabling. |
| Codex CLI | [Official repository releases Atom](https://github.com/openai/codex/releases.atom), Atom adapter | HTTP 200; valid Atom; 10 entries. Includes prereleases. Default to stable releases, with explicit labels for alpha/beta coverage. |
| OpenAI API | [API changelog](https://developers.openai.com/api/docs/changelog), dated-section HTML/Markdown adapter | The page is accessible. Its advertised [OpenAI Developers RSS](https://developers.openai.com/rss.xml) is valid RSS but contains broad developer resources, not just API releases. Use it for discovery; confirm release claims against the API changelog. |

**Feed decision:** ship the proven Claude Code RSS and combined ChatGPT/Codex RSS first. Preserve a separate `chatgpt` product tag and Help Center source record. Activate the newer OpenAI product-release RSS only after a successful fetch and inspection in the actual runtime. No ChatGPT-only native feed was verified in this research. OpenAI news RSS must never be presented as the ChatGPT changelog.

## Expand through verified official sources

| Product | Source and adapter | Availability and ingestion caveat |
|---|---|---|
| Perplexity consumer app / Computer / Comet | [Official product changelog](https://www.perplexity.ai/changelog), HTML adapter or editorial import | Web-readable, but direct HTTP fetch returned 403. This lane covers product changes; API notes alone will miss them. Avoid inventing an RSS feed. |
| Perplexity API | [Official RSS](https://docs.perplexity.ai/docs/resources/changelog/rss.xml), RSS adapter; [source page](https://docs.perplexity.ai/docs/resources/changelog) | HTTP 200; valid RSS; 15 entries. Multiple entries share the same month title and anchor URL but have different GUIDs. Deduplicate by source + GUID, not title or URL alone. [Markdown](https://docs.perplexity.ai/docs/resources/changelog.md) also returned 200. |
| Z.ai / GLM | [Official release RSS](https://docs.z.ai/release-notes/new-released/rss.xml), RSS adapter; [source page](https://docs.z.ai/release-notes/new-released) | HTTP 200; valid RSS; 15 entries. Titles can be dates; derive a readable summary from the entry body. Preserve Z.ai's exact model spelling. [Markdown](https://docs.z.ai/release-notes/new-released.md) returned 200. |
| Moonshot / Kimi | [Official platform RSS](https://platform.kimi.ai/docs/platform-changelog/rss.xml), RSS adapter; [source page](https://platform.kimi.ai/docs/platform-changelog) | HTTP 200; valid RSS; 15 entries. Monthly entries may contain several changes. The older guessed `/docs/changelog` path redirects to an overview, so it is unsuitable as a changelog. [Markdown](https://platform.kimi.ai/docs/platform-changelog.md) returned 200. |
| Kimi K3 | [Official K3 documentation](https://platform.kimi.ai/docs/guide/kimi-k3-quickstart) plus the platform changelog | Product identity is verified. The official platform changelog lists K3 API availability under July 2026. Treat model availability and Abdur's account access as separate facts. |
| xAI / Grok API | [Official release notes](https://docs.x.ai/developers/release-notes), dated-section Markdown adapter | HTML and [Markdown](https://docs.x.ai/developers/release-notes.md) returned 200. Tested `/rss.xml` suffix returned 404. Use the verified document rather than a fabricated feed. |
| Grok Bot | [Official Grok Bot documentation](https://docs.x.ai/grok-bot/overview), page-change detection plus editorial review | The product is documented separately from the API. No dedicated release feed was verified. Track meaningful documented changes, retaining observation date when no release date is supplied. |
| Gemini app | [Official Gemini blog RSS](https://blog.google/products-and-platforms/products/gemini/rss/), RSS adapter; [source page](https://blog.google/products-and-platforms/products/gemini/) | HTTP 200; valid RSS; 20 entries. Official announcements, not a complete app changelog. [Gemini updates](https://gemini.google.com/updates) exposed only a sign-in shell in this read, so its content was not verified. |
| Gemini API | [Official API release notes](https://ai.google.dev/gemini-api/docs/changelog), dated-section HTML adapter | Web-readable. Tested `/rss.xml` suffix returned 404. Keep API changes separate from app announcements. |
| Gemini CLI | [Official repository releases Atom](https://github.com/google-gemini/gemini-cli/releases.atom), Atom adapter | HTTP 200; valid Atom; 10 entries. Includes nightly releases; filter to stable by default. |
| VS Code AI features | [Official updates Atom](https://code.visualstudio.com/feed.xml), Atom adapter; [release notes](https://code.visualstudio.com/updates) | HTTP 200; valid Atom; 41 entries. Includes Insiders and non-AI editor changes. Use AI relevance and stable-channel filters. Preserve preview labels. |
| GitHub Copilot | [Official Copilot changelog RSS](https://github.blog/changelog/label/copilot/feed/), RSS adapter; [source page](https://github.blog/changelog/label/copilot/) | HTTP 200; valid RSS; 10 entries. Copilot changes overlap VS Code announcements; group related events without throwing away either source. |
| Muse AI | Product mapping unresolved | The existing project context describes Swift as Abdur's Muse AI agent. That does not identify a public company/changelog. Keep this source disabled until its exact product and official URL are established; do not silently map it to Muse.ai video hosting or another similarly named product. |

## Trend inputs with honest evidence

| Signal | Verified option | Recommendation |
|---|---|---|
| Google Trending Now | [Official RSS](https://trends.google.com/trending/rss?geo=US) returned 200 and parsed as RSS with 10 entries. Google documents [RSS and CSV exports](https://support.google.com/trends/answer/3076011). | Use as a contextual discovery signal. It surfaces trending search clusters; absence of “Claude” or “Kimi” does not establish low interest. Record geography and observed time. |
| Google Trends product comparisons | [Official Trends API](https://developers.google.com/search/apis/trends) still describes limited alpha access and an application process. | Make API access optional until account entitlement is proven. Support an official UI CSV import in the first implementation. Do not make unofficial scraping a hidden production dependency. |
| Google Trends semantics | Google explains [sampling and normalization](https://support.google.com/trends/answer/4365533). Website indices are relative to the chosen query, geography, and period. | Store compared topics/terms, search type, geography, dates, export time, normalization context, and raw evidence. Do not call an index “number of searches” or compare independently scaled charts as if they share a scale. |
| X discussion volume | [Recent post counts](https://docs.x.com/x-api/posts/counts/introduction) and [recent search](https://docs.x.com/x-api/posts/search/introduction) cover seven days. Developer account/app credentials are prerequisites; archive access has separate access conditions. | Enable only after credentials, endpoint entitlement, and cost limits are confirmed. Record exact query, languages, exclusions, window, and timestamp. Distinguish matching post count from unique authors, impressions, and users. |
| X qualitative evidence | Permalinks to visible posts and the observed engagement numbers | Useful before an API is connected. Label it a curated sample. It cannot justify “the most talked-about company” across X. |
| Other social platforms | Add documented, permitted platform APIs or curated linked observations individually | Keep each sample separate. A YouTube view count, Reddit score, and X post count are different measures; do not add them into an unexplained “buzz” total. |

No live cross-company trend ranking was collected in this research. A production system should show `unavailable`, `stale`, or `not collected` rather than fabricate zeroes or scores.

## Recommended editorial selection

```text
Official release → identify product and availability → group related events
                                                    ↓
                       attach trend evidence + founder relevance
                                                    ↓
                       choose an example → verify → publish
                                                    ↓
                       derive X draft and video outline
```

Give Claude Code and ChatGPT/Codex continuing coverage because that is the founder's chosen focus. Let other products enter the writing queue when there is a consequential verified change, a useful founder workflow, or a recorded increase in attention. An important retirement, breaking change, or security fix can deserve coverage even when it is not trending.

The editorial priority may combine freshness, practical impact, founder relevance, and observed attention, but it must be labeled **our editorial priority**, never an objective public popularity ranking. Missing signals remain missing. A first release can use an explicit editor decision with a one-sentence rationale instead of a numerical scoring formula.

## Locked example-led writing rule

| Evidence state | Wording |
|---|---|
| A proposed workflow | “This is how I would use it…” |
| A real run with an artifact | “This is how I used it…” followed by the result and evidence |
| An incomplete or failed run | “I tried this; here is where it stopped…” |

Each substantial update should carry: the exact upstream change and source; who can access it; a useful visual; a first-person founder example; the observed result or clearly labeled intention; and any limitation that changes the reader's decision. Derive social/video drafts from that same reviewed article so the claims stay consistent. Never fabricate founder experience to make an update sound personal.

## Adapter acceptance criteria

1. **Proven transport:** fetch each configured source from the intended cloud runtime; retain status, resolved URL, content type, checked time, and parse result. A 200 HTML fallback is not a valid RSS result.
2. **Stable identity:** prefer upstream GUID/Atom ID plus source ID. For section adapters, keep a stable section identity and a separate content hash so corrections update an existing event.
3. **Accurate time:** preserve upstream publication time, upstream modification time when supplied, and first observation time separately. A monthly source does not justify an invented day.
4. **Safe content:** treat upstream text as data, sanitize output, bound response sizes, and allowlist source hosts. Preserve canonical source links and write original summaries.
5. **Useful failures:** one unavailable source does not block the rest. Cache the last successful state and mark freshness accurately; parser failures do not become empty “no news” results.
6. **No duplicate publication:** repeat ingestion does not create another article. Cross-source grouping retains all provenance; edits and retractions remain traceable.
7. **Reviewable publication:** ingestion produces candidate events. Published writing and any outgoing site feed contain the curated editorial artifact, with transparent attribution and the correct evidence-state wording.
8. **Channel control:** prerelease/nightly/Insiders entries stay distinguishable. Official product release, model availability in a third-party tool, and Abdur's actual access are separate events.

The research establishes usable sources and the adapter boundaries. Credentials, access from the deployment environment, ongoing schedule operation, article production, and successful publication still require runtime verification.
