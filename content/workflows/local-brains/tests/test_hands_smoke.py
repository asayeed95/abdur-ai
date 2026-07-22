#!/usr/bin/env python3
"""hands_scheduler smoke tests — every side effect monkeypatched (no network, no repo writes):
Blotato/Slack/Telegram/ledger/mark_source_used stubbed, state paths in tempdirs, live-fires
cache pre-seeded with the W28-class foreign 09:15 ET fire.
Covers: NEEDS-HUMAN exclusion from batch-yes + per-item release (G-03/AC-2/AC-12),
(batch-id, item-id) idempotency incl. duplicate replies (G-04/AC-6), foreign-queue
spacing on release (G-02/AC-4), banned re-lint hold.
Run: python3 content/workflows/local-brains/tests/test_hands_smoke.py
"""
import os, sys, tempfile, unittest
from datetime import datetime
from pathlib import Path

TESTS = Path(__file__).resolve().parent
BRAINS = TESTS.parent
CONTENT = BRAINS.parent.parent

os.environ.setdefault("DRY_RUN", "1")   # belt: even if a patch is missed, import-default is inert
os.environ.setdefault("SLACK_TOKEN", "test"); os.environ.setdefault("BLOTATO_KEY", "test")
os.environ.setdefault("TG_TOKEN", "test"); os.environ.setdefault("TG_CHAT", "test")
os.environ.setdefault("LEDGER_DIR", str(CONTENT / "ledger"))
os.environ.setdefault("BANNED_FILE", str(CONTENT / "voice" / "banned-phrases.md"))
sys.path.insert(0, str(BRAINS))
import hands_scheduler as H
import batchlib as B

def item(n, project="mnemix", status="pending", fire="2026-07-23T13:07:00Z"):
    return {"item_id": f"i{n}", "project": project, "platform": "twitter", "status": status,
            "fire_at": fire, "account_id": "18856",
            "draft": {"project": project, "source": "sources/repo-events/x.md",
                      "x_thread": ["25 concurrent calls, recall ~20%.", "The fix: ON CONFLICT DO UPDATE."]}}

class Harness(unittest.TestCase):
    """Patch every side effect; capture ledger rows and Slack posts in memory."""
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        td = Path(self.tmp.name)
        self.rows, self.slack, self.tg = [], [], []
        self._saved = {k: getattr(H, k) for k in
                       ("DRY_RUN", "DRAFTS_DIR", "PAUSE_FLAG", "RISK_STATE",
                        "blotato_schedule", "slack_post", "telegram", "jsonl_append", "mark_source_used")}
        H.DRY_RUN = False                       # so manifest saves persist (to the tempdir)
        H.DRAFTS_DIR = td
        H.PAUSE_FLAG = td / ".paused"
        H.RISK_STATE = td / ".risk-state.json"
        H.blotato_schedule = lambda account_id, platform, text, thread, when: "test-id"
        H.slack_post = lambda t: self.slack.append(t)
        H.telegram = lambda t: self.tg.append(t)
        H.jsonl_append = lambda name, obj: self.rows.append((name, obj))
        H.mark_source_used = lambda *a, **k: None
        H._live_fires = [("18856", "2026-07-23T13:15:00Z")]   # foreign W28-class fire

    def tearDown(self):
        for k, v in self._saved.items():
            setattr(H, k, v)
        H._live_fires = None
        self.tmp.cleanup()

    def write_manifest(self, items):
        dk = datetime.now(H.ET).strftime("%Y-%m-%d")
        B.save_manifest(H.DRAFTS_DIR, {"date_key": dk, "sent_ts": "1", "items": items})
        return dk

