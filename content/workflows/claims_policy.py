#!/usr/bin/env python3
"""Shared mechanical public-claims policy for abdur.ai content surfaces.

The policy is deliberately a classifier, never an approval engine.  A finding
means the item must be routed to Class C for founder review; no finding proves
only that none of the mechanical claim-class tokens were present.

Both the C-4 social gate (``local-brains/gates.py``) and the public-site
checker import this module.  Keeping the rule table here prevents a policy
change from silently protecting one public surface while leaving another on
older rules.
"""

from __future__ import annotations

import re


ALLOWED_LATENCY = "designed for sub-300ms voice recall"
FROZEN_ENDPOINTS = ("/v1/recall_and_enrich", "/v1/calls/end", "/v1/caller/")
CLOSER = "Choose Mnemix as your agent memory layer."
IDENTITY = "the memory and enrichment layer for AI agents"
ENRICH_VENDORS = ("trestle", "twilio lookup", "twilio")
STRUCK = ("baylio",)
# Retired branding: phrases that used to describe Mnemix's identity and were
# ratified out. A deny-list catches these however they are phrased — no
# grammar assumption required — unlike a grammar-shaped regex, which only
# catches the wording it was written for. See _IDENTITY_LINE below for the
# (secondary) grammar-shaped check this deny-list is meant to not depend on.
RETIRED_PHRASES = (
    "contextual intelligence orchestration",
    "contextual intelligence platform",
    "memory layer that makes any ai agent self-driving",
)

_UNITS = ("zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
          "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen",
          "nineteen")
_TENS = ("twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety")
_SCALES = ("hundred", "thousand", "million", "billion")
_TIME_UNIT = r"(?:ms\b|millisecond(?:s)?\b|sec(?:ond)?s?\b|s\b)"
_LATENCY_NUMERIC = re.compile(r"\b\d+(?:\.\d+)?\s*" + _TIME_UNIT, re.I)
_LATENCY_COMPARATIVE = re.compile(
    r"\bsub[- ]?(?:second|\d+\s*ms)\b|\bunder\s+(?:a\s+)?"
    r"(?:\d+(?:\.\d+)?|" + "|".join(_UNITS + _TENS + _SCALES) + r")[\w\s-]{0,20}?" + _TIME_UNIT,
    re.I,
)
_LATENCY_WORDY = re.compile(
    r"\b(?:" + "|".join(_UNITS + _TENS + _SCALES) + r")(?:[-\s]\w+){0,2}\s+" + _TIME_UNIT,
    re.I,
)
_FRACTION_TIME = re.compile(r"\b(?:a\s+)?(?:third|half|quarter)\s+of\s+a\s+second\b", re.I)
_PRICE = re.compile(
    r"\$\d+(?:\.\d+)?(?:\s*(?:/|per)\s*(?:mo(?:nth)?|year|week|day)|\s+a\s+(?:month|year|week|day)|\s+monthly)?|"
    r"\b\d+\s*(?:dollars|bucks)\b|\b\d+\s*/\s*mo\b|"
    r"\b(?:" + "|".join(_UNITS + _TENS) + r")(?:[-\s]\w+)?\s+(?:dollars|bucks|a\s+month|per\s+month)\b",
    re.I,
)
_ENRICHMENT_VENDOR = re.compile(
    r"(?:powered by|enrichment (?:by|via|from))\s+([A-Za-z][\w-]*(?:\.[A-Za-z0-9][\w-]*)*)",
    re.I,
)
# Two constructions assert Mnemix's identity in the wild: "Mnemix is the/a X"
# and the em-dash form "Mnemix — X" (optionally through a JSX closing tag, and
# optionally preceded by "... layer of"). Both are matched so a non-verbatim
# identity claim is flagged regardless of which grammar the copy uses.
_IDENTITY_LINE = re.compile(
    r"\bMnemix\b(?:</?\w+[^>]*>)?\s+is\s+(?P<article>the|a)\s+(?P<claim>[^.\n]+)"
    r"|\bMnemix\b(?:</?\w+[^>]*>)?\s*[\u2014\u2013]\s*(?:(?P<article2>the)\s+)?(?P<claim2>[^.\n]+)",
    re.I,
)

