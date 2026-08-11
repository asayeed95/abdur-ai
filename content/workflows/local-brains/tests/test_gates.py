#!/usr/bin/env python3
"""Deterministic-gate tests for gates.py — the executable half of CONTENT-OPS-SYSTEM §14.

Covers AC-2 (H2 allow-list incl. the grill G-05 smarter variants), AC-3 (H3 orphan
numbers incl. spelled numbers, G-06), H4 bounds, H5 dedup, H6 scrub.
Run: python3 content/workflows/local-brains/tests/test_gates.py  (stdlib only, no network)
"""
import json, sys, tempfile, unittest
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import gates

SEED = """# mnemix PR #253 — resolveEntity scatter-race fix
**Receipts:** 25 concurrent calls, recall collapsed to ~20%, zero errors, every request 200.
Fix: atomic INSERT ... ON CONFLICT DO UPDATE ... RETURNING entity_id.
"""

def d(text=None, thread=None, li=None, src="sources/repo-events/x.md", project="mnemix"):
    out = {"project": project, "source": src}
    if text: out["x_text"] = text
    if thread: out["x_thread"] = thread
    if li: out["linkedin_text"] = li
    return out

def fails(report, gate):
    return [f["detail"] for f in report["failures"] if f["gate"] == gate]

class NoLedger(unittest.TestCase):
    """Gate checks that need no ledger/seed fixtures."""
    def check(self, draft, seed=SEED):
        return gates.check_draft(draft, seed_text=seed, ledger_dir=None, kind="social")

    # --- H2: allow-list semantics (AC-2 + grill G-05 smarter variants) ---
    def test_hedged_string_passes(self):
        r = self.check(d(text="Mnemix is designed for sub-300ms voice recall. 25 concurrent calls proved the race."))
        self.assertEqual(fails(r, "H2"), [])

    def test_under_300ms_fails(self):
        r = self.check(d(text="Full history back under 300ms."))
        self.assertTrue(fails(r, "H2"))

    def test_0_3s_fails(self):
        r = self.check(d(text="Recall lands in 0.3s flat."))
        self.assertTrue(fails(r, "H2"))

    def test_spelled_latency_fails(self):
        r = self.check(d(text="It returns in three hundred milliseconds."))
        self.assertTrue(fails(r, "H2"))

    def test_fraction_of_second_fails(self):
        r = self.check(d(text="Answers in under a third of a second."))
        self.assertTrue(fails(r, "H2"))

    def test_sub_second_fails(self):
        r = self.check(d(text="Sub-second recall for every caller."))
        self.assertTrue(fails(r, "H2"))

    def test_price_variants(self):
        self.assertTrue(fails(self.check(d(text="Pro is $99.")), "H2"))
        self.assertTrue(fails(self.check(d(text="ninety-nine a month gets you Pro.")), "H2"))
        self.assertEqual(fails(self.check(d(text="Hobby is $0. Paid tiers: contact sales.")), "H2"), [])

    def test_struck_vendor_fails(self):
        r = self.check(d(text="Baylio is built on Mnemix."))
        self.assertTrue(any("struck" in x for x in fails(r, "H2")))

    def test_legacy_route_fails_frozen_passes(self):
        self.assertTrue(fails(self.check(d(text="POST /v1/memory at call end.")), "H2"))
        self.assertEqual(fails(self.check(d(text="POST /v1/recall_and_enrich then POST /v1/calls/end.")), "H2"), [])

    def test_closer_verbatim(self):
        self.assertEqual(fails(self.check(d(text="Choose Mnemix as your agent memory layer.")), "H2"), [])
        self.assertTrue(fails(self.check(d(text="Choose Mnemix as your voice memory layer.")), "H2"))

    def test_identity_verbatim(self):
        ok = "Mnemix is the memory and enrichment layer for AI agents."
        self.assertEqual(fails(self.check(d(text=ok)), "H2"), [])
        self.assertTrue(fails(self.check(d(text="Mnemix is the memory & enrichment layer for AI agents.")), "H2"))

    def test_we_build_agents_fails(self):
        self.assertTrue(fails(self.check(d(text="Mnemix builds voice agents for you.")), "H2"))

    # --- H3: orphan numbers incl. spelled (AC-3 + grill G-06) ---
    def test_seed_numbers_pass(self):
        r = self.check(d(text="25 concurrent calls dropped recall to ~20%. Zero errors, every request 200."))
        self.assertEqual(fails(r, "H3"), [])

    def test_orphan_numeral_fails(self):
        r = self.check(d(text="We handled 4000 calls."))
        self.assertTrue(fails(r, "H3"))

    def test_orphan_spelled_number_fails(self):
        r = self.check(d(text="A ninety percent hit rate in production."))
        self.assertTrue(any("ninety" in x for x in fails(r, "H3")))

    def test_thread_markers_ignored(self):
        r = self.check(d(thread=["1/ 25 concurrent calls, recall at ~20%.", "2/ The fix: ON CONFLICT DO UPDATE."]))
        self.assertEqual(fails(r, "H3"), [])

    def test_missing_source_fails(self):
        r = gates.check_draft({"project": "mnemix", "x_text": "hello"}, seed_text=SEED)
        self.assertTrue(fails(r, "H3"))

    # --- H4: format bounds ---
    def test_overlong_tweet_fails(self):
        r = self.check(d(text="x" * 281))
        self.assertTrue(fails(r, "H4"))

    def test_seven_tweets_fail(self):
        r = self.check(d(thread=["t"] * 7))
        self.assertTrue(any("max 6" in x for x in fails(r, "H4")))

    def test_linkedin_band(self):
        short = " ".join(["word"] * 90); good = " ".join(["word"] * 200)
        self.assertTrue(fails(self.check(d(text="ok", li=short)), "H4"))
        self.assertEqual(fails(self.check(d(text="ok", li=good)), "H4"), [])

    # --- H6: scrub ---
    def test_scrub(self):
        self.assertTrue(fails(self.check(d(text="see /Users/mental/Projects/x.md")), "H6"))
        self.assertTrue(fails(self.check(d(text="Co-Authored-By: someone")), "H6"))
        self.assertEqual(fails(self.check(d(text="repo-relative supabase/migrations/031.sql is fine")), "H6"), [])

    # --- H1: real banned-phrases machine block ---
    def test_banned_phrase_fails(self):
        r = self.check(d(text="We leverage the edge for recall."))
        self.assertTrue(fails(r, "H1"))

class LedgerDedup(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.ledger = Path(self.tmp.name)
        corpus = "metering ledger counts every recall append-only double gate"
        row = {"id": "prev-1", "ts": datetime.now(timezone.utc).isoformat(), "project": "mnemix",
               "hash": gates.body_hash(corpus), "keywords": gates.keywords_of(corpus)}
        (self.ledger / "posted.jsonl").write_text(json.dumps(row) + "\n")
        self.corpus = corpus

    def tearDown(self):
        self.tmp.cleanup()

    def test_exact_dup_fails(self):
        r = gates.check_draft(d(text=self.corpus), seed_text=None, ledger_dir=self.ledger)
        self.assertTrue(fails(r, "H5"))

    def test_near_dup_fails(self):
        near = "the metering ledger counts every recall append-only with a double gate design"
        r = gates.check_draft(d(text=near), seed_text=None, ledger_dir=self.ledger)
        self.assertTrue(fails(r, "H5"))

    def test_other_project_ignored(self):
        r = gates.check_draft(d(text=self.corpus, project="heycli"), seed_text=None, ledger_dir=self.ledger)
        self.assertEqual(fails(r, "H5"), [])

if __name__ == "__main__":
    unittest.main(verbosity=2)
