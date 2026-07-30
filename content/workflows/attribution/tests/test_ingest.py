"""End-to-end offline tests for the attribution ingress.

Run: python3 content/workflows/attribution/tests/test_ingest.py
"""

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import enrich
import funnel
import ingest

RULES = {
    "threshold": 60,
    "signals": [
        {"name": "voice_stack", "field": "stack", "any_of": ["retell", "vapi"], "points": 40},
        {"name": "senior_title", "field": "title", "any_of": ["staff engineer"], "points": 30},
    ],
}


class IcpClient:
    def ping(self):
        return {"ok": True, "quota_remaining": 10}

    def enrich_prospect(self, email=None, handle=None):
        return {"title": "Staff Engineer", "stack": ["retell"]}


class NoMatchClient:
    def ping(self):
        return {"ok": True, "quota_remaining": 10}

    def enrich_prospect(self, email=None, handle=None):
        return None


class DeadClient:
    def ping(self):
        return {"ok": False, "detail": "down"}

    def enrich_prospect(self, email=None, handle=None):
        raise ConnectionError("down")


CANDIDATES = [{"packet_id": "pkt_a", "published_at": "2026-07-30T09:00:00Z",
               "ref": "r_a", "utm_campaign": None, "declared_token": None}]


class IngestTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.ledger = Path(self.tmp.name) / "attribution.jsonl"

    def tearDown(self):
        self.tmp.cleanup()

    def test_validate_rejects_missing_fields(self):
        ok, errors = ingest.validate_payload({"kind": "signup"})
        self.assertFalse(ok)
        self.assertTrue(any("observed_at" in e for e in errors))

    def test_validate_rejects_unknown_kind(self):
        ok, errors = ingest.validate_payload({"kind": "teleport", "observed_at": "2026-07-30T12:00:00Z"})
        self.assertFalse(ok)

    def test_qualified_signup_lands_on_the_right_artifact(self):
        ev = ingest.ingest(
            {"kind": "signup", "observed_at": "2026-07-30T12:00:00Z",
             "email": "dev@example.com", "ref": "r_a"},
            self.ledger, CANDIDATES, IcpClient(), RULES,
        )
        self.assertEqual(ev.packet_id, "pkt_a")
        self.assertEqual(ev.confidence, "ref")
        self.assertTrue(ev.icp_qualified)

        vec = funnel.fold_funnel(self.ledger, "pkt_a")
        self.assertEqual(vec.signups, 1)
        self.assertEqual(vec.icp_qualified_signups, 1)

    def test_unattributed_signup_is_recorded_not_dropped(self):
        ev = ingest.ingest(
            {"kind": "signup", "observed_at": "2026-07-30T12:00:00Z", "email": "dev@example.com"},
            self.ledger, [], IcpClient(), RULES,
        )
        self.assertEqual(ev.packet_id, ingest.UNATTRIBUTED)
        vec = funnel.fold_funnel(self.ledger, ingest.UNATTRIBUTED)
        self.assertEqual(vec.signups, 1)

    def test_no_enrichment_match_records_signup_as_unqualified(self):
        ev = ingest.ingest(
            {"kind": "signup", "observed_at": "2026-07-30T12:00:00Z",
             "email": "ghost@example.com", "ref": "r_a"},
            self.ledger, CANDIDATES, NoMatchClient(), RULES,
        )
        self.assertFalse(ev.icp_qualified)
        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_a").signups, 1)

    def test_dead_enricher_raises_and_writes_nothing(self):
        with self.assertRaises(enrich.EnrichmentUnavailable):
            ingest.ingest(
                {"kind": "signup", "observed_at": "2026-07-30T12:00:00Z",
                 "email": "dev@example.com", "ref": "r_a"},
                self.ledger, CANDIDATES, DeadClient(), RULES,
            )
        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_a").signups, 0)

    def test_ref_click_is_anonymous_and_never_enriched(self):
        class Exploding(IcpClient):
            def enrich_prospect(self, email=None, handle=None):
                raise AssertionError("ref_click must never call the enricher")

        ev = ingest.ingest(
            {"kind": "ref_click", "observed_at": "2026-07-30T12:00:00Z", "ref": "r_a"},
            self.ledger, CANDIDATES, Exploding(), RULES,
        )
        self.assertFalse(ev.icp_qualified)
        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_a").ref_click_throughs, 1)

    def test_replaying_the_same_payload_does_not_double_count(self):
        payload = {"kind": "signup", "observed_at": "2026-07-30T12:00:00Z",
                   "email": "dev@example.com", "ref": "r_a"}
        ingest.ingest(payload, self.ledger, CANDIDATES, IcpClient(), RULES)
        ingest.ingest(dict(payload), self.ledger, CANDIDATES, IcpClient(), RULES)
        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_a").signups, 1)

    def test_invalid_payload_raises(self):
        with self.assertRaises(ValueError):
            ingest.ingest({"kind": "signup"}, self.ledger, CANDIDATES, IcpClient(), RULES)

    def test_engager_is_enriched_via_handle_and_recorded(self):
        seen = {}

        class Spy(IcpClient):
            def enrich_prospect(self, email=None, handle=None):
                seen["email"], seen["handle"] = email, handle
                return {"title": "Staff Engineer", "stack": ["retell"]}

        ev = ingest.ingest(
            {"kind": "engager", "observed_at": "2026-07-30T12:00:00Z",
             "handle": "@dev", "ref": "r_a"},
            self.ledger, CANDIDATES, Spy(), RULES,
        )
        self.assertEqual(ev.packet_id, "pkt_a")
        self.assertEqual(ev.stage, "engager")
        self.assertEqual(ev.identity, "@dev")
        self.assertTrue(ev.icp_qualified)

        # the engager path must use the handle slot, never the email slot
        self.assertIsNone(seen["email"])
        self.assertEqual(seen["handle"], "@dev")

        vec = funnel.fold_funnel(self.ledger, "pkt_a")
        self.assertEqual(vec.engagers, ["@dev"])
        self.assertEqual(vec.icp_qualified_engagers, 1)

    def test_validate_rejects_engager_without_handle(self):
        ok, errors = ingest.validate_payload(
            {"kind": "engager", "observed_at": "2026-07-30T12:00:00Z"}
        )
        self.assertFalse(ok)
        self.assertTrue(any("handle" in e for e in errors))


if __name__ == "__main__":
    unittest.main()
