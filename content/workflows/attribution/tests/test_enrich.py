"""Offline tests for the enrichment boundary.

Run: python3 content/workflows/attribution/tests/test_enrich.py
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import enrich


class OkClient:
    def ping(self):
        return {"ok": True, "quota_remaining": 500}

    def enrich_prospect(self, email=None, handle=None):
        return {"title": "Staff Engineer", "company_stage": "seed", "stack": ["retell"]}


class DownClient:
    def ping(self):
        return {"ok": False, "detail": "503 upstream"}

    def enrich_prospect(self, email=None, handle=None):
        raise ConnectionError("upstream down")


class EmptyClient:
    def ping(self):
        return {"ok": True, "quota_remaining": 3}

    def enrich_prospect(self, email=None, handle=None):
        return None


class EnrichTests(unittest.TestCase):
    def test_probe_reports_healthy_client(self):
        res = enrich.probe(OkClient())
        self.assertTrue(res["ok"])
        self.assertEqual(res["quota_remaining"], 500)

    def test_probe_reports_unhealthy_client_without_raising(self):
        res = enrich.probe(DownClient())
        self.assertFalse(res["ok"])
        self.assertIn("503", res["detail"])

    def test_enrich_email_returns_profile(self):
        profile = enrich.enrich_email("dev@example.com", OkClient())
        self.assertEqual(profile["title"], "Staff Engineer")

    def test_no_match_returns_none_not_an_empty_profile(self):
        self.assertIsNone(enrich.enrich_email("nobody@example.com", EmptyClient()))

    def test_transport_failure_raises_rather_than_returning_none(self):
        with self.assertRaises(enrich.EnrichmentUnavailable):
            enrich.enrich_email("dev@example.com", DownClient())

    def test_enrich_handle_uses_the_handle_argument(self):
        seen = {}

        class Spy(OkClient):
            def enrich_prospect(self, email=None, handle=None):
                seen["email"], seen["handle"] = email, handle
                return {"title": "CTO"}

        enrich.enrich_handle("@dev", Spy())
        self.assertIsNone(seen["email"])
        self.assertEqual(seen["handle"], "@dev")

    def test_blank_identifier_raises(self):
        with self.assertRaises(ValueError):
            enrich.enrich_email("   ", OkClient())


if __name__ == "__main__":
    unittest.main()
