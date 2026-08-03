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

    def _event(self, stage, identity_hash=None, icp=False, when="2026-07-30T10:00:00Z"):
        return funnel.StageEvent(
            event_id=funnel.make_event_id("pkt_a", stage, identity_hash, when),
            packet_id="pkt_a",
            stage=stage,
            observed_at=when,
            confidence="ref",
            identity_hash=identity_hash,
            icp_qualified=icp,
        )

    def test_append_then_fold_counts_each_stage(self):
        funnel.append_event(self.ledger, self._event("signup", "idh_a", icp=True))
        funnel.append_event(self.ledger, self._event("ref_click", None, when="2026-07-30T11:00:00Z"))
        funnel.append_event(self.ledger, self._event("engager", "idh_dev", icp=True))

        vec = funnel.fold_funnel(self.ledger, "pkt_a")
        self.assertEqual(vec.signups, 1)
        self.assertEqual(vec.icp_qualified_signups, 1)
        self.assertEqual(vec.ref_click_throughs, 1)
        self.assertEqual(vec.engagers, ["idh_dev"])
        self.assertEqual(vec.icp_qualified_engagers, 1)

    def test_duplicate_event_id_is_a_noop(self):
        ev = self._event("signup", "idh_a", icp=True)
        self.assertTrue(funnel.append_event(self.ledger, ev))
        self.assertFalse(funnel.append_event(self.ledger, ev))

        vec = funnel.fold_funnel(self.ledger, "pkt_a")
        self.assertEqual(vec.signups, 1)

    def test_fold_ignores_other_packets(self):
        funnel.append_event(self.ledger, self._event("signup", "idh_a"))
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
        funnel.append_event(self.ledger, self._event("signup", "idh_a"))
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
        funnel.append_event(self.ledger, self._event("signup", "idh_a", icp=True))
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
        funnel.append_event(self.ledger, self._event("signup", "idh_a"))
        self._write_raw({"packet_id": "pkt_a", "stage": "signup",
                         "observed_at": "2026-07-30T10:00:00Z"})
        with self.assertRaises(ValueError) as ctx:
            funnel.read_rows(self.ledger)
        self.assertIn("attribution.jsonl", str(ctx.exception))
        self.assertIn(":2", str(ctx.exception))

    # --- I1: icp_qualified_engagers counts people, exactly like engagers does ---

    def test_icp_qualified_engagers_counts_people_not_events(self):
        funnel.append_event(self.ledger, self._event(
            "engager", "idh_dev", icp=True, when="2026-07-30T10:00:00Z"))
        funnel.append_event(self.ledger, self._event(
            "engager", "idh_dev", icp=True, when="2026-07-30T11:00:00Z"))

        vec = funnel.fold_funnel(self.ledger, "pkt_a")
        self.assertEqual(vec.engagers, ["idh_dev"])
        self.assertEqual(vec.icp_qualified_engagers, 1)
        self.assertLessEqual(vec.icp_qualified_engagers, len(vec.engagers))

    # --- C2: identity-less events in the same second need a caller-supplied nonce ---

    def test_nonce_distinguishes_two_identityless_events_in_the_same_second(self):
        a = funnel.make_event_id("pkt_a", "ref_click", None, "2026-07-30T10:00:00Z", nonce="req-1")
        b = funnel.make_event_id("pkt_a", "ref_click", None, "2026-07-30T10:00:00Z", nonce="req-2")
        self.assertNotEqual(a, b)

    def test_make_event_id_without_a_nonce_is_still_deterministic(self):
        a = funnel.make_event_id("pkt_a", "signup", "idh_a", "2026-07-30T10:00:00Z")
        b = funnel.make_event_id("pkt_a", "signup", "idh_a", "2026-07-30T10:00:00Z")
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

    # --- R1: hash_identity is the only way an identity becomes storable ---

    def test_hash_identity_is_stable_and_prefixed(self):
        first = funnel.hash_identity("dev@example.com", "pep")
        second = funnel.hash_identity("dev@example.com", "pep")
        self.assertEqual(first, second)
        self.assertTrue(first.startswith("idh_"))
        self.assertNotIn("dev@example.com", first)

    def test_hash_identity_normalises_case_and_surrounding_whitespace(self):
        """The same person must always hash identically or dedupe silently splits them."""
        self.assertEqual(
            funnel.hash_identity("dev@example.com", "pep"),
            funnel.hash_identity("  DEV@Example.COM  ", "pep"),
        )

    def test_hash_identity_requires_a_pepper_argument(self):
        with self.assertRaises(TypeError):
            funnel.hash_identity("dev@example.com")

    def test_a_different_pepper_yields_a_different_digest(self):
        self.assertNotEqual(
            funnel.hash_identity("dev@example.com", "pep-a"),
            funnel.hash_identity("dev@example.com", "pep-b"),
        )

    def test_hash_identity_rejects_a_blank_identity(self):
        for blank in ("", "   ", "\t\n"):
            with self.subTest(identity=blank):
                with self.assertRaises(ValueError):
                    funnel.hash_identity(blank, "pep")

    # --- CodeRabbit re-review: hash_identity must guard the pepper the same way it
    # guards the identity — a blank pepper is an unpeppered (reversible) digest, not
    # pseudonymisation, and the docstring's whole argument for a required pepper is
    # defeated if the value is merely present but empty.

    def test_hash_identity_rejects_a_blank_pepper(self):
        for blank in ("", "   ", None):
            with self.subTest(pepper=blank):
                with self.assertRaises(ValueError):
                    funnel.hash_identity("dev@example.com", blank)

    def test_hash_identity_with_a_valid_pepper_still_returns_a_stable_digest(self):
        first = funnel.hash_identity("dev@example.com", "a-real-pepper")
        second = funnel.hash_identity("dev@example.com", "a-real-pepper")
        self.assertEqual(first, second)
        self.assertTrue(first.startswith("idh_"))

    # --- R3: an exact replay is a no-op; the same id with different contents is corruption ---

    def test_conflicting_content_under_the_same_event_id_raises_on_append(self):
        first = self._event("signup", "idh_aaa")
        self.assertTrue(funnel.append_event(self.ledger, first))

        conflicting = funnel.StageEvent(
            event_id=first.event_id, packet_id="pkt_a", stage="signup",
            observed_at=first.observed_at, confidence="ref",
            identity_hash="idh_bbb", icp_qualified=True,
        )
        with self.assertRaises(ValueError) as ctx:
            funnel.append_event(self.ledger, conflicting)
        self.assertIn(first.event_id, str(ctx.exception))

        # the ledger is untouched by the rejected write
        self.assertEqual(len(funnel.read_rows(self.ledger)), 1)

    def test_conflicting_content_under_the_same_event_id_raises_on_read(self):
        """A ledger holding one id twice with different contents is corruption, not a replay."""
        self._write_raw({"event_id": "e_dup", "packet_id": "pkt_a", "stage": "signup",
                         "observed_at": "2026-07-30T10:00:00Z", "confidence": "ref",
                         "identity_hash": "idh_aaa", "icp_qualified": False})
        self._write_raw({"event_id": "e_dup", "packet_id": "pkt_a", "stage": "signup",
                         "observed_at": "2026-07-30T10:00:00Z", "confidence": "ref",
                         "identity_hash": "idh_bbb", "icp_qualified": True})

        with self.assertRaises(ValueError) as ctx:
            funnel.read_rows(self.ledger)
        message = str(ctx.exception)
        self.assertIn("attribution.jsonl", message)
        self.assertIn(":2", message)
        self.assertIn("e_dup", message)

    def test_an_identical_replay_is_still_a_silent_noop_on_both_paths(self):
        """The conflict guard must not turn a legitimate exact duplicate into an error."""
        ev = self._event("signup", "idh_aaa", icp=True)
        self.assertTrue(funnel.append_event(self.ledger, ev))
        self.assertFalse(funnel.append_event(self.ledger, ev))

        already_written = self.ledger.read_text(encoding="utf-8")
        with self.ledger.open("a", encoding="utf-8") as fh:
            fh.write(already_written)

        self.assertEqual(len(funnel.read_rows(self.ledger)), 1)
        self.assertEqual(funnel.fold_funnel(self.ledger, "pkt_a").signups, 1)

    # --- R4: UNATTRIBUTED belongs to the domain layer ---

    def test_unattributed_is_defined_in_the_domain_layer(self):
        self.assertEqual(funnel.UNATTRIBUTED, "__unattributed__")


if __name__ == "__main__":
    unittest.main()
