"""Offline tests for the weekly attribution rollup.

Run: python3 content/workflows/attribution/tests/test_report.py
"""

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import funnel
import report


class ReportTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.ledger = Path(self.tmp.name) / "attribution.jsonl"

    def tearDown(self):
        self.tmp.cleanup()

    def _signup(self, packet_id, identity_hash, when="2026-07-30T12:00:00Z", icp=False):
        funnel.append_event(self.ledger, funnel.StageEvent(
            event_id=funnel.make_event_id(packet_id, "signup", identity_hash, when),
            packet_id=packet_id, stage="signup", observed_at=when,
            confidence="ref", identity_hash=identity_hash, icp_qualified=icp,
        ))

    def _event(self, packet_id, stage, identity_hash=None, when="2026-07-30T12:00:00Z", icp=False):
        funnel.append_event(self.ledger, funnel.StageEvent(
            event_id=funnel.make_event_id(packet_id, stage, identity_hash, when),
            packet_id=packet_id, stage=stage, observed_at=when, confidence="ref",
            identity_hash=identity_hash, icp_qualified=icp))

    def test_report_splits_attributed_from_unattributed(self):
        self._signup("pkt_a", "idh_a", icp=True)
        self._signup("pkt_a", "idh_b")
        self._signup(funnel.UNATTRIBUTED, "idh_c")

        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        self.assertEqual(rep["attributed_signups"], 2)
        self.assertEqual(rep["unattributed_signups"], 1)
        self.assertAlmostEqual(rep["unattributed_share"], 1 / 3, places=4)

    def test_unattributed_is_excluded_from_the_artifact_table(self):
        self._signup("pkt_a", "idh_a")
        self._signup(funnel.UNATTRIBUTED, "idh_c")

        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        ids = [row["packet_id"] for row in rep["artifacts"]]
        self.assertIn("pkt_a", ids)
        self.assertNotIn(funnel.UNATTRIBUTED, ids)

    def test_events_outside_the_window_are_excluded(self):
        self._signup("pkt_a", "idh_a", when="2026-07-01T12:00:00Z")
        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        self.assertEqual(rep["attributed_signups"], 0)

    def test_zero_signups_yields_zero_share_not_a_division_error(self):
        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        self.assertEqual(rep["unattributed_share"], 0.0)

    def test_render_text_names_the_unattributed_bucket(self):
        self._signup(funnel.UNATTRIBUTED, "idh_c")
        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        text = report.render_text(rep)
        self.assertIn("unattributed", text.lower())

    def test_per_artifact_fields_are_counted_by_stage(self):
        self._signup("pkt_a", "idh_a", icp=True)
        self._signup("pkt_a", "idh_b")
        self._event("pkt_a", "ref_click", None, when="2026-07-30T12:05:00Z")
        self._event("pkt_a", "ref_click", None, when="2026-07-30T12:06:00Z")
        self._event("pkt_a", "engager", "idh_dev", icp=True)
        self._event("pkt_a", "engager", "idh_other")

        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        row = next(r for r in rep["artifacts"] if r["packet_id"] == "pkt_a")
        self.assertEqual(row["signups"], 2)
        self.assertEqual(row["icp_qualified_signups"], 1)
        self.assertEqual(row["ref_click_throughs"], 2)
        self.assertEqual(row["icp_qualified_engagers"], 1)
        # stage isolation: ref_click and engager events must not inflate the signup count
        self.assertEqual(rep["attributed_signups"], 2)

    def test_window_boundaries_are_inclusive(self):
        self._signup("pkt_a", "idh_a", when="2026-07-29T00:00:00Z")
        self._signup("pkt_b", "idh_b", when="2026-07-31T00:00:00Z")
        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        self.assertEqual(rep["attributed_signups"], 2)

    # --- I1: "ICP engager(s)" is a count of people in the report too ---

    def test_icp_qualified_engagers_in_the_report_count_people_not_events(self):
        self._event("pkt_a", "engager", "idh_dev", when="2026-07-30T12:00:00Z", icp=True)
        self._event("pkt_a", "engager", "idh_dev", when="2026-07-30T13:00:00Z", icp=True)
        self._event("pkt_a", "engager", "idh_other", when="2026-07-30T14:00:00Z", icp=True)

        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        row = next(r for r in rep["artifacts"] if r["packet_id"] == "pkt_a")
        self.assertEqual(row["icp_qualified_engagers"], 2)

    # --- I2: the unattributed residual is reported, not computed then discarded ---

    def test_unattributed_ref_clicks_and_engagers_are_reported_not_discarded(self):
        self._event(funnel.UNATTRIBUTED, "ref_click", None, when="2026-07-30T12:00:00Z")
        self._event(funnel.UNATTRIBUTED, "ref_click", None, when="2026-07-30T12:01:00Z")
        self._event(funnel.UNATTRIBUTED, "engager", "idh_ghost", when="2026-07-30T12:02:00Z", icp=True)

        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        self.assertEqual(rep["unattributed_ref_click_throughs"], 2)
        self.assertEqual(rep["unattributed_icp_qualified_engagers"], 1)

        text = report.render_text(rep).lower()
        self.assertIn("unattributed ref clicks", text)
        self.assertIn("unattributed icp engagers", text)

    def test_unattributed_residual_keys_exist_on_an_empty_window(self):
        rep = report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")
        self.assertEqual(rep["unattributed_ref_click_throughs"], 0)
        self.assertEqual(rep["unattributed_icp_qualified_engagers"], 0)

    # --- I7: report parses timestamps through the one shared helper ---

    def test_non_string_observed_at_raises_valueerror_through_the_shared_parser(self):
        with self.ledger.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps({"event_id": "e_bad", "packet_id": "pkt_a",
                                 "stage": "signup", "observed_at": 20260730}) + "\n")
        with self.assertRaises(ValueError):
            report.weekly_report(self.ledger, "2026-07-29T00:00:00Z", "2026-07-31T00:00:00Z")


if __name__ == "__main__":
    unittest.main()
