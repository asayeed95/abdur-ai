"""Offline tests for ICP scoring.

Run: python3 content/workflows/attribution/tests/test_icp.py
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import icp

RULES = {
    "threshold": 60,
    "signals": [
        {"name": "voice_stack", "field": "stack", "any_of": ["vapi", "retell", "bland", "livekit", "twilio"], "points": 40},
        {"name": "senior_title", "field": "title", "any_of": ["staff engineer", "principal engineer", "founding engineer", "cto"], "points": 30},
        {"name": "funded_stage", "field": "company_stage", "any_of": ["seed", "series a", "series b", "series c"], "points": 20},
        {"name": "any_engineer", "field": "title", "any_of": ["engineer", "developer"], "points": 10},
    ],
}


class IcpTests(unittest.TestCase):
    def test_voice_stack_plus_senior_title_qualifies(self):
        res = icp.score_profile(
            {"title": "Staff Engineer", "company_stage": "seed", "stack": ["Retell", "postgres"]},
            RULES,
        )
        self.assertTrue(res.qualified)
        self.assertGreaterEqual(res.score, 60)
        self.assertIn("voice_stack", res.reasons)
        self.assertIn("senior_title", res.reasons)

    def test_marketer_at_unknown_company_does_not_qualify(self):
        res = icp.score_profile(
            {"title": "Head of Marketing", "company_stage": None, "stack": []},
            RULES,
        )
        self.assertFalse(res.qualified)
        self.assertEqual(res.score, 0)
        self.assertEqual(res.reasons, [])

    def test_matching_is_case_insensitive_and_substring(self):
        res = icp.score_profile(
            {"title": "SENIOR STAFF ENGINEER, Platform", "company_stage": None, "stack": []},
            RULES,
        )
        self.assertIn("senior_title", res.reasons)

    def test_score_is_capped_at_100(self):
        res = icp.score_profile(
            {"title": "Staff Engineer", "company_stage": "series a", "stack": ["vapi", "livekit"]},
            RULES,
        )
        self.assertLessEqual(res.score, 100)

    def test_a_signal_fires_at_most_once(self):
        res = icp.score_profile(
            {"title": None, "company_stage": None, "stack": ["vapi", "retell", "bland"]},
            RULES,
        )
        self.assertEqual(res.score, 40)

    def test_missing_profile_fields_are_tolerated(self):
        res = icp.score_profile({}, RULES)
        self.assertEqual(res.score, 0)
        self.assertFalse(res.qualified)

    def test_none_profile_raises_rather_than_scoring_zero(self):
        with self.assertRaises(ValueError):
            icp.score_profile(None, RULES)


if __name__ == "__main__":
    unittest.main()
