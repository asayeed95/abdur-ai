"""Offline tests for the abdur.ai AEO pack (AGE-1385).

Run: python3 content/aeo/tests/test_aeo_pages.py

Answer-engine pages must quote brand-map.json (and voice VERSION.json when
that bundle is present). They must fail if:

- the closer is the stale "[LAB]" one (brand-map rule stale-closer);
- Mnemix is treated as the commercial product;
- a refused research-docx metric appears as an allowed claim;
- northsun.ai is written as a live CTA;
- /about or /hire were rewritten (AGE-462: those funnels stay put).
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "content" / "workflows"))
import claims_policy as cp  # noqa: E402

BRAND_MAP_PATH = ROOT / "content" / "brand" / "brand-map.json"
BRAND_MAP_BLOB_SHA1 = "4e8dbd5643bed2af47995add45032298dbac135a"
VOICE_VERSION = ROOT / "content" / "voice" / "VERSION.json"
AUTHORITY = ROOT / "content" / "aeo" / "AUTHORITY.json"

PAGES = {
    "what-is-northsun": ROOT / "app" / "what-is-northsun" / "page.tsx",
    "what-is-mnemix": ROOT / "app" / "what-is-mnemix" / "page.tsx",
    "who-is-abdur": ROOT / "app" / "who-is-abdur" / "page.tsx",
}
FACTS = ROOT / "lib" / "aeo.ts"
LAYOUT = ROOT / "app" / "layout.tsx"
SITEMAP = ROOT / "app" / "sitemap.ts"
LLMS = ROOT / "app" / "llms.txt" / "route.ts"
ABOUT = ROOT / "app" / "about" / "page.tsx"
HIRE = ROOT / "app" / "hire" / "page.tsx"

# AGE-462: do not rewrite the career surfaces while adding AEO pages.
FROZEN_SHA256 = {
    ABOUT: "94a6d2e5eff224d2fe11576d5a1d98bd17adaabc8394f82cfd912f0d36857694",
    HIRE: "d6b544f44168b9a4d9704dc38853f3dd969a9ac979e7f0b4d7d2e7a4631d1f40",
}

BANNED_CLAIM_TOKENS = {
    "mnemix-v2.4": re.compile(r"Mnemix\s+v2\.4", re.I),
    "latency-420ms": re.compile(r"420\s*ms", re.I),
    "latency-18ms": re.compile(r"\b18\s*ms", re.I),
    "streams-100k": re.compile(r"100[,.]?000\s+concurrent\s+streams", re.I),
    "memory-64pct": re.compile(r"64\s*%\s*memory\s+reduction", re.I),
    "price-12400": re.compile(r"\$12[,.]?400\s*/\s*month", re.I),
    "cost-68pct": re.compile(r"68\s*%\s+cost", re.I),
    "faster-95pct": re.compile(r"95\s*%\s+faster", re.I),
    "sub-20ms-retrieval": re.compile(r"sub[- ]?20\s*ms\s+retrieval", re.I),
}

CTA_TO_NORTHSUN_DNS = re.compile(
    r"\b(visit|sign\s*up|go\s+to|try|start|register)\b[^.\n]{0,60}northsun\.ai",
    re.I,
)


def brand_map() -> dict:
    return json.loads(BRAND_MAP_PATH.read_text(encoding="utf-8"))


def git_blob_sha1(path: Path) -> str:
    content = path.read_bytes()
    return hashlib.sha1(b"blob %d\x00" % len(content) + content).hexdigest()


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def public_aeo_sources() -> list[Path]:
    return [FACTS, LAYOUT, SITEMAP, LLMS, *PAGES.values()]


class PresenceTests(unittest.TestCase):
    def test_answer_pages_exist(self):
        missing = [name for name, path in PAGES.items() if not path.is_file()]
        self.assertEqual(missing, [], f"missing AEO pages: {missing}")
        self.assertTrue(FACTS.is_file(), "lib/aeo.ts missing")
        self.assertTrue(AUTHORITY.is_file(), "content/aeo/AUTHORITY.json missing")


class AuthorityTests(unittest.TestCase):
    def test_authority_pins_brand_map_blob(self):
        data = json.loads(AUTHORITY.read_text(encoding="utf-8"))
        self.assertEqual(data["brand_map"]["path"], "content/brand/brand-map.json")
        self.assertEqual(data["brand_map"]["git_blob_sha1"], BRAND_MAP_BLOB_SHA1)
        self.assertEqual(git_blob_sha1(BRAND_MAP_PATH), BRAND_MAP_BLOB_SHA1)
        self.assertEqual(data["brand_map"]["sha256"], sha256(BRAND_MAP_PATH))

    def test_facts_module_quotes_brand_map(self):
        text = read(FACTS)
        m = brand_map()
        self.assertIn(m["brands"]["northsun"]["closer"], text)
        self.assertIn(m["brands"]["northsun"]["identity"], text)
        self.assertIn(m["brands"]["mnemix"]["attribution"], text)
        self.assertIn(m["cta_policy"]["cta_href"], text)
        self.assertIn(BRAND_MAP_BLOB_SHA1, text)

    def test_voice_hash_quoted_when_bundle_present(self):
        data = json.loads(AUTHORITY.read_text(encoding="utf-8"))
        if VOICE_VERSION.is_file():
            voice = json.loads(VOICE_VERSION.read_text(encoding="utf-8"))
            self.assertEqual(data["voice"]["bundle_sha256"], voice["bundle_sha256"])
            self.assertIn(voice["bundle_sha256"], read(FACTS))
        else:
            self.assertEqual(data["voice"]["status"], "absent-on-main")


class AnswerCopyTests(unittest.TestCase):
    def test_northsun_page_answers_first(self):
        text = read(PAGES["what-is-northsun"])
        closer = brand_map()["brands"]["northsun"]["closer"]
        identity = brand_map()["brands"]["northsun"]["identity"]
        self.assertIn("Northsun is the memory and enrichment layer for AI agents.", text)
        self.assertIn(identity, text)
        self.assertIn(closer, text)
        self.assertIn("/#waitlist", text)

    def test_mnemix_page_is_lab_not_platform(self):
        text = read(PAGES["what-is-mnemix"])
        self.assertIn("Mnemix is a free diagnostic from Northsun.", text)
        self.assertIn("Memory Lab", text)
        self.assertIn("Forgetting Test", text)
        self.assertIn("not the commercial platform", text.lower())

    def test_abdur_page_points_career_at_hire(self):
        text = read(PAGES["who-is-abdur"])
        self.assertIn("/hire", text)
        self.assertIn("abdur.ai", text)
        self.assertIn("Northsun", text)

    def test_no_stale_closer_on_aeo_surfaces(self):
        rules = brand_map()["stale_company_patterns"]
        stale = next(r for r in rules if r["id"] == "stale-closer")
        pattern = re.compile(stale["regex"])
        for path in public_aeo_sources():
            if not path.is_file():
                continue
            self.assertIsNone(
                pattern.search(read(path)),
                f"{path.relative_to(ROOT)}: stale Mnemix closer",
            )

    def test_no_banned_claims_on_aeo_surfaces(self):
        for path in public_aeo_sources():
            if not path.is_file():
                continue
            text = read(path)
            for token, pattern in BANNED_CLAIM_TOKENS.items():
                self.assertIsNone(
                    pattern.search(text),
                    f"{path.relative_to(ROOT)}: banned claim {token}",
                )

    def test_northsun_dns_is_not_a_cta(self):
        for path in public_aeo_sources():
            if not path.is_file():
                continue
            match = CTA_TO_NORTHSUN_DNS.search(read(path))
            self.assertIsNone(
                match,
                f"{path.relative_to(ROOT)}: northsun.ai CTA {match and match.group(0)!r}",
            )

    def test_claims_policy_clean_on_aeo_pages(self):
        for name, path in PAGES.items():
            findings = cp.h2_findings(read(path))
            self.assertEqual(findings, [], f"{name}: {findings}")


class MachineLayerTests(unittest.TestCase):
    def test_layout_has_northsun_organization_jsonld(self):
        text = read(LAYOUT)
        self.assertIn('"@type": "Organization"', text)
        self.assertIn('name: "Northsun"', text)
        self.assertIn(f"{'{'}SITE.url{'}'}/#northsun", text)

    def test_each_page_emits_faqpage_jsonld(self):
        for name, path in PAGES.items():
            text = read(path)
            self.assertIn("FAQPage", text, f"{name} missing FAQPage JSON-LD")
            self.assertIn("acceptedAnswer", text, f"{name} missing FAQ answers")

    def test_sitemap_lists_answer_pages(self):
        text = read(SITEMAP)
        for path in ("/what-is-northsun", "/what-is-mnemix", "/who-is-abdur"):
            self.assertIn(path, text)


class LlmsTxtTests(unittest.TestCase):
    def test_drops_real_metrics_phrase(self):
        text = read(LLMS)
        self.assertNotIn("real metrics", text.lower())

    def test_links_answer_pages(self):
        text = read(LLMS)
        for path in ("/what-is-northsun", "/what-is-mnemix", "/who-is-abdur"):
            self.assertIn(path, text)

    def test_keeps_required_public_truth(self):
        text = read(LLMS)
        self.assertIn(cp.IDENTITY, text)
        self.assertIn("free diagnostic from Northsun", text)
        self.assertIn("https://northsun.ai", text)
        self.assertIn("/hire", text)

    def test_career_is_pointer_not_closer(self):
        text = read(LLMS)
        # Job-seeking language may exist as a pointer, but the AEO closer of
        # the file must be the product/logbook, not a frontier-lab ask.
        hire_idx = text.find("/hire")
        self.assertGreater(hire_idx, 0)
        self.assertNotIn("What Abdur is currently looking for", text)


class FrozenCareerSurfaceTests(unittest.TestCase):
    def test_about_and_hire_untouched(self):
        for path, expected in FROZEN_SHA256.items():
            self.assertEqual(
                sha256(path),
                expected,
                f"{path.relative_to(ROOT)} was rewritten; AGE-462 forbids it",
            )


if __name__ == "__main__":
    unittest.main()
