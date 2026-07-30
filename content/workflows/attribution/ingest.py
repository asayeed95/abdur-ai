"""ingest.py — the attribution ingress contract.

One inbound payload becomes exactly one ledger event. A signup that matches no
artifact is written against UNATTRIBUTED rather than dropped: the unattributed
bucket is a reported value, not a gap.

A ref_click is an anonymous HTTP request. It carries no identifier and is never
sent to the enricher -- see the design spec's "what is not measurable" table.
"""

from __future__ import annotations

from pathlib import Path

import carriers
import enrich as enrichment
import funnel
import icp

UNATTRIBUTED = "__unattributed__"
KINDS = ("signup", "engager", "ref_click")
REQUIRED_FIELDS = ("kind", "observed_at")

# Kinds that carry no identifier. Their event id has nothing to distinguish two real
# events in the same second, so the caller supplies a `nonce` (a request id is the
# natural source). Without one, the second click collapses into the first as a replay.
IDENTITY_LESS_KINDS = ("ref_click",)

_STAGE_FOR_KIND = {"signup": "signup", "engager": "engager", "ref_click": "ref_click"}


def validate_payload(payload: dict) -> tuple[bool, list[str]]:
    errors: list[str] = []
    if not isinstance(payload, dict):
        return False, ["payload is not an object"]
    for field in REQUIRED_FIELDS:
        if not payload.get(field):
            errors.append(f"missing required field {field!r}")
    kind = payload.get("kind")
    if kind and kind not in KINDS:
        errors.append(f"unknown kind {kind!r}; expected one of {KINDS}")
    if kind == "signup" and not payload.get("email"):
        errors.append("signup requires 'email'")
    if kind == "engager" and not payload.get("handle"):
        errors.append("engager requires 'handle'")
    return (not errors), errors


def ingest(
    payload: dict,
    ledger_path: Path,
    candidates: list[dict],
    client,
    rules: dict,
    window_hours: int = 24,
) -> funnel.StageEvent:
    ok, errors = validate_payload(payload)
    if not ok:
        raise ValueError("invalid attribution payload: " + "; ".join(errors))

    kind = payload["kind"]
    result = carriers.resolve_attribution(payload, candidates, window_hours=window_hours)
    packet_id = result.packet_id or UNATTRIBUTED

    identity = None
    icp_qualified = False

    if kind == "signup":
        identity = payload["email"]
        profile = enrichment.enrich_email(identity, client)
        if profile is not None:
            icp_qualified = icp.score_profile(profile, rules).qualified
    elif kind == "engager":
        identity = payload["handle"]
        profile = enrichment.enrich_handle(identity, client)
        if profile is not None:
            icp_qualified = icp.score_profile(profile, rules).qualified

    # An identified kind is already distinguished by its identity, and replaying the
    # same payload must stay a no-op, so a nonce is only consulted where it is the
    # only thing that can tell a second event from a retry.
    nonce = payload.get("nonce") if kind in IDENTITY_LESS_KINDS else None

    event = funnel.StageEvent(
        event_id=funnel.make_event_id(
            packet_id, _STAGE_FOR_KIND[kind], identity, payload["observed_at"], nonce=nonce),
        packet_id=packet_id,
        stage=_STAGE_FOR_KIND[kind],
        observed_at=payload["observed_at"],
        confidence=result.confidence,
        identity=identity,
        icp_qualified=icp_qualified,
    )
    funnel.append_event(ledger_path, event)
    return event
