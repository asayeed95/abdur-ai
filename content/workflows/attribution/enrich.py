"""enrich.py — the enrichment boundary.

Three outcomes, deliberately distinct:
  * a profile dict  — enrichment succeeded and matched
  * None            — enrichment succeeded and found nobody (record as *unenriched*)
  * raise           — enrichment could not run (transport/quota). NEVER degrade this
                      into None: a dead vendor scored as "not ICP" is a forged green.

The client is injected so every test runs offline. Any object with ping() and
enrich_prospect() satisfies the protocol.
"""

from __future__ import annotations


class EnrichmentUnavailable(RuntimeError):
    """The enrichment vendor could not be reached or refused the request."""


def probe(client) -> dict:
    """Liveness + quota check. Reports health; does not raise on an unhealthy vendor."""
    try:
        raw = client.ping()
    except Exception as exc:  # noqa: BLE001 - probe must report, never propagate
        return {"ok": False, "detail": f"{type(exc).__name__}: {exc}", "quota_remaining": None}
    return {
        "ok": bool(raw.get("ok")),
        "detail": str(raw.get("detail", "")),
        "quota_remaining": raw.get("quota_remaining"),
    }


def _call(client, *, email=None, handle=None):
    identifier = email if email is not None else handle
    if not identifier or not str(identifier).strip():
        raise ValueError("enrichment requires a non-blank identifier")
    try:
        return client.enrich_prospect(email=email, handle=handle)
    except Exception as exc:  # noqa: BLE001 - re-raised as a typed, catchable failure
        raise EnrichmentUnavailable(f"enrichment call failed: {type(exc).__name__}: {exc}") from exc


def enrich_email(email: str, client) -> dict | None:
    return _call(client, email=email)


def enrich_handle(handle: str, client) -> dict | None:
    return _call(client, handle=handle)