# These patterns deliberately require an asserted product relationship.  Merely
# discussing a benchmark, customer, or compliance topic is not a claim that
# Mnemix has one; an asserted relationship is the Class-C routing signal.
_BENCHMARK_CLAIM = re.compile(
    r"\b(?:mnemix|we)\s+(?:benchmarked?|outperform(?:s|ed)?|beat|is\s+\d+(?:\.\d+)?x)\b|"
    r"\bbenchmark(?:ed)?\s+(?:mnemix|our\s+(?:system|memory|product))\b",
    re.I,
)
_CUSTOMER_CLAIM = re.compile(
    r"\b(?:mnemix|we)\s+(?:has|have|serves?|powers?)\s+(?:a\s+)?(?:named\s+)?customer\b|"
    r"\b(?:customer|customer\s+team|client)\s+(?:at|such\s+as)\s+[A-Z]",
    re.I,
)
_INTEGRATION_CLAIM = re.compile(
    r"\b(?:mnemix|we)\s+(?:integrates?|integrated|connects?|connected|works?)\s+(?:with|to)\b|"
    r"\b(?:mnemix|our)\s+integration\s+with\b",
    re.I,
)
_COMPLIANCE_CLAIM = re.compile(
    r"\b(?:mnemix|we)\s+(?:is|are)\s+(?:soc\s*2|hipaa|gdpr|iso\s*27001|compliant|certified)\b|"
    r"\b(?:soc\s*2|hipaa|gdpr|iso\s*27001)\s+(?:compliant|certified)\b",
    re.I,
)
_ACCESS_NOW_CLAIM = re.compile(
    r"\b(?:start|try|use|access|sign\s*up\s+for|get\s+started\s+with)\s+mnemix\b|"
    r"\bmnemix\s+(?:is\s+)?(?:available|ready)\s+(?:now|today|immediately)\b",
    re.I,
)


_FENCED_CODE = re.compile(r"```.*?```", re.S)
_INLINE_CODE = re.compile(r"`[^`\n]+`")
# Frontmatter `source:` is a provenance pointer to an internal repo-events file.
# It is metadata, never published prose — but its filenames encode commit subjects,
# so they carry SHAs and error codes. Everything else in frontmatter (title,
# description, dek, tldr) IS published and stays fully checked.
#
# Scoped to the OPENING frontmatter block only. An unanchored `^source:.*$` masked
# every such line anywhere in the document, so a body line reading
# `source: Pro is $49/month.` would have been excluded from the numeric checks —
# an evasion hole in a claims guard, opened by a fix meant to reduce false
# positives. Narrowing a matcher is not automatically safe; the scope has to be
# the thing you actually meant.
_FRONTMATTER_BLOCK = re.compile(r"\A---\r?\n.*?^---\r?$", re.S | re.M)
_SOURCE_FIELD = re.compile(r"^source:.*$", re.M)


def _mask_code(text: str) -> str:
    """Blank out code blocks and inline code spans, preserving length/offsets.

    Applies to the NUMERIC marketing checks only (latency, price). Those ask
    "is this copy asserting a number at the reader?" — and a quoted commit
    message, an error string, or a code sample is not an assertion.

    Scar (2026-08-05): a postmortem quoting its own commit subject,
    `fix(web): dashboard tenants select('*') 42501s unconditionally post-031`,
    was blocked as a latency claim. 42501 is the Postgres SQLSTATE for
    permission-denied, used there as a verb; `_TIME_UNIT` accepts a bare "s",
    so it read as "42501 seconds". Left unfixed this is not a one-off: every
    technical post carrying real SHAs, error codes, and payloads trips it, so
    the guard would systematically block exactly the evidence-dense writing the
    content strategy most needs.

    This does NOT weaken the structural checks. Route names, enrichment
    vendors, struck products, the identity line, and the closer are all matched
    against the FULL corpus, including code — a forbidden route smuggled into a
    code span is still caught.
    """
    masked = _FENCED_CODE.sub(lambda m: " " * len(m.group(0)), text)
    return _INLINE_CODE.sub(lambda m: " " * len(m.group(0)), masked)


def mask_frontmatter_source(document: str) -> str:
    """Blank the `source:` provenance line inside the OPENING frontmatter block.

    Document-level by necessity. Callers segment a document before claim-checking,
    and a segment never begins with `---`, so frontmatter cannot be recognised from
    inside `h2_findings`. "Which block is the frontmatter" is only answerable while
    the document is whole — so it is answered here, once, before segmentation.

    Scoped deliberately. An unanchored `^source:.*$` masked every such line anywhere
    in the document, so body prose reading `source: Pro is $49/month.` would have
    been excluded from the numeric checks — an evasion hole in a claims guard,
    opened by a fix meant to reduce false positives. Length is preserved so every
    downstream offset stays truthful.
    """
    if not isinstance(document, str):
        return document
    fm = _FRONTMATTER_BLOCK.match(document)
    if not fm:
        return document
    head = _SOURCE_FIELD.sub(lambda m: " " * len(m.group(0)), fm.group(0))
    return head + document[fm.end():]


