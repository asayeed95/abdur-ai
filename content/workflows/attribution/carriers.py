"""carriers.py — decide which artifact earns a signup, and at what confidence.

Carrier precedence: declared > ref > utm > time_window > none.
Two hard rules, both from the design spec:
  * cohort guard — an artifact published after the signup can never be credited
  * never split  — two eligible candidates on ANY carrier means unattributed at that
                   tier. The rule is not specific to time_window: one campaign spanning
                   many artifacts is the normal case for `utm`, and picking whichever
                   matched first is a misattribution, not a tie-break.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path

from funnel import parse_ts


@dataclass(frozen=True)
class AttributionResult:
    packet_id: str | None
    confidence: str


def load_window_hours(config_path: Path) -> int:
    return int(json.loads(config_path.read_text(encoding="utf-8"))["time_window_hours"])


def resolve_attribution(
    signup: dict,
    candidates: list[dict],
    window_hours: int = 24,
) -> AttributionResult:
    observed = parse_ts(signup["observed_at"])

    # Cohort guard: only artifacts published at or before the signup are eligible.
    eligible = []
    for c in candidates:
        if parse_ts(c["published_at"]) <= observed:
            eligible.append(c)

    # Never split: a tier credits an artifact only when exactly one candidate matches.
    # Zero matches and two-or-more matches both fall through to the next, weaker tier.
    declared = (signup.get("declared_source") or "").strip().lower()
    if declared:
        matches = [c for c in eligible
                   if (c.get("declared_token") or "").strip().lower() == declared]
        if len(matches) == 1:
            return AttributionResult(matches[0]["packet_id"], "declared")

    ref = signup.get("ref")
    if ref:
        matches = [c for c in eligible if c.get("ref") and c["ref"] == ref]
        if len(matches) == 1:
            return AttributionResult(matches[0]["packet_id"], "ref")

    utm = signup.get("utm_campaign")
    if utm:
        matches = [c for c in eligible if c.get("utm_campaign") and c["utm_campaign"] == utm]
        if len(matches) == 1:
            return AttributionResult(matches[0]["packet_id"], "utm")

    cutoff = observed - timedelta(hours=window_hours)
    in_window = [c for c in eligible if parse_ts(c["published_at"]) >= cutoff]
    if len(in_window) == 1:
        return AttributionResult(in_window[0]["packet_id"], "time_window")

    return AttributionResult(None, "none")
