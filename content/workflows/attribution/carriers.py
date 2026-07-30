"""carriers.py — decide which artifact earns a signup, and at what confidence.

Carrier precedence: declared > ref > utm > time_window > none.
Two hard rules, both from the design spec:
  * cohort guard — an artifact published after the signup can never be credited
  * never split  — two eligible candidates on a weak carrier means unattributed
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path


@dataclass(frozen=True)
class AttributionResult:
    packet_id: str | None
    confidence: str


def _parse(ts: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except (ValueError, AttributeError) as exc:
        raise ValueError(f"unparseable timestamp {ts!r}") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def load_window_hours(config_path: Path) -> int:
    return int(json.loads(config_path.read_text(encoding="utf-8"))["time_window_hours"])


def resolve_attribution(
    signup: dict,
    candidates: list[dict],
    window_hours: int = 24,
) -> AttributionResult:
    observed = _parse(signup["observed_at"])

    # Cohort guard: only artifacts published at or before the signup are eligible.
    eligible = []
    for c in candidates:
        if _parse(c["published_at"]) <= observed:
            eligible.append(c)

    declared = (signup.get("declared_source") or "").strip().lower()
    if declared:
        for c in eligible:
            token = (c.get("declared_token") or "").strip().lower()
            if token and token == declared:
                return AttributionResult(c["packet_id"], "declared")

    ref = signup.get("ref")
    if ref:
        for c in eligible:
            if c.get("ref") and c["ref"] == ref:
                return AttributionResult(c["packet_id"], "ref")

    utm = signup.get("utm_campaign")
    if utm:
        for c in eligible:
            if c.get("utm_campaign") and c["utm_campaign"] == utm:
                return AttributionResult(c["packet_id"], "utm")

    cutoff = observed - timedelta(hours=window_hours)
    in_window = [c for c in eligible if _parse(c["published_at"]) >= cutoff]
    if len(in_window) == 1:
        return AttributionResult(in_window[0]["packet_id"], "time_window")

    return AttributionResult(None, "none")
