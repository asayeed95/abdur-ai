"""Offline tests for the shared public-claims policy.

Run: python3 content/workflows/tests/test_claims_policy.py
"""

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import claims_policy as cp

ROOT = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location("site_claims", ROOT / "scripts/check-public-claims.py")
site_claims = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site_claims)


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


class FrozenSurfaceTests(unittest.TestCase):
    def test_approved_method_path_tuples_and_hedged_latency_pass(self):
        for corpus in (
            "POST /v1/recall_and_enrich.",
            "POST /v1/calls/end",
            "GET /v1/caller/{phone_number}",
            "GET /v1/caller/+15551234567",
            'designed for\n<span>sub-300ms voice recall</span>',
        ):
            with self.subTest(corpus=corpus):
                self.assertEqual(cp.h2_findings(corpus), [])

    def test_internal_routes_and_nested_paths_fail_without_brand(self):
        for corpus in (
            "GET /v1/evidence/:ref",
            "POST /v1/beacon/inject",
            "POST /v1/recall_and_enrich/debug",
            "POST /v1/calls/endless",
            "GET /v1/caller/{phone_number}/history",
        ):
            with self.subTest(corpus=corpus):
                self.assertTrue(any("non-frozen" in f["detail"] for f in cp.h2_findings(corpus)))

    def test_wrong_methods_fail(self):
        for corpus in ("GET /v1/recall_and_enrich", "GET /v1/calls/end", "POST /v1/caller/{phone_number}"):
            with self.subTest(corpus=corpus):
                self.assertTrue(any("wrong method" in f["detail"] for f in cp.h2_findings(corpus)))


class ProductComponentTests(unittest.TestCase):
    """Exercise the static adapter, including source selection and JSX prose."""

    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        for relative in site_claims.PUBLIC_SOURCES:
            target = self.root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text((ROOT / relative).read_text())
        root_patch = patch.object(site_claims, "ROOT", self.root)
        root_patch.start()
        self.addCleanup(root_patch.stop)
        self.component = self.root / "components/MnemixSection.tsx"
        self.original = self.component.read_text()

    def test_corrected_public_copy_passes(self):
        self.assertEqual(site_claims.check_static(), [])
        self.assertIn(cp.ALLOWED_LATENCY, cp.public_prose(self.original))

    def test_brandless_routes_cannot_hide_in_product_component(self):
        for route in ("GET /v1/evidence/:ref", "POST /v1/beacon/inject"):
            with self.subTest(route=route):
                self.component.write_text(self.original + f'\nconst role = "{route}";')
                self.assertTrue(any("non-frozen" in f for f in site_claims.check_static()))

    def test_brandless_beacon_and_proactive_claims_fail_even_wrapped(self):
        for prose in (
            "Beacon is live today.",
            "Beacon delivers context to agents.",
            "The memory layer surfaces what matters to the agent, unprompted.",
            "Proactive memory reaches out first.",
            "Proactive context delivery is live.",
            "Proactive memory pushes context to every agent.",
            '<p>Proactive <span>delivery</span> is available now.</p>',
            '<p><span>Beacon</span>{" "}is the\nnewest — it flips memory from reactive to proactive.</p>',
            '<p>The layer surfaces context <strong>before the model</strong>\nknows to ask for it.</p>',
            '<p>Proactive memory <span>speaks</span>{" "}unprompted.</p>',
            "Beacon is coming soon.",
        ):
            with self.subTest(prose=prose):
                self.component.write_text(self.original + "\n" + prose)
                self.assertTrue(any("founder-gated Beacon/proactive" in f for f in site_claims.check_static()))

    def test_mixed_portfolio_source_keeps_brand_context(self):
        path = self.root / "lib/site.ts"
        path.write_text(path.read_text() + '\nconst unrelated = "A workshop costs $47 and takes 30 seconds.";')
        self.assertEqual(site_claims.check_static(), [])

    def test_mixed_portfolio_brand_claims_are_still_checked(self):
        path = self.root / "lib/site.ts"
        path.write_text(path.read_text() + '\nconst claim = "Northsun supports GET /v1/evidence/:ref";')
        self.assertTrue(any("lib/site.ts: non-frozen" in f for f in site_claims.check_static()))


if __name__ == "__main__":
    unittest.main()
