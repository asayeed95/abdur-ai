"""Offline tests for attribution carrier resolution.

Run: python3 content/workflows/attribution/tests/test_carriers.py
"""

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import carriers

SHIPPED_CONFIG = Path(__file__).resolve().parent.parent / "config" / "attribution.json"


def cand(pid, published, ref=None, utm=None, token=None):
    return {"packet_id": pid, "published_at": published,
            "ref": ref, "utm_campaign": utm, "declared_token": token}


def signup(when, declared=None, ref=None, utm=None):
    return {"observed_at": when, "declared_source": declared,
            "ref": ref, "utm_campaign": utm}


class CarrierTests(unittest.TestCase):
    def test_declared_beats_every_other_carrier(self):
        res = carriers.resolve_attribution(
            signup("2026-07-30T12:00:00Z", declared="abdur thread on caller memory", ref="r_b"),
            [cand("pkt_a", "2026-07-30T09:00:00Z", token="abdur thread on caller memory"),
             cand("pkt_b", "2026-07-30T10:00:00Z", ref="r_b")],
        )
        self.assertEqual(res.packet_id, "pkt_a")
        self.assertEqual(res.confidence, "declared")

    def test_ref_beats_utm(self):
        res = carriers.resolve_attribution(
            signup("2026-07-30T12:00:00Z", ref="r_b", utm="camp_c"),
            [cand("pkt_b", "2026-07-30T10:00:00Z", ref="r_b"),
             cand("pkt_c", "2026-07-30T11:00:00Z", utm="camp_c")],
        )
        self.assertEqual(res.packet_id, "pkt_b")
        self.assertEqual(res.confidence, "ref")

    def test_lone_candidate_in_window_gets_time_window_credit(self):
        res = carriers.resolve_attribution(
            signup("2026-07-30T12:00:00Z"),
            [cand("pkt_a", "2026-07-30T09:00:00Z")],
        )
        self.assertEqual(res.packet_id, "pkt_a")
        self.assertEqual(res.confidence, "time_window")

    def test_two_candidates_in_window_go_unattributed_never_split(self):
        res = carriers.resolve_attribution(
            signup("2026-07-30T12:00:00Z"),
            [cand("pkt_a", "2026-07-30T09:00:00Z"),
             cand("pkt_b", "2026-07-30T10:00:00Z")],
        )
        self.assertIsNone(res.packet_id)
        self.assertEqual(res.confidence, "none")

    def test_cohort_guard_rejects_artifact_published_after_signup(self):
        res = carriers.resolve_attribution(
            signup("2026-07-30T12:00:00Z", ref="r_a"),
            [cand("pkt_a", "2026-07-30T18:00:00Z", ref="r_a")],
        )
        self.assertIsNone(res.packet_id)
        self.assertEqual(res.confidence, "none")

    def test_candidate_outside_window_is_not_time_window_attributed(self):
        res = carriers.resolve_attribution(
            signup("2026-07-30T12:00:00Z"),
            [cand("pkt_a", "2026-07-25T09:00:00Z")],
            window_hours=24,
        )
        self.assertIsNone(res.packet_id)

    def test_no_candidates_is_unattributed_not_an_error(self):
        res = carriers.resolve_attribution(signup("2026-07-30T12:00:00Z"), [])
        self.assertIsNone(res.packet_id)
        self.assertEqual(res.confidence, "none")

    def test_unparseable_timestamp_raises(self):
        with self.assertRaises(ValueError):
            carriers.resolve_attribution(signup("not-a-date"), [cand("pkt_a", "2026-07-30T09:00:00Z")])

    def test_non_string_timestamp_raises_valueerror_through_the_shared_parser(self):
        with self.assertRaises(ValueError):
            carriers.resolve_attribution(signup(20260730), [cand("pkt_a", "2026-07-30T09:00:00Z")])

    # --- L9: "never split" applies at every tier, not just time_window ---

    def test_two_candidates_sharing_a_declared_token_fall_through_never_split(self):
        res = carriers.resolve_attribution(
            signup("2026-07-30T12:00:00Z", declared="the caller memory thread"),
            [cand("pkt_a", "2026-07-30T09:00:00Z", token="the caller memory thread"),
             cand("pkt_b", "2026-07-30T10:00:00Z", token="The Caller Memory Thread")],
        )
        self.assertIsNone(res.packet_id)
        self.assertEqual(res.confidence, "none")

    def test_two_candidates_sharing_a_ref_fall_through_never_split(self):
        res = carriers.resolve_attribution(
            signup("2026-07-30T12:00:00Z", ref="r_a"),
            [cand("pkt_a", "2026-07-30T09:00:00Z", ref="r_a"),
             cand("pkt_b", "2026-07-30T10:00:00Z", ref="r_a")],
        )
        self.assertIsNone(res.packet_id)
        self.assertEqual(res.confidence, "none")

    def test_ambiguous_utm_falls_through_to_a_lone_time_window_candidate(self):
        """One campaign, many artifacts is the normal case — it must not silently pick the first."""
        res = carriers.resolve_attribution(
            signup("2026-07-30T12:00:00Z", utm="camp_c"),
            [cand("pkt_a", "2026-07-27T09:00:00Z", utm="camp_c"),
             cand("pkt_b", "2026-07-27T10:00:00Z", utm="camp_c"),
             cand("pkt_c", "2026-07-30T09:00:00Z")],
        )
        self.assertEqual(res.packet_id, "pkt_c")
        self.assertEqual(res.confidence, "time_window")

    def test_a_lone_ref_match_still_wins_after_the_ambiguity_guard(self):
        res = carriers.resolve_attribution(
            signup("2026-07-30T12:00:00Z", ref="r_a"),
            [cand("pkt_a", "2026-07-30T09:00:00Z", ref="r_a"),
             cand("pkt_b", "2026-07-30T10:00:00Z", ref="r_other")],
        )
        self.assertEqual(res.packet_id, "pkt_a")
        self.assertEqual(res.confidence, "ref")

    # --- I5: the shipped config file is exercised, not merely shipped ---

    def test_shipped_attribution_config_loads_a_positive_window(self):
        hours = carriers.load_window_hours(SHIPPED_CONFIG)
        self.assertIsInstance(hours, int)
        self.assertGreater(hours, 0)

    def test_shipped_window_drives_a_real_resolution(self):
        hours = carriers.load_window_hours(SHIPPED_CONFIG)
        res = carriers.resolve_attribution(
            signup("2026-07-30T12:00:00Z"),
            [cand("pkt_a", "2026-07-30T09:00:00Z")],
            window_hours=hours,
        )
        self.assertEqual(res.packet_id, "pkt_a")
        self.assertEqual(res.confidence, "time_window")

    # --- CodeRabbit re-review: load_window_hours must reject invalid values instead
    # of coercing them with int(). A zero/negative window silently disables
    # time-window attribution; a truncated float or a bool silently changes it; all
    # four altered attribution behaviour with no error before this fix.

    def _write_window_config(self, tmpdir, value):
        p = Path(tmpdir) / "attribution.json"
        p.write_text(json.dumps({"time_window_hours": value}), encoding="utf-8")
        return p

    def test_load_window_hours_rejects_a_boolean(self):
        # bool is an int subclass in Python: True coerces to 1 under a bare int().
        with tempfile.TemporaryDirectory() as td:
            p = self._write_window_config(td, True)
            with self.assertRaises(ValueError):
                carriers.load_window_hours(p)

    def test_load_window_hours_rejects_a_truncating_float(self):
        with tempfile.TemporaryDirectory() as td:
            p = self._write_window_config(td, 1.9)
            with self.assertRaises(ValueError):
                carriers.load_window_hours(p)

    def test_load_window_hours_rejects_zero(self):
        with tempfile.TemporaryDirectory() as td:
            p = self._write_window_config(td, 0)
            with self.assertRaises(ValueError):
                carriers.load_window_hours(p)

    def test_load_window_hours_rejects_a_negative_value(self):
        with tempfile.TemporaryDirectory() as td:
            p = self._write_window_config(td, -5)
            with self.assertRaises(ValueError):
                carriers.load_window_hours(p)

    def test_load_window_hours_rejects_a_numeric_string(self):
        with tempfile.TemporaryDirectory() as td:
            p = self._write_window_config(td, "24")
            with self.assertRaises(ValueError):
                carriers.load_window_hours(p)

    def test_load_window_hours_rejects_a_missing_key(self):
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "attribution.json"
            p.write_text(json.dumps({}), encoding="utf-8")
            with self.assertRaises(ValueError):
                carriers.load_window_hours(p)

    def test_load_window_hours_accepts_a_valid_positive_integer(self):
        with tempfile.TemporaryDirectory() as td:
            p = self._write_window_config(td, 24)
            self.assertEqual(carriers.load_window_hours(p), 24)


if __name__ == "__main__":
    unittest.main()
