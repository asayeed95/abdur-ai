"""Offline tests for the append-only attribution ledger and funnel projection.

Run: python3 content/workflows/attribution/tests/test_funnel.py
"""

import json
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

    def _write_raw(self, row):
        """Append a row straight to the JSONL, bypassing append_event's guards."""
        with self.ledger.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(row, sort_keys=True) + "\n")

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

    # --- C1: idempotency must hold on the read path, not only on append ---

    def test_duplicate_event_id_row_in_the_ledger_is_counted_once(self):
        """A duplicate row (concurrent append, ledger merge, restored backup) must not inflate."""
        funnel.append_event(self.ledger, self._event("signup", "a@example.com", icp=True))
        already_written = self.ledger.read_text(encoding="utf-8")
        with self.ledger.open("a", encoding="utf-8") as fh:
            fh.write(already_written)

        self.assertEqual(len(self.ledger.read_text(encoding="utf-8").strip().splitlines()), 2)
        vec = funnel.fold_funnel(self.ledger, "pkt_a")
        self.assertEqual(vec.signups, 1)
        self.assertEqual(vec.icp_qualified_signups, 1)
        self.assertEqual(len(funnel.read_rows(self.ledger)), 1)

    # --- L5: append_event's stage guard is bypassable by a direct JSONL append ---

    def test_unknown_stage_injected_into_the_ledger_raises_on_read(self):
        self._write_raw({"event_id": "e_tele", "packet_id": "pkt_a",
                         "stage": "teleport", "observed_at": "2026-07-30T10:00:00Z"})
        with self.assertRaises(ValueError):
            funnel.read_rows(self.ledger)
        with self.assertRaises(ValueError):
            funnel.fold_funnel(self.ledger, "pkt_a")

    # --- L6: one guard, one error type, for every shape of row corruption ---

    def test_row_missing_event_id_raises_valueerror_not_keyerror(self):
        self._write_raw({"packet_id": "pkt_a", "stage": "signup",
                         "observed_at": "2026-07-30T10:00:00Z"})
        with self.assertRaises(ValueError):
            funnel.read_rows(self.ledger)

    def test_json_list_row_raises_valueerror_not_typeerror(self):
        with self.ledger.open("a", encoding="utf-8") as fh:
            fh.write('["not", "an", "object"]\n')
        with self.assertRaises(ValueError):
            funnel.read_rows(self.ledger)

    def test_corrupt_row_error_names_the_file_and_line(self):
        funnel.append_event(self.ledger, self._event("signup", "a@example.com"))
        self._write_raw({"packet_id": "pkt_a", "stage": "signup",
                         "observed_at": "2026-07-30T10:00:00Z"})
        with self.assertRaises(ValueError) as ctx:
            funnel.read_rows(self.ledger)
        self.assertIn("attribution.jsonl", str(ctx.exception))
        self.assertIn(":2", str(ctx.exception))

    # --- I1: icp_qualified_engagers counts people, exactly like engagers does ---

    def test_icp_qualified_engagers_counts_people_not_events(self):
        funnel.append_event(self.ledger, self._event(
            "engager", "@dev", icp=True, when="2026-07-30T10:00:00Z"))
        funnel.append_event(self.ledger, self._event(
            "engager", "@dev", icp=True, when="2026-07-30T11:00:00Z"))

        vec = funnel.fold_funnel(self.ledger, "pkt_a")
        self.assertEqual(vec.engagers, ["@dev"])
        self.assertEqual(vec.icp_qualified_engagers, 1)
        self.assertLessEqual(vec.icp_qualified_engagers, len(vec.engagers))

    # --- C2: identity-less events in the same second need a caller-supplied nonce ---

    def test_nonce_distinguishes_two_identityless_events_in_the_same_second(self):
        a = funnel.make_event_id("pkt_a", "ref_click", None, "2026-07-30T10:00:00Z", nonce="req-1")
        b = funnel.make_event_id("pkt_a", "ref_click", None, "2026-07-30T10:00:00Z", nonce="req-2")
        self.assertNotEqual(a, b)

    def test_make_event_id_without_a_nonce_is_still_deterministic(self):
        a = funnel.make_event_id("pkt_a", "signup", "a@example.com", "2026-07-30T10:00:00Z")
        b = funnel.make_event_id("pkt_a", "signup", "a@example.com", "2026-07-30T10:00:00Z")
        self.assertEqual(a, b)

    # --- I7: one timestamp parser for the package, one error type ---

    def test_parse_ts_raises_valueerror_on_a_non_string_and_on_garbage(self):
        with self.assertRaises(ValueError):
            funnel.parse_ts(None)
        with self.assertRaises(ValueError):
            funnel.parse_ts(20260730)
        with self.assertRaises(ValueError):
            funnel.parse_ts("not-a-date")

    def test_parse_ts_normalises_z_suffix_and_naive_timestamps_to_utc(self):
        aware = funnel.parse_ts("2026-07-30T10:00:00Z")
        naive = funnel.parse_ts("2026-07-30T10:00:00")
        self.assertEqual(aware.utcoffset().total_seconds(), 0)
        self.assertEqual(naive.utcoffset().total_seconds(), 0)
        self.assertEqual(aware, naive)


if __name__ == "__main__":
    unittest.main()
