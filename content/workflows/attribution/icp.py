"""icp.py — score an enriched profile against the ICP signal table.

A profile that cannot be scored (None) raises. A profile that is merely sparse
scores 0 — those are different outcomes and must not collapse into each other.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class IcpScore:
    score: int
    qualified: bool
    reasons: list[str]


def load_rules(config_path: Path) -> dict:
    return json.loads(config_path.read_text(encoding="utf-8"))


def _haystack(profile: dict, field: str) -> str:
    value = profile.get(field)
    if value is None:
        return ""
    if isinstance(value, list):
        return " ".join(str(v) for v in value).lower()
    return str(value).lower()


def score_profile(profile: dict, rules: dict) -> IcpScore:
    if profile is None:
        raise ValueError("profile is None — an unenriched profile must be handled by the caller, not scored")

    score = 0
    reasons: list[str] = []
    for signal in rules["signals"]:
        hay = _haystack(profile, signal["field"])
        if not hay:
            continue
        if any(needle.lower() in hay for needle in signal["any_of"]):
            score += int(signal["points"])
            reasons.append(signal["name"])

    score = min(score, 100)
    return IcpScore(score=score, qualified=score >= int(rules["threshold"]), reasons=reasons)
