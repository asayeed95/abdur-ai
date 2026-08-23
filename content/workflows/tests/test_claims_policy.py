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
        corpus = "Northsun — the memory and enrichment layer for AI agents."
        self.assertEqual(cp.h2_findings(corpus), [])

    def test_is_the_verbatim_identity_passes(self):
        corpus = "Northsun is the memory and enrichment layer for AI agents."
        self.assertEqual(cp.h2_findings(corpus), [])

    def test_em_dash_missing_article_is_flagged_not_silently_backfilled(self):
        """CodeRabbit finding (PR #9): a missing 'the' in the em-dash form was
        defaulted to 'the', so non-verbatim copy reconstructed into a false
        verbatim match and the guard reported clean. Regression guard."""
        corpus = "Northsun — memory and enrichment layer for AI agents."
        findings = cp.h2_findings(corpus)
        self.assertTrue(findings, "missing-article em-dash identity must be flagged")
        self.assertTrue(any("identity line" in f["detail"] for f in findings))

    def test_en_dash_variant_still_matches(self):
        """Unicode-escape fix (Ruff RUF001): confirm the character class still
        matches both em dash and en dash after switching from literal glyphs
        to \\u2014/\\u2013 escapes."""
        corpus = "Northsun – the memory and enrichment layer for AI agents."
        self.assertEqual(cp.h2_findings(corpus), [])

    def test_retired_phrase_flagged_regardless_of_grammar(self):
        corpus = "Mnemix — contextual intelligence orchestration for agents."
        findings = cp.h2_findings(corpus)
        self.assertTrue(any("retired branding" in f["detail"] for f in findings))


class DualBrandTests(unittest.TestCase):
    """Northsun is the product; Mnemix is only the Memory Lab diagnostic."""

    def test_stale_mnemix_company_identity_is_flagged(self):
        corpus = "Mnemix is the memory and enrichment layer for AI agents."
        findings = cp.h2_findings(corpus)
        self.assertTrue(any("stale company-level Mnemix identity" in f["detail"] for f in findings))

    def test_stale_mnemix_em_dash_identity_is_flagged(self):
        corpus = "Mnemix — the memory and enrichment layer for AI agents."
        findings = cp.h2_findings(corpus)
        self.assertTrue(any("stale company-level Mnemix identity" in f["detail"] for f in findings))

    def test_memory_lab_attribution_passes(self):
        corpus = "Mnemix is a free diagnostic from Northsun."
        self.assertEqual(cp.h2_findings(corpus), [])

    def test_diagnostic_claim_without_northsun_credit_is_flagged(self):
        corpus = "Mnemix is a free diagnostic for AI memory."
        findings = cp.h2_findings(corpus)
        self.assertTrue(any("must credit Northsun" in f["detail"] for f in findings))

    def test_northsun_closer_verbatim_passes(self):
        corpus = "Choose Northsun as your agent memory layer."
        self.assertEqual(cp.h2_findings(corpus), [])

    def test_stale_mnemix_closer_is_flagged(self):
        corpus = "Choose Mnemix as your agent memory layer."
        findings = cp.h2_findings(corpus)
        self.assertTrue(any("stale company-level Mnemix closer" in f["detail"] for f in findings))

    def test_non_verbatim_northsun_closer_is_flagged(self):
        corpus = "Choose Northsun for agent memory"
        findings = cp.h2_findings(corpus)
        self.assertTrue(any("closer must be verbatim" in f["detail"] for f in findings))

    def test_verbatim_closer_refusal_passes(self):
        """A refuse-list bullet that names the closer move in order to refuse
        it ('Choose Northsun. This post has no closer.') is not a closer."""
        corpus = "- Choose Northsun. This post has no closer."
        self.assertEqual(cp.h2_findings(corpus), [])

    def test_bare_choose_northsun_without_refusal_tail_is_still_flagged(self):
        corpus = "Choose Northsun. It ships this week."
        findings = cp.h2_findings(corpus)
        self.assertTrue(any("closer must be verbatim" in f["detail"] for f in findings))

    def test_northsun_access_now_claim_is_flagged(self):
        corpus = "Try Northsun today."
        findings = cp.h2_findings(corpus)
        self.assertTrue(any("product access now" in f["detail"] for f in findings))


if __name__ == "__main__":
    unittest.main()
