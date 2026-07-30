"""report.py — weekly attribution rollup.

The unattributed bucket is reported as a first-class number. An engine that
assigns every signup to a source is forging its own scoreboard.
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from funnel import read_rows
from ingest import UNATTRIBUTED


def _parse(ts: str) -> datetime:
    parsed = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _events_in_window(ledger_path: Path, since: str, until: str) -> list[dict]:
    """Window-filter the ledger. Row reading and the corrupt-row guard live in funnel.read_rows."""
    lo, hi = _parse(since), _parse(until)
    return [row for row in read_rows(ledger_path) if lo <= _parse(row["observed_at"]) <= hi]


def weekly_report(ledger_path: Path, since: str, until: str) -> dict:
    rows = _events_in_window(ledger_path, since, until)

    per_artifact: dict[str, dict] = {}
    attributed = 0
    unattributed = 0

    for row in rows:
        pid = row["packet_id"]
        bucket = per_artifact.setdefault(pid, {
            "packet_id": pid, "signups": 0, "icp_qualified_signups": 0,
            "ref_click_throughs": 0, "icp_qualified_engagers": 0,
        })
        stage, icp = row["stage"], bool(row.get("icp_qualified"))

        if stage == "signup":
            bucket["signups"] += 1
            if icp:
                bucket["icp_qualified_signups"] += 1
            if pid == UNATTRIBUTED:
                unattributed += 1
            else:
                attributed += 1
        elif stage == "ref_click":
            bucket["ref_click_throughs"] += 1
        elif stage == "engager" and icp:
            bucket["icp_qualified_engagers"] += 1

    total = attributed + unattributed
    artifacts = [b for pid, b in sorted(per_artifact.items()) if pid != UNATTRIBUTED]

    return {
        "window": {"since": since, "until": until},
        "artifacts": artifacts,
        "attributed_signups": attributed,
        "unattributed_signups": unattributed,
        "unattributed_share": (unattributed / total) if total else 0.0,
    }


def render_text(report: dict) -> str:
    lines = [
        f"Attribution {report['window']['since']} → {report['window']['until']}",
        f"  attributed signups:   {report['attributed_signups']}",
        f"  unattributed signups: {report['unattributed_signups']} "
        f"({report['unattributed_share']:.0%} of total)",
        "",
    ]
    for row in report["artifacts"]:
        lines.append(
            f"  {row['packet_id']}: {row['signups']} signup(s), "
            f"{row['icp_qualified_signups']} ICP-qualified, "
            f"{row['ref_click_throughs']} ref click(s), "
            f"{row['icp_qualified_engagers']} ICP engager(s)"
        )
    return "\n".join(lines)
