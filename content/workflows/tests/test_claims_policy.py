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



class CodeMaskingTests(unittest.TestCase):
    """Scar 2026-08-05: a postmortem quoting its own commit subject —
    `fix(web): dashboard tenants select('*') 42501s unconditionally post-031` —
    was blocked as a latency claim. 42501 is the Postgres SQLSTATE for
    permission-denied; _TIME_UNIT accepts a bare "s", so it read as seconds.

    NUMERIC marketing claims (latency, price) are masked inside code spans,
    fenced blocks, and the frontmatter `source:` provenance path. STRUCTURAL
    claims are NOT masked — a forbidden route hidden in backticks is still caught.
    """

    def test_numeric_claims_caught_in_prose(self):
        self.assertTrue(cp.h2_findings("Recall is under 300ms."))
        self.assertTrue(cp.h2_findings("Typical recall is 120ms."))
        self.assertTrue(cp.h2_findings("Pro is $49/month."))

    def test_numeric_claims_ignored_inside_code(self):
        self.assertFalse(cp.h2_findings("the commit `select('*') 42501s unconditionally`"))
        self.assertFalse(cp.h2_findings("```\nERROR 42501s after 300ms\n```"))

    def test_source_provenance_path_ignored(self):
        self.assertFalse(cp.h2_findings(
            "source: content/sources/repo-events/mnemix-aee3f57-select-42501s-unconditionally-post.md"))

    def test_published_frontmatter_still_checked(self):
        # description/tldr ARE published prose — masking source: must not leak to them.
        self.assertTrue(cp.h2_findings("description: Mnemix answers in under 300ms."))

    def test_structural_claims_still_caught_inside_code(self):
        self.assertTrue(cp.h2_findings("we call `/v1/observe`"))
        self.assertTrue(cp.h2_findings("`enrichment by Clearbit`"))
        self.assertTrue(cp.h2_findings("`Baylio` runs it"))
        self.assertTrue(cp.h2_findings("`Choose Mnemix as your memory thing.`"))



if __name__ == "__main__":
    unittest.main()

