"""Offline tests for the shared public-claims policy.

Run: python3 content/workflows/tests/test_claims_policy.py
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import claims_policy as cp


class IdentityLineTests(unittest.TestCase):
    def test_em_dash_verbatim_identity_passes(self):
        corpus = "Mnemix — the memory and enrichment layer for AI agents."
        self.assertEqual(cp.h2_findings(corpus), [])

    def test_is_the_verbatim_identity_passes(self):
        corpus = "Mnemix is the memory and enrichment layer for AI agents."
        self.assertEqual(cp.h2_findings(corpus), [])

    def test_em_dash_missing_article_is_flagged_not_silently_backfilled(self):
        """CodeRabbit finding (PR #9): a missing 'the' in the em-dash form was
        defaulted to 'the', so non-verbatim copy reconstructed into a false
        verbatim match and the guard reported clean. Regression guard."""
        corpus = "Mnemix — memory and enrichment layer for AI agents."
        findings = cp.h2_findings(corpus)
        self.assertTrue(findings, "missing-article em-dash identity must be flagged")
        self.assertTrue(any("identity line" in f["detail"] for f in findings))

    def test_en_dash_variant_still_matches(self):
        """Unicode-escape fix (Ruff RUF001): confirm the character class still
        matches both em dash and en dash after switching from literal glyphs
        to \\u2014/\\u2013 escapes."""
        corpus = "Mnemix – the memory and enrichment layer for AI agents."
        self.assertEqual(cp.h2_findings(corpus), [])

    def test_retired_phrase_flagged_regardless_of_grammar(self):
        corpus = "Mnemix — contextual intelligence orchestration for agents."
        findings = cp.h2_findings(corpus)
        self.assertTrue(any("retired branding" in f["detail"] for f in findings))


if __name__ == "__main__":
    unittest.main()