class ReleaseMechanics(Harness):
    def test_release_spaces_off_foreign_fire(self):
        m = {"date_key": "2026-07-23", "items": [item(1)]}
        msg = H.release_item(m, m["items"][0], "batch_yes", set(), [])
        self.assertIn("queued", msg)
        self.assertEqual(m["items"][0]["fire_at"], "2026-07-23T13:37:00Z")   # 09:07→09:37 ET (AC-4)
        row = next(o for n, o in self.rows if n == "scheduled.jsonl")
        self.assertEqual(row["approval_mode"], "batch_yes")
        self.assertEqual(row["account_id"], "18856")

    def test_idempotent_by_batch_item_key(self):
        m = {"date_key": "2026-07-23", "items": [item(1)]}
        msg = H.release_item(m, m["items"][0], "batch_yes", {"batch-2026-07-23-i1"}, [])
        self.assertIn("idempotent no-op", msg)
        self.assertFalse(self.rows)

    def test_relint_holds_banned(self):
        it = item(3); it["draft"]["x_thread"] = ["We leverage the edge."]
        m = {"date_key": "2026-07-23", "items": [it]}
        msg = H.release_item(m, it, "batch_yes", set(), ["leverage"])
        self.assertIn("held", msg); self.assertEqual(it["status"], "held")

class BatchGrammarFlow(Harness):
    def test_batch_yes_excludes_needs_human(self):
        dk = self.write_manifest([item(1), item(2, status="needs_human")])
        H.process_batch([{"ts": "2.0", "text": "yes"}], set(), [])
        m = B.load_manifest(H.DRAFTS_DIR, dk)
        st = {it["item_id"]: it["status"] for it in m["items"]}
        self.assertEqual(st["i1"], "scheduled")
        self.assertEqual(st["i2"], "needs_human")             # untouched by batch yes (G-03)

    def test_per_item_release_frees_needs_human(self):
        dk = self.write_manifest([item(2, status="needs_human")])
        H.process_batch([{"ts": "2.0", "text": "release i2"}], set(), [])
        m = B.load_manifest(H.DRAFTS_DIR, dk)
        self.assertEqual(m["items"][0]["status"], "scheduled")
        row = next(o for n, o in self.rows if n == "scheduled.jsonl")
        self.assertEqual(row["approval_mode"], "per_item")

    def test_duplicate_reply_noop(self):
        dk = self.write_manifest([item(1)])
        H.process_batch([{"ts": "2.0", "text": "yes"}], set(), [])
        n_rows = len([r for r in self.rows if r[0] == "scheduled.jsonl"])
        H.process_batch([{"ts": "2.0", "text": "yes"}], set(), [])    # same reply again (other channel)
        n_rows2 = len([r for r in self.rows if r[0] == "scheduled.jsonl"])
        self.assertEqual(n_rows, 1)
        self.assertEqual(n_rows2, 1)                                   # exactly N lines, no double (AC-6)

    def test_no_rejects_everything_pending(self):
        dk = self.write_manifest([item(1), item(2, status="needs_human")])
        H.process_batch([{"ts": "2.0", "text": "no"}], set(), [])
        m = B.load_manifest(H.DRAFTS_DIR, dk)
        self.assertTrue(all(it["status"] == "rejected" for it in m["items"]))

    def test_skip_semantics_inside_yes(self):
        dk = self.write_manifest([item(1), item(4)])
        H.process_batch([{"ts": "2.0", "text": "yes but skip 2"}], set(), [])
        m = B.load_manifest(H.DRAFTS_DIR, dk)
        st = {it["item_id"]: it["status"] for it in m["items"]}
        self.assertEqual(st["i1"], "scheduled")
        self.assertEqual(st["i4"], "rejected")                 # G-23: skip wins over edit-merge
        self.assertTrue(any("parsed: skip" in s for s in self.slack))   # echo-before-act

    def test_stop_content_pauses_without_manifest(self):
        H.process_batch([{"ts": "3.0", "text": "stop content"}], set(), [])
        self.assertTrue(B.is_paused(H.PAUSE_FLAG))
        H.process_batch([{"ts": "4.0", "text": "resume content"}], set(), [])
        self.assertFalse(B.is_paused(H.PAUSE_FLAG))

if __name__ == "__main__":
    unittest.main(verbosity=2)
