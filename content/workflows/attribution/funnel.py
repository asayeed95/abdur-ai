"""funnel.py — append-only attribution event ledger and per-artifact funnel projection.

The ledger is the source of truth and is append-only. A FunnelVector is a fold over
events, never a stored mutable row. Corrupt input raises; it is never skipped.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from pathlib import Path

STAGES = ("impression", "engager", "ref_click", "signup", "activation", "counter")
CONFIDENCES = ("declared", "ref", "utm", "time_window", "none")


@dataclass(frozen=True)
class StageEvent:
    event_id: str
    packet_id: str
    stage: str
    observed_at: str
    confidence: str = "none"
    identity: str | None = None
    icp_qualified: bool = False


@dataclass
class FunnelVector:
    packet_id: str
    impressions: int = 0
    engagers: list[str] = field(default_factory=list)
    icp_qualified_engagers: int = 0
    ref_click_throughs: int = 0
    signups: int = 0
    icp_qualified_signups: int = 0
    activated_devs: int = 0
    counter_signal: int = 0


def make_event_id(packet_id: str, stage: str, identity: str | None, observed_at: str) -> str:
    """Deterministic idempotency key. Same inputs always yield the same id."""
    raw = "|".join([packet_id, stage, identity or "", observed_at])
    return "ev_" + hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]


def read_rows(ledger_path: Path) -> list[dict]:
    """The single JSONL reader for this ledger. Corrupt rows raise; they are never skipped.

    Public because report.py consumes it — the corrupt-row guard must exist in one place only.
    """
    if not ledger_path.exists():
        return []
    rows = []
    with ledger_path.open("r", encoding="utf-8") as fh:
        for lineno, raw in enumerate(fh, start=1):
            raw = raw.strip()
            if not raw:
                continue
            try:
                rows.append(json.loads(raw))
            except json.JSONDecodeError as exc:
                raise ValueError(f"{ledger_path}:{lineno} is not valid JSON: {exc}") from exc
    return rows


def _seen_ids(ledger_path: Path) -> set[str]:
    return {row["event_id"] for row in read_rows(ledger_path)}


def append_event(ledger_path: Path, event: StageEvent) -> bool:
    """Append one event. Returns False if event_id was already present (idempotent no-op)."""
    if event.stage not in STAGES:
        raise ValueError(f"unknown stage {event.stage!r}; expected one of {STAGES}")
    if event.confidence not in CONFIDENCES:
        raise ValueError(f"unknown confidence {event.confidence!r}; expected one of {CONFIDENCES}")

    if event.event_id in _seen_ids(ledger_path):
        return False

    ledger_path.parent.mkdir(parents=True, exist_ok=True)
    with ledger_path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(asdict(event), sort_keys=True) + "\n")
    return True


def fold_funnel(ledger_path: Path, packet_id: str) -> FunnelVector:
    """Project all events for one artifact into its funnel vector."""
    vec = FunnelVector(packet_id=packet_id)
    for row in read_rows(ledger_path):
        if row.get("packet_id") != packet_id:
            continue
        stage = row.get("stage")
        icp = bool(row.get("icp_qualified"))
        identity = row.get("identity")

        if stage == "impression":
            vec.impressions += 1
        elif stage == "engager":
            if identity and identity not in vec.engagers:
                vec.engagers.append(identity)
            if icp:
                vec.icp_qualified_engagers += 1
        elif stage == "ref_click":
            vec.ref_click_throughs += 1
        elif stage == "signup":
            vec.signups += 1
            if icp:
                vec.icp_qualified_signups += 1
        elif stage == "activation":
            vec.activated_devs += 1
        elif stage == "counter":
            vec.counter_signal += 1
    return vec
