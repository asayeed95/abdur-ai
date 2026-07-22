#!/usr/bin/env python3
"""batchlib tests — grammar precedence (G-23), fire-time resolution incl. DST (G-01),
live-queue spacing vs a foreign 09:15 fire (G-02/AC-4), manifest + risk/pause state.
Run: python3 content/workflows/local-brains/tests/test_batchlib.py
"""
import sys, tempfile, unittest
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import batchlib as B

ET = ZoneInfo("America/New_York")

class Grammar(unittest.TestCase):
    def test_bare_yes_no_with_punctuation(self):
        self.assertEqual(B.parse_reply("Yes.")["cmd"], "yes")
        self.assertEqual(B.parse_reply("no")["cmd"], "no")

    def test_g23_skip_precedence_inside_yes(self):
        c = B.parse_reply("yes but skip 2")
        self.assertEqual(c["cmd"], "skip"); self.assertEqual(c["refs"], ["2"])

    def test_plain_skip_list(self):
        c = B.parse_reply("skip 2, 3")
        self.assertEqual(c["cmd"], "skip"); self.assertEqual(c["refs"], ["2", "3"])

    def test_yes_but_without_skip_token(self):
        c = B.parse_reply("yes but tighten tweet 3")
        self.assertEqual(c["cmd"], "yes_but"); self.assertIn("tighten", c["edit"])

    def test_per_item_verbs(self):
        self.assertEqual(B.parse_reply("release 2"), {"cmd": "release", "ref": "2"})
        self.assertEqual(B.parse_reply("drop 3"), {"cmd": "drop", "ref": "3"})
        c = B.parse_reply("edit 1: cut the second tweet")
        self.assertEqual((c["cmd"], c["ref"]), ("edit", "1")); self.assertIn("cut", c["edit"])

    def test_kill_switch_and_confirm(self):
        self.assertEqual(B.parse_reply("stop content")["cmd"], "pause")
        self.assertEqual(B.parse_reply("resume content")["cmd"], "resume")
        self.assertEqual(B.parse_reply("confirm")["cmd"], "confirm")

    def test_non_grammar_returns_none(self):
        self.assertIsNone(B.parse_reply('APPROVED: {"x_text": "hi"}'))
        self.assertIsNone(B.parse_reply("looks good, nice work"))

class Refs(unittest.TestCase):
    M = {"items": [{"item_id": "2026-07-23-mnemix-1"}, {"item_id": "2026-07-23-abdur-ai-2"}]}

    def test_positional_and_substring(self):
        self.assertEqual(B.resolve_ref("2", self.M), "2026-07-23-abdur-ai-2")
        self.assertEqual(B.resolve_ref("mnemix-1", self.M), "2026-07-23-mnemix-1")
        self.assertIsNone(B.resolve_ref("9", self.M))
        self.assertIsNone(B.resolve_ref("2026-07-23", self.M))   # ambiguous

class FireTimes(unittest.TestCase):
    def test_manifest_slot_honored_when_future(self):
        now = datetime(2026, 7, 23, 11, 30, tzinfo=timezone.utc)          # 07:30 ET
        when, why = B.resolve_fire_time("2026-07-23T13:07:00Z", 9, now=now)
        self.assertEqual((when, why), ("2026-07-23T13:07:00Z", "manifest-slot"))

    def test_late_approval_recomputes_30min_out(self):
        now = datetime(2026, 7, 23, 18, 0, tzinfo=timezone.utc)           # 14:00 ET — slot passed
        when, why = B.resolve_fire_time("2026-07-23T13:07:00Z", 9, now=now)
        self.assertEqual(why, "late-recompute")
        self.assertEqual(when, "2026-07-23T18:30:00Z")                    # 14:30 ET same day (AC-11)

    def test_quiet_hours_roll_to_next_morning(self):
        now = datetime(2026, 7, 24, 2, 45, tzinfo=timezone.utc)           # 22:45 ET Jul 23
        when, why = B.resolve_fire_time(None, 9, now=now)
        self.assertEqual(why, "next-morning")
        self.assertEqual(when, "2026-07-24T13:07:00Z")                    # 09:07 ET next day (EDT)

    def test_dst_boundary_2026_11_01(self):
        d_edt = datetime(2026, 10, 31, 1, 0, tzinfo=timezone.utc)
        d_est = datetime(2026, 11, 2, 1, 0, tzinfo=timezone.utc)
        self.assertEqual(B.slot_fire(d_edt.astimezone(ET).date().__class__(2026, 10, 31), 9, 7),
                         "2026-10-31T13:07:00Z")                          # EDT: UTC-4
        self.assertEqual(B.slot_fire(d_est.astimezone(ET).date().__class__(2026, 11, 2), 9, 7),
                         "2026-11-02T14:07:00Z")                          # EST: UTC-5

class Spacing(unittest.TestCase):
    FOREIGN = [("18856", "2026-07-23T13:15:00Z")]                          # the W28-class 09:15 ET fire

    def test_shift_off_foreign_fire_same_account(self):
        got = B.next_free_slot("2026-07-23T13:07:00Z", "18856", self.FOREIGN)
        self.assertEqual(got, "2026-07-23T13:37:00Z")                     # 09:07→09:22 (7min<15)→09:37 ✓

    def test_other_account_untouched(self):
        got = B.next_free_slot("2026-07-23T13:07:00Z", "20072", self.FOREIGN)
        self.assertEqual(got, "2026-07-23T13:07:00Z")

    def test_quiet_hours_unschedulable(self):
        self.assertIsNone(B.next_free_slot("2026-07-24T03:30:00Z", "18856", []))  # 23:30 ET

class ManifestAndState(unittest.TestCase):
    def test_manifest_roundtrip_and_helpers(self):
        with tempfile.TemporaryDirectory() as td:
            m = {"date_key": "2026-07-23", "items": [
                {"item_id": "a", "status": "pending"}, {"item_id": "b", "status": "needs_human"}]}
            B.save_manifest(td, m)
            got = B.load_manifest(td, "2026-07-23")
            self.assertEqual([i["item_id"] for i in B.pending_items(got)], ["a"])
            self.assertEqual(B.needs_human_ids(got), {"b"})
            self.assertIsNone(B.load_manifest(td, "2026-07-24"))

    def test_pause_and_risk(self):
        with tempfile.TemporaryDirectory() as td:
            flag = Path(td) / ".paused"; state = Path(td) / ".risk.json"
            self.assertFalse(B.is_paused(flag))
            B.set_paused(flag, True, "test"); self.assertTrue(B.is_paused(flag))
            B.set_paused(flag, False); self.assertFalse(B.is_paused(flag))
            self.assertEqual(B.risk_bump(state, "18856", ok=False), 1)
            self.assertEqual(B.risk_bump(state, "18856", ok=False), 2)
            self.assertEqual(B.risk_bump(state, "18856", ok=False), 3)
            self.assertEqual(B.risk_bump(state, "18856", ok=True), 0)

if __name__ == "__main__":
    unittest.main(verbosity=2)
