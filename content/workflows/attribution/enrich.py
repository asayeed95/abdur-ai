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
    """Liveness + quota check. Reports health; does not raise on an unhealthy vendor.

    Response reading happens inside the try for the same reason the call does: a vendor
    that answers `None`, a list, or an HTML error body is precisely the unhealthy state
    this function exists to detect, and detecting it by raising out of a health check
    would leave the caller with no health answer at all.
    """
    try:
        raw = client.ping()
        if not isinstance(raw, dict):
            return {
                "ok": False,
                "detail": f"vendor returned {type(raw).__name__}, not a health object",
                "quota_remaining": None,
            }
        return {
            "ok": bool(raw.get("ok")),
            "detail": str(raw.get("detail", "")),
            "quota_remaining": raw.get("quota_remaining"),
        }
    except Exception as exc:  # noqa: BLE001 - probe must report, never propagate
        return {"ok": False, "detail": f"{type(exc).__name__}: {exc}", "quota_remaining": None}


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
