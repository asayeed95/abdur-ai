"""Offline tests for the append-only attribution ledger and funnel projection.

Run: python3 content/workflows/attribution/tests/test_funnel.py
"""

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import funnel


class FunnelTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.ledger = Path(self.tmp.name) / "attribution.jsonl"

    def tearDown(self):
        self.tmp.cleanup()

    def _event(self, stage, identity=None, icp=False, when="2026-07-30T10:00:00Z"):
        return funnel.StageEvent(
            event_id=funnel.make_event_id("pkt_a", stage, identity, when),
            packet_id="pkt_a",
            stage=stage,
            observed_at=when,
            confidence="ref",
            identity=identity,
            icp_qualified=icp,
        )

    def test_append_then_fold_counts_each_stage(self):
        funnel.append_event(self.ledger, self._event("signup", "a@example.com", icp=True))
        funnel.append_event(self.ledger, self._event("ref_click", None, when="2026-07-30T11:00:00Z"))
        funnel.append_event(self.ledger, self._event("engager", "@dev", icp=True))

        vec = funnel.fold_funnel(self.ledger, "pkt_a")
        self.assertEqual(vec.signups, 1)
        self.assertEqual(vec.icp_qualified_signups, 1)
        self.assertEqual(vec.ref_click_throughs, 1)
        self.assertEqual(vec.engagers, ["@dev"])
        self.assertEqual(vec.icp_qualified_engagers, 1)

    def test_duplicate_event_id_is_a_noop(self):
        ev = self._event("signup", "a@example.com", icp=True)
        self.assertTrue(funnel.append_event(self.ledger, ev))
        self.assertFalse(funnel.append_event(self.ledger, ev))

        vec = funnel.fold_funnel(self.ledger, "pkt_a")
        self.assertEqual(vec.signups, 1)

    def test_fold_ignores_other_packets(self):
        funnel.append_event(self.ledger, self._event("signup", "a@example.com"))
        other = funnel.StageEvent(
            event_id="e_other", packet_id="pkt_b", stage="signup",
            observed_at="2026-07-30T10:00:00Z",
        )
        funnel.append_event(self.ledger, other)

        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_a").signups, 1)
        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_b").signups, 1)

    def test_unknown_stage_is_rejected(self):
        bad = funnel.StageEvent(
            event_id="e_bad", packet_id="pkt_a", stage="teleport",
            observed_at="2026-07-30T10:00:00Z",
        )
        with self.assertRaises(ValueError):
            funnel.append_event(self.ledger, bad)

    def test_corrupt_row_raises_rather_than_silently_skipping(self):
        funnel.append_event(self.ledger, self._event("signup", "a@example.com"))
        with self.ledger.open("a", encoding="utf-8") as fh:
            fh.write("{not json\n")
        with self.assertRaises(ValueError):
            funnel.fold_funnel(self.ledger, "pkt_a")

    def test_missing_ledger_folds_to_empty_vector(self):
        vec = funnel.fold_funnel(self.ledger, "pkt_a")
        self.assertEqual(vec.signups, 0)
        self.assertEqual(vec.engagers, [])


if __name__ == "__main__":
    unittest.main()
