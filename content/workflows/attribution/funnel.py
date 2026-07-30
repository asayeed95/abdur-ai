"""funnel.py — append-only attribution event ledger and per-artifact funnel projection.

The ledger is the source of truth and is append-only. A FunnelVector is a fold over
events, never a stored mutable row. Corrupt input raises; it is never skipped.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path

STAGES = ("impression", "engager", "ref_click", "signup", "activation", "counter")
CONFIDENCES = ("declared", "ref", "utm", "time_window", "none")

# The minimum shape every ledger row must have. Anything less is corruption, not a
# gap to route around: read_rows raises ValueError rather than let a caller index
# into a row that is missing the key it is about to read.
REQUIRED_ROW_FIELDS = ("event_id", "packet_id", "stage", "observed_at")


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


def parse_ts(ts: str) -> datetime:
    """The single timestamp parser for this package.

    Accepts a trailing `Z` and treats a naive timestamp as UTC. Every failure —
    including a non-string — surfaces as a ValueError naming the offending value,
    so callers never have to catch two error types for one malformed field.
    """
    try:
        parsed = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except (AttributeError, TypeError, ValueError) as exc:
        raise ValueError(f"unparseable timestamp {ts!r}") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def make_event_id(
    packet_id: str,
    stage: str,
    identity: str | None,
    observed_at: str,
    nonce: str | None = None,
) -> str:
    """Deterministic idempotency key. Same inputs always yield the same id.

    `nonce` is required for identity-less stages such as `ref_click`: without it,
    two genuinely distinct anonymous events on the same artifact in the same second
    hash to one id and the second is silently dropped as a replay. The caller owns
    the nonce (a request id is the natural source) because only the caller can tell
    a real second event from a retry of the first.
    """
    raw = "|".join([packet_id, stage, identity or "", observed_at, nonce or ""])
    return "ev_" + hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]


def read_rows(ledger_path: Path) -> list[dict]:
    """The single JSONL reader for this ledger. Corrupt rows raise; they are never skipped.

    Public because report.py consumes it — the corrupt-row guard, the stage guard and
    the duplicate-id guard must each exist in one place only.

    Duplicate `event_id` rows are dropped here, first occurrence wins. append_event's
    idempotency check only protects the write path; a duplicate that arrives any other
    way (concurrent append, ledger merge, restored backup) would otherwise inflate every
    fold that reads the file. Both folds inherit the guard by reading through this function.
    """
    if not ledger_path.exists():
        return []
    rows = []
    seen_ids: set[str] = set()
    with ledger_path.open("r", encoding="utf-8") as fh:
        for lineno, raw in enumerate(fh, start=1):
            raw = raw.strip()
            if not raw:
                continue
            try:
                row = json.loads(raw)
            except json.JSONDecodeError as exc:
                raise ValueError(f"{ledger_path}:{lineno} is not valid JSON: {exc}") from exc

            if not isinstance(row, dict):
                raise ValueError(
                    f"{ledger_path}:{lineno} is not a JSON object "
                    f"(got {type(row).__name__})"
                )
            missing = [name for name in REQUIRED_ROW_FIELDS if name not in row]
            if missing:
                raise ValueError(
                    f"{ledger_path}:{lineno} is missing required field(s) "
                    f"{', '.join(repr(name) for name in missing)}"
                )
            if row["stage"] not in STAGES:
                raise ValueError(
                    f"{ledger_path}:{lineno} has unknown stage {row['stage']!r}; "
                    f"expected one of {STAGES}"
                )

            if row["event_id"] in seen_ids:
                continue
            seen_ids.add(row["event_id"])
            rows.append(row)
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
    # icp_qualified_engagers is a subset of engagers, so it counts people the same way
    # engagers does. Counting it per row lets one person engaging twice push the ICP
    # count above the engager total.
    icp_engagers: list[str] = []
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
            if icp and identity and identity not in icp_engagers:
                icp_engagers.append(identity)
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

    vec.icp_qualified_engagers = len(icp_engagers)
    return vec
