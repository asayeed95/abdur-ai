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

# The bucket every event that matches no artifact is credited to. It is a domain
# concept — the fold and the rollup both partition on it — so it lives here rather
# than in the ingress module that happens to be its first writer.
UNATTRIBUTED = "__unattributed__"

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
    # Never a raw email or handle. The ledger is append-only and is never rewritten,
    # so an identity written once is written permanently: only hash_identity output
    # belongs in this field. See hash_identity for why the pepper is not optional.
    identity_hash: str | None = None
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


def hash_identity(identity: str, pepper: str) -> str:
    """Turn a raw email or handle into the only form of it this package may persist.

    The identity is normalised first (`strip()` then `lower()`) so that the same
    person always produces the same digest: without normalisation `Dev@Example.com`
    and `dev@example.com` become two people and every dedupe silently splits.

    `pepper` is a required positional argument and deliberately has no default. An
    unpeppered SHA-256 of an email address is reversible by rainbow table — the
    address space of real emails is small enough to enumerate — so an unpeppered
    digest is obfuscation, not pseudonymisation. Making the caller pass it at every
    call site turns that into an explicit choice instead of an inherited default
    nobody revisits; a library-supplied pepper would be a shared, published constant
    and therefore no pepper at all.

    Raises ValueError on a blank identity: an empty digest would silently merge
    every unidentified subject into one synthetic person.
    """
    if not isinstance(identity, str) or not identity.strip():
        raise ValueError(f"cannot hash blank identity {identity!r}")
    normalized = identity.strip().lower()
    return "idh_" + hashlib.sha256((pepper + "|" + normalized).encode("utf-8")).hexdigest()


def make_event_id(
    packet_id: str,
    stage: str,
    identity_hash: str | None,
    observed_at: str,
    nonce: str | None = None,
) -> str:
    """Deterministic idempotency key. Same inputs always yield the same id.

    Takes the *hash*, never a raw identity: the id is persisted in the ledger, so
    deriving it from a raw email would leak that email into the id's preimage and
    put PII back at rest through the side door this package just closed.

    `nonce` is required for identity-less stages such as `ref_click`: without it,
    two genuinely distinct anonymous events on the same artifact in the same second
    hash to one id and the second is silently dropped as a replay. The caller owns
    the nonce (a request id is the natural source) because only the caller can tell
    a real second event from a retry of the first.
    """
    raw = "|".join([packet_id, stage, identity_hash or "", observed_at, nonce or ""])
    return "ev_" + hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]


def read_rows(ledger_path: Path) -> list[dict]:
    """The single JSONL reader for this ledger. Corrupt rows raise; they are never skipped.

    Public because report.py consumes it — the corrupt-row guard, the stage guard and
    the duplicate-id guard must each exist in one place only.

    Duplicate `event_id` rows collapse here, first occurrence wins — but only when the
    two rows are byte-for-byte the same event. append_event's idempotency check only
    protects the write path; a duplicate that arrives any other way (concurrent append,
    ledger merge, restored backup) would otherwise inflate every fold that reads the
    file. Both folds inherit the guard by reading through this function.

    Two rows sharing an `event_id` with *different* contents are not a replay, they are
    corruption: one of the two is wrong and this function cannot know which. Collapsing
    them would silently pick a winner and report the result as fact, so it raises
    instead, naming the file and line of the conflicting row.
    """
    if not ledger_path.exists():
        return []
    rows = []
    seen: dict[str, dict] = {}
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

            event_id = row["event_id"]
            if event_id in seen:
                if row != seen[event_id]:
                    raise ValueError(
                        f"{ledger_path}:{lineno} reuses event_id {event_id!r} with "
                        f"different contents; the ledger is corrupt, not replayed"
                    )
                continue
            seen[event_id] = row
            rows.append(row)
    return rows


def _rows_by_id(ledger_path: Path) -> dict[str, dict]:
    return {row["event_id"]: row for row in read_rows(ledger_path)}


def append_event(ledger_path: Path, event: StageEvent) -> bool:
    """Append one event. Returns False if this exact event was already present.

    An exact replay is an idempotent no-op. The same `event_id` carrying *different*
    contents raises: the id is a deterministic function of the event, so two different
    events under one id means one of them is wrong, and appending either would put a
    number in the ledger that no later read can adjudicate.
    """
    if event.stage not in STAGES:
        raise ValueError(f"unknown stage {event.stage!r}; expected one of {STAGES}")
    if event.confidence not in CONFIDENCES:
        raise ValueError(f"unknown confidence {event.confidence!r}; expected one of {CONFIDENCES}")

    existing = _rows_by_id(ledger_path).get(event.event_id)
    if existing is not None:
        if existing != asdict(event):
            raise ValueError(
                f"event_id {event.event_id!r} is already in {ledger_path} with different "
                f"contents; refusing to append a conflicting row"
            )
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
    #
    # Both lists hold identity *hashes*. That is enough: each only ever answers "how
    # many distinct people", and hash_identity is stable per person, so distinctness
    # survives pseudonymisation intact.
    icp_engagers: list[str] = []
    for row in read_rows(ledger_path):
        if row.get("packet_id") != packet_id:
            continue
        stage = row.get("stage")
        icp = bool(row.get("icp_qualified"))
        identity_hash = row.get("identity_hash")

        if stage == "impression":
            vec.impressions += 1
        elif stage == "engager":
            if identity_hash and identity_hash not in vec.engagers:
                vec.engagers.append(identity_hash)
            if icp and identity_hash and identity_hash not in icp_engagers:
                icp_engagers.append(identity_hash)
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
