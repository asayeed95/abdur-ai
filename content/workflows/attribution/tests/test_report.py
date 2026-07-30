"""Offline tests for the weekly attribution rollup.

Run: python3 content/workflows/attribution/tests/test_report.py
"""

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import funnel
import ingest
import report


class ReportTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.ledger = Path(self.tmp.name) / "attribution.jsonl"

    def tearDown(self):
        self.tmp.cleanup()

    def _signup(self, packet_id, identity, when="2026-07-30T12:00:00Z", icp=False):
        funnel.append_event(self.ledger, funnel.StageEvent(
            event_id=funnel.make_event_id(packet_id, "signup", identity, when),
            packet_id=packet_id, stage="signup", observed_at=when,
            confidence="ref", identity=identity, icp_qualified=icp,
        ))

    def _event(self, packet_id, stage, identity=None, when="2026-07-30T12:00:00Z", icp=False):
        funnel.append_event(self.ledger, funnel.StageEvent(
            event_id=funnel.make_event_id(packet_id, stage, identity, when),
            packet_id=packet_id, stage=stage, observed_at=when, confidence="ref",
            identity=identity, icp_qualified=icp))

    def test_report_splits_attributed_from_unattributed(self):
        self._signup("pkt_a", "a@example.com", icp=True)
        self._signup("pkt_a", "b@example.com")
        self._signup(ingest.UNATTRIBUTED, "c@example.com")

        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        self.assertEqual(rep["attributed_signups"], 2)
        self.assertEqual(rep["unattributed_signups"], 1)
        self.assertAlmostEqual(rep["unattributed_share"], 1 / 3, places=4)

    def test_unattributed_is_excluded_from_the_artifact_table(self):
        self._signup("pkt_a", "a@example.com")
        self._signup(ingest.UNATTRIBUTED, "c@example.com")

        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        ids = [row["packet_id"] for row in rep["artifacts"]]
        self.assertIn("pkt_a", ids)
        self.assertNotIn(ingest.UNATTRIBUTED, ids)

    def test_events_outside_the_window_are_excluded(self):
        self._signup("pkt_a", "a@example.com", when="2026-07-01T12:00:00Z")
        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        self.assertEqual(rep["attributed_signups"], 0)

    def test_zero_signups_yields_zero_share_not_a_division_error(self):
        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        self.assertEqual(rep["unattributed_share"], 0.0)

    def test_render_text_names_the_unattributed_bucket(self):
        self._signup(ingest.UNATTRIBUTED, "c@example.com")
        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        text = report.render_text(rep)
        self.assertIn("unattributed", text.lower())

    def test_per_artifact_fields_are_counted_by_stage(self):
        self._signup("pkt_a", "a@example.com", icp=True)
        self._signup("pkt_a", "b@example.com")
        self._event("pkt_a", "ref_click", None, when="2026-07-30T12:05:00Z")
        self._event("pkt_a", "ref_click", None, when="2026-07-30T12:06:00Z")
        self._event("pkt_a", "engager", "@dev", icp=True)
        self._event("pkt_a", "engager", "@other")

        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        row = next(r for r in rep["artifacts"] if r["packet_id"] == "pkt_a")
        self.assertEqual(row["signups"], 2)
        self.assertEqual(row["icp_qualified_signups"], 1)
        self.assertEqual(row["ref_click_throughs"], 2)
        self.assertEqual(row["icp_qualified_engagers"], 1)
        # stage isolation: ref_click and engager events must not inflate the signup count
        self.assertEqual(rep["attributed_signups"], 2)

    def test_window_boundaries_are_inclusive(self):
        self._signup("pkt_a", "a@example.com", when="2026-07-29T00:00:00Z")
        self._signup("pkt_b", "b@example.com", when="2026-07-31T00:00:00Z")
        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        self.assertEqual(rep["attributed_signups"], 2)


if __name__ == "__main__":
    unittest.main()