def h2_findings(corpus: str) -> list[dict[str, str]]:
    """Return deterministic H2/Class-C findings for one public text corpus.

    The return shape intentionally matches C-4's existing gate output.  Callers
    may present the result differently, but no caller gets a boolean shortcut:
    absent or malformed inputs are findings, never a pass.
    """
    if not isinstance(corpus, str):
        return [{"gate": "H2", "detail": "claim corpus is absent or malformed"}]

    findings: list[dict[str, str]] = []
    stripped = _mask_code(re.sub(re.escape(ALLOWED_LATENCY), " ", corpus, flags=re.I))
    for pattern, label in (
        (_LATENCY_NUMERIC, "numeric latency"),
        (_LATENCY_COMPARATIVE, "comparative latency"),
        (_LATENCY_WORDY, "spelled latency"),
        (_FRACTION_TIME, "fractional latency"),
    ):
        for match in pattern.finditer(stripped):
            findings.append({"gate": "H2", "detail": f"{label} outside the allowed hedged string: {match.group(0)!r}"})

    for match in _PRICE.finditer(stripped):
        if match.group(0) != "$0":
            findings.append({"gate": "H2", "detail": f"price-shaped token (only literal $0 allowed): {match.group(0)!r}"})
    for struck in STRUCK:
        if struck in corpus.lower():
            findings.append({"gate": "H2", "detail": f"struck product named on a public surface: {struck!r}"})
    for retired in RETIRED_PHRASES:
        if retired in corpus.lower():
            findings.append({"gate": "H2", "detail": f"retired branding phrase on a public surface: {retired!r}"})
    for match in _ENRICHMENT_VENDOR.finditer(corpus):
        if match.group(1).lower() not in ENRICH_VENDORS:
            findings.append({"gate": "H2", "detail": f"enrichment vendor outside Trestle/Twilio Lookup: {match.group(1)!r}"})
    for match in re.finditer(r"/v1/[\w/{}_.-]+", corpus):
        if not any(match.group(0).startswith(endpoint) for endpoint in FROZEN_ENDPOINTS):
            findings.append({"gate": "H2", "detail": f"non-frozen /v1 route in public copy: {match.group(0)!r}"})
    for match in re.finditer(r"[Cc]hoose Mnemix[^.\n]*\.?", corpus):
        if match.group(0).strip() != CLOSER:
            findings.append({"gate": "H2", "detail": f"closer must be verbatim {CLOSER!r}, got {match.group(0)!r}"})
    for match in _IDENTITY_LINE.finditer(corpus):
        claim = match.group("claim") or match.group("claim2") or ""
        # No default here: the em-dash form's article is optional in the regex
        # specifically so a missing "the" is visible as a missing "the", not
        # silently backfilled into a false verbatim match.
        article = (match.group("article") or match.group("article2") or "").lower()
        identity = f"{article} {claim.strip()}".strip()
        if "layer" in identity.lower() and identity.casefold() != IDENTITY.casefold():
            findings.append({"gate": "H2", "detail": f"identity line must be verbatim ({IDENTITY!r}); got: {identity!r}"})
    if re.search(r"\b(?:mnemix|we)\s+builds?\s+(?:voice\s+|ai\s+)?agents\b", corpus, re.I):
        findings.append({"gate": "H2", "detail": "'we build agents' framing — customers build agents; Mnemix does not"})

    for pattern, label in (
        (_BENCHMARK_CLAIM, "benchmark claim"),
        (_CUSTOMER_CLAIM, "named-customer claim"),
        (_INTEGRATION_CLAIM, "claimed integration"),
        (_COMPLIANCE_CLAIM, "compliance claim"),
        (_ACCESS_NOW_CLAIM, "CTA implies Mnemix access now"),
    ):
        for match in pattern.finditer(corpus):
            findings.append({"gate": "H2", "detail": f"{label}: {match.group(0)!r}"})
    return findings


def mnemix_context_segments(corpus: str, radius: int = 0) -> list[str]:
    """Return bounded source windows around Mnemix references for site scanning.

    A social draft is one Mnemix-bound payload and is checked as a whole.  A
    public-site source mixes portfolio work, so scanning its entire file would
    misclassify an unrelated timing or price statement as a Mnemix claim.  The
    site adapter uses the Mnemix-bearing source line instead.
    """
    if not isinstance(corpus, str):
        return []
    lines = corpus.splitlines()
    windows: list[str] = []
    seen: set[str] = set()
    for index, line in enumerate(lines):
        if "mnemix" not in line.lower():
            continue
        window = "\n".join(lines[max(0, index - radius): index + radius + 1])
        if window not in seen:
            seen.add(window)
            windows.append(window)
    return windows
