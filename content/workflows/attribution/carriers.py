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
    """Load `time_window_hours` from an attribution config file.

    Requires a strict, positive, non-boolean JSON integer. A bare `int()` coercion
    would silently accept a bool (`bool` is an `int` subclass in Python, so `True`
    becomes `1`), truncate a float (`1.9` becomes `1`), and accept a zero or negative
    value that disables or inverts time-window attribution outright. Every one of
    those changes attribution behaviour with no error, so the raw JSON value's type
    and range are validated here rather than trusted to whatever `int()` lets through.
    """
    raw = json.loads(config_path.read_text(encoding="utf-8"))
    value = raw.get("time_window_hours") if isinstance(raw, dict) else None
    # bool is a subclass of int, so this check must precede isinstance(value, int) —
    # otherwise True/False would silently pass the int check as 1/0.
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise ValueError(
            f"{config_path}: 'time_window_hours' must be a positive integer, "
            f"got {value!r}"
        )
    return value


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
