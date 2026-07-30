"""report.py — weekly attribution rollup.

The unattributed bucket is reported as a first-class number. An engine that
assigns every signup to a source is forging its own scoreboard.
"""

from __future__ import annotations

from pathlib import Path

from funnel import parse_ts, read_rows
from ingest import UNATTRIBUTED


def _events_in_window(ledger_path: Path, since: str, until: str) -> list[dict]:
    """Window-filter the ledger.

    Row reading, the corrupt-row guard and timestamp parsing all live in funnel — a
    second parser here would mean two error behaviours for one malformed field.
    """
    lo, hi = parse_ts(since), parse_ts(until)
    return [row for row in read_rows(ledger_path) if lo <= parse_ts(row["observed_at"]) <= hi]


def weekly_report(ledger_path: Path, since: str, until: str) -> dict:
    rows = _events_in_window(ledger_path, since, until)

    per_artifact: dict[str, dict] = {}
    # icp_qualified_engagers is rendered as "ICP engager(s)" — a count of people. One
    # person engaging twice is one engager, exactly as in funnel.fold_funnel.
    icp_engagers_seen: dict[str, set[str]] = {}
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
            identity = row.get("identity")
            if identity:
                seen = icp_engagers_seen.setdefault(pid, set())
                if identity not in seen:
                    seen.add(identity)
                    bucket["icp_qualified_engagers"] += 1

    total = attributed + unattributed
    artifacts = [b for pid, b in sorted(per_artifact.items()) if pid != UNATTRIBUTED]

    # The unattributed bucket is dropped from the artifact table, so its non-signup
    # residual has to surface at the top level or it is counted and then thrown away.
    # A ref click or an ICP engager we could not trace back to an artifact is a real
    # number about how much of the funnel this engine cannot yet see.
    residual = per_artifact.get(UNATTRIBUTED, {})

    return {
        "window": {"since": since, "until": until},
        "artifacts": artifacts,
        "attributed_signups": attributed,
        "unattributed_signups": unattributed,
        "unattributed_share": (unattributed / total) if total else 0.0,
        "unattributed_ref_click_throughs": residual.get("ref_click_throughs", 0),
        "unattributed_icp_qualified_engagers": residual.get("icp_qualified_engagers", 0),
    }


def render_text(report: dict) -> str:
    lines = [
        f"Attribution {report['window']['since']} → {report['window']['until']}",
        f"  attributed signups:   {report['attributed_signups']}",
        f"  unattributed signups: {report['unattributed_signups']} "
        f"({report['unattributed_share']:.0%} of total)",
        f"  unattributed ref clicks:   {report['unattributed_ref_click_throughs']}",
        f"  unattributed ICP engagers: {report['unattributed_icp_qualified_engagers']}",
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
