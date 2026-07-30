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

# A test pepper. In production this is a secret held by the caller; the library
# never supplies a default, so an unpeppered digest cannot be produced by accident.
PEPPER = "test-pepper"

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
            self.ledger, CANDIDATES, IcpClient(), RULES, identity_pepper=PEPPER,
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
            self.ledger, [], IcpClient(), RULES, identity_pepper=PEPPER,
        )
        self.assertEqual(ev.packet_id, funnel.UNATTRIBUTED)
        vec = funnel.fold_funnel(self.ledger, funnel.UNATTRIBUTED)
        self.assertEqual(vec.signups, 1)

    def test_no_enrichment_match_records_signup_as_unqualified(self):
        ev = ingest.ingest(
            {"kind": "signup", "observed_at": "2026-07-30T12:00:00Z",
             "email": "ghost@example.com", "ref": "r_a"},
            self.ledger, CANDIDATES, NoMatchClient(), RULES, identity_pepper=PEPPER,
        )
        self.assertFalse(ev.icp_qualified)
        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_a").signups, 1)

    def test_dead_enricher_raises_and_writes_nothing(self):
        with self.assertRaises(enrich.EnrichmentUnavailable):
            ingest.ingest(
                {"kind": "signup", "observed_at": "2026-07-30T12:00:00Z",
                 "email": "dev@example.com", "ref": "r_a"},
                self.ledger, CANDIDATES, DeadClient(), RULES, identity_pepper=PEPPER,
            )
        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_a").signups, 0)

    def test_ref_click_is_anonymous_and_never_enriched(self):
        class Exploding(IcpClient):
            def enrich_prospect(self, email=None, handle=None):
                raise AssertionError("ref_click must never call the enricher")

        ev = ingest.ingest(
            {"kind": "ref_click", "observed_at": "2026-07-30T12:00:00Z",
             "ref": "r_a", "nonce": "req-1"},
            self.ledger, CANDIDATES, Exploding(), RULES, identity_pepper=PEPPER,
        )
        self.assertFalse(ev.icp_qualified)
        self.assertIsNone(ev.identity_hash)
        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_a").ref_click_throughs, 1)

    def test_replaying_the_same_payload_does_not_double_count(self):
        payload = {"kind": "signup", "observed_at": "2026-07-30T12:00:00Z",
                   "email": "dev@example.com", "ref": "r_a"}
        ingest.ingest(payload, self.ledger, CANDIDATES, IcpClient(), RULES, identity_pepper=PEPPER)
        ingest.ingest(dict(payload), self.ledger, CANDIDATES, IcpClient(), RULES, identity_pepper=PEPPER)
        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_a").signups, 1)

    def test_invalid_payload_raises(self):
        with self.assertRaises(ValueError):
            ingest.ingest({"kind": "signup"}, self.ledger, CANDIDATES, IcpClient(), RULES,
                          identity_pepper=PEPPER)

    def test_engager_is_enriched_via_handle_and_recorded(self):
        seen = {}

        class Spy(IcpClient):
            def enrich_prospect(self, email=None, handle=None):
                seen["email"], seen["handle"] = email, handle
                return {"title": "Staff Engineer", "stack": ["retell"]}

        ev = ingest.ingest(
            {"kind": "engager", "observed_at": "2026-07-30T12:00:00Z",
             "handle": "@dev", "ref": "r_a"},
            self.ledger, CANDIDATES, Spy(), RULES, identity_pepper=PEPPER,
        )
        self.assertEqual(ev.packet_id, "pkt_a")
        self.assertEqual(ev.stage, "engager")
        self.assertEqual(ev.identity_hash, funnel.hash_identity("@dev", PEPPER))
        self.assertTrue(ev.icp_qualified)

        # the enricher still receives the raw handle — it is the last thing that does
        self.assertIsNone(seen["email"])
        self.assertEqual(seen["handle"], "@dev")

        vec = funnel.fold_funnel(self.ledger, "pkt_a")
        self.assertEqual(vec.engagers, [funnel.hash_identity("@dev", PEPPER)])
        self.assertEqual(vec.icp_qualified_engagers, 1)

    # --- C2: two genuinely distinct anonymous clicks in the same second ---

    def test_two_same_second_ref_clicks_with_distinct_nonces_both_record(self):
        base = {"kind": "ref_click", "observed_at": "2026-07-30T12:00:00Z", "ref": "r_a"}
        first = ingest.ingest(
            {**base, "nonce": "req-1"}, self.ledger, CANDIDATES, IcpClient(), RULES,
            identity_pepper=PEPPER)
        second = ingest.ingest(
            {**base, "nonce": "req-2"}, self.ledger, CANDIDATES, IcpClient(), RULES,
            identity_pepper=PEPPER)

        self.assertNotEqual(first.event_id, second.event_id)
        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_a").ref_click_throughs, 2)

    def test_replaying_one_ref_click_nonce_is_still_a_noop(self):
        payload = {"kind": "ref_click", "observed_at": "2026-07-30T12:00:00Z",
                   "ref": "r_a", "nonce": "req-1"}
        ingest.ingest(payload, self.ledger, CANDIDATES, IcpClient(), RULES, identity_pepper=PEPPER)
        ingest.ingest(dict(payload), self.ledger, CANDIDATES, IcpClient(), RULES, identity_pepper=PEPPER)
        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_a").ref_click_throughs, 1)

    def test_a_nonce_never_defeats_idempotency_on_an_identified_kind(self):
        payload = {"kind": "signup", "observed_at": "2026-07-30T12:00:00Z",
                   "email": "dev@example.com", "ref": "r_a"}
        ingest.ingest({**payload, "nonce": "req-1"}, self.ledger, CANDIDATES,
                      IcpClient(), RULES, identity_pepper=PEPPER)
        ingest.ingest({**payload, "nonce": "req-2"}, self.ledger, CANDIDATES,
                      IcpClient(), RULES, identity_pepper=PEPPER)
        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_a").signups, 1)

    def test_validate_rejects_engager_without_handle(self):
        ok, errors = ingest.validate_payload(
            {"kind": "engager", "observed_at": "2026-07-30T12:00:00Z"}
        )
        self.assertFalse(ok)
        self.assertTrue(any("handle" in e for e in errors))

    # --- R1: only a pseudonymous identity is persisted; raw PII never reaches the ledger ---

    def test_raw_email_never_lands_in_the_ledger(self):
        """The ledger is append-only and never rewritten, so PII written once is written forever."""
        ev = ingest.ingest(
            {"kind": "signup", "observed_at": "2026-07-30T12:00:00Z",
             "email": "dev@example.com", "ref": "r_a"},
            self.ledger, CANDIDATES, IcpClient(), RULES, identity_pepper=PEPPER,
        )

        raw = self.ledger.read_text(encoding="utf-8")
        self.assertNotIn("dev@example.com", raw)
        self.assertNotIn("@example.com", raw)
        self.assertNotIn('"identity"', raw)

        # the event still counts — pseudonymisation must not cost a signup
        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_a").signups, 1)
        self.assertTrue(ev.identity_hash.startswith("idh_"))
        self.assertIn(ev.identity_hash, raw)

    def test_raw_handle_never_lands_in_the_ledger(self):
        ev = ingest.ingest(
            {"kind": "engager", "observed_at": "2026-07-30T12:00:00Z",
             "handle": "@dev", "ref": "r_a"},
            self.ledger, CANDIDATES, IcpClient(), RULES, identity_pepper=PEPPER,
        )
        raw = self.ledger.read_text(encoding="utf-8")
        self.assertNotIn("@dev", raw)
        self.assertEqual(ev.identity_hash, funnel.hash_identity("@dev", PEPPER))
        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_a").engagers, [ev.identity_hash])

    def test_identity_pepper_is_a_required_argument(self):
        """No default pepper: an unpeppered digest of an email is reversible by rainbow table."""
        with self.assertRaises(TypeError):
            ingest.ingest(  # deliberately omits identity_pepper
                {"kind": "signup", "observed_at": "2026-07-30T12:00:00Z",
                 "email": "dev@example.com", "ref": "r_a"},
                self.ledger, CANDIDATES, IcpClient(), RULES,
            )

    def test_event_id_is_derived_from_the_hash_not_the_raw_identity(self):
        ev = ingest.ingest(
            {"kind": "signup", "observed_at": "2026-07-30T12:00:00Z",
             "email": "dev@example.com", "ref": "r_a"},
            self.ledger, CANDIDATES, IcpClient(), RULES, identity_pepper=PEPPER,
        )
        expected = funnel.make_event_id(
            "pkt_a", "signup", funnel.hash_identity("dev@example.com", PEPPER),
            "2026-07-30T12:00:00Z")
        self.assertEqual(ev.event_id, expected)

    def test_the_same_person_hashes_identically_across_casing_and_padding(self):
        first = ingest.ingest(
            {"kind": "signup", "observed_at": "2026-07-30T12:00:00Z",
             "email": "dev@example.com", "ref": "r_a"},
            self.ledger, CANDIDATES, IcpClient(), RULES, identity_pepper=PEPPER,
        )
        second = ingest.ingest(
            {"kind": "signup", "observed_at": "2026-07-30T12:00:00Z",
             "email": "  DEV@Example.com  ", "ref": "r_a"},
            self.ledger, CANDIDATES, IcpClient(), RULES, identity_pepper=PEPPER,
        )
        self.assertEqual(first.identity_hash, second.identity_hash)
        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_a").signups, 1)

    # --- R2: an identity-less kind without a nonce silently under-counts, so reject it ---

    def test_validate_rejects_ref_click_without_a_nonce(self):
        ok, errors = ingest.validate_payload(
            {"kind": "ref_click", "observed_at": "2026-07-30T12:00:00Z", "ref": "r_a"}
        )
        self.assertFalse(ok)
        self.assertTrue(any("nonce" in e for e in errors))

    def test_validate_rejects_a_blank_ref_click_nonce(self):
        for blank in (None, "", "   "):
            with self.subTest(nonce=blank):
                ok, errors = ingest.validate_payload(
                    {"kind": "ref_click", "observed_at": "2026-07-30T12:00:00Z",
                     "ref": "r_a", "nonce": blank}
                )
                self.assertFalse(ok)
                self.assertTrue(any("nonce" in e for e in errors))

    def test_ingesting_a_ref_click_without_a_nonce_raises(self):
        with self.assertRaises(ValueError):
            ingest.ingest(
                {"kind": "ref_click", "observed_at": "2026-07-30T12:00:00Z", "ref": "r_a"},
                self.ledger, CANDIDATES, IcpClient(), RULES, identity_pepper=PEPPER,
            )

    # --- R4: UNATTRIBUTED is a domain constant, re-exported here, never redefined ---

    def test_unattributed_is_the_domain_layer_constant(self):
        self.assertIs(ingest.UNATTRIBUTED, funnel.UNATTRIBUTED)


if __name__ == "__main__":
    unittest.main()
