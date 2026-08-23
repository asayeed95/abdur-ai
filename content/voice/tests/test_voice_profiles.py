"""Offline tests for the content/voice profile bundle (AGE-1216).

Run: python3 content/voice/tests/test_voice_profiles.py

The bundle lets runtimes load content/brand/brand-map.json first, then the
voice profiles, verifying integrity by version hash (content/voice/VERSION.json).
These tests were written failing-first; they must fail if:

- the closer is the stale "[LAB]" one (brand-map rule ``stale-closer``)
  anywhere in the bundle;
- Mnemix is presented as the commercial product/platform;
- a banned metric/claim appears on an allowed surface (voice profiles or
  good examples) instead of only on the deny-list.
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

VOICE = ROOT / "content" / "voice"
VERSION_FILE = VOICE / "VERSION.json"
BRAND_MAP_PATH = ROOT / "content" / "brand" / "brand-map.json"
# The exact brand-map blob this voice bundle was written against.  If the
# brand map changes, a new bundle version must be issued deliberately.
BRAND_MAP_BLOB_SHA1 = "4e8dbd5643bed2af47995add45032298dbac135a"

PROFILE_FILES = ("abdur-voice.md", "northsun-voice.md", "mnemix-voice.md")
# Surfaces where every claim must be allowed as-is.
POSITIVE_FILES = PROFILE_FILES + ("examples-good.md",)
# Surfaces that quote banned material on purpose (deny-list + bad examples).
QUOTING_FILES = ("banned-phrases.md", "examples-bad.md")
BUNDLE_FILES = POSITIVE_FILES + QUOTING_FILES

# Refused claims (AGE-1216).  Each must be deny-listed verbatim in
# banned-phrases.md and must never appear on a positive surface.
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


def read(name: str) -> str:
    return (VOICE / name).read_text(encoding="utf-8")


def brand_map() -> dict:
    return json.loads(BRAND_MAP_PATH.read_text(encoding="utf-8"))


def git_blob_sha1(path: Path) -> str:
    content = path.read_bytes()
    return hashlib.sha1(b"blob %d\x00" % len(content) + content).hexdigest()


class BundlePresenceTests(unittest.TestCase):
    def test_voice_bundle_files_exist(self):
        missing = [n for n in BUNDLE_FILES if not (VOICE / n).is_file()]
        self.assertEqual(missing, [], f"missing voice files: {missing}")
        self.assertTrue(VERSION_FILE.is_file(), "content/voice/VERSION.json missing")


class VersionHashTests(unittest.TestCase):
    """Runtimes load brand-map first, then the voice bundle by version hash."""

    def version(self) -> dict:
        return json.loads(VERSION_FILE.read_text(encoding="utf-8"))

    def test_version_pins_exact_brand_map_blob(self):
        data = self.version()
        self.assertEqual(data["brand_map"]["path"], "content/brand/brand-map.json")
        self.assertEqual(data["brand_map"]["git_blob_sha1"], BRAND_MAP_BLOB_SHA1)
        self.assertEqual(
            git_blob_sha1(BRAND_MAP_PATH),
            BRAND_MAP_BLOB_SHA1,
            "brand-map.json changed; the voice bundle must be re-issued against "
            "the new map in a deliberate change, never silently",
        )
        self.assertEqual(
            data["brand_map"]["sha256"],
            hashlib.sha256(BRAND_MAP_PATH.read_bytes()).hexdigest(),
        )

    def test_version_hash_matches_voice_files(self):
        data = self.version()
        self.assertEqual(sorted(data["files"]), sorted(BUNDLE_FILES))
        manifest_lines = []
        for name in sorted(BUNDLE_FILES):
            digest = hashlib.sha256((VOICE / name).read_bytes()).hexdigest()
            self.assertEqual(
                data["files"][name], digest, f"stale sha256 for {name} in VERSION.json"
            )
            manifest_lines.append(f"{name} {digest}")
        bundle = hashlib.sha256(("\n".join(manifest_lines) + "\n").encode("utf-8")).hexdigest()
        self.assertEqual(data["bundle_sha256"], bundle, "bundle_sha256 is stale")

    def test_load_order_is_brand_map_first(self):
        data = self.version()
        self.assertEqual(data["load_order"][0], "content/brand/brand-map.json")
        self.assertEqual(
            sorted(data["load_order"][1:]),
            sorted(BUNDLE_FILES),
            "load_order must list every bundle file after the brand map",
        )


class CloserTests(unittest.TestCase):
    def test_northsun_closer_is_verbatim_brand_map_closer(self):
        closer = brand_map()["brands"]["northsun"]["closer"]
        self.assertEqual(closer, cp.CLOSER)
        self.assertIn(closer, read("northsun-voice.md"))
        self.assertIn(closer, read("examples-good.md"))

    def test_no_stale_mnemix_closer_anywhere_in_bundle(self):
        rules = brand_map()["stale_company_patterns"]
        stale_closer = next(r for r in rules if r["id"] == "stale-closer")
        pattern = re.compile(stale_closer["regex"])
        for name in BUNDLE_FILES:
            self.assertIsNone(
                pattern.search(read(name)),
                f"{name}: stale Mnemix closer present — {stale_closer['reason']}",
            )


class MnemixScopeTests(unittest.TestCase):
    def test_mnemix_attribution_is_verbatim(self):
        text = read("mnemix-voice.md")
        self.assertIn("Mnemix is a free diagnostic from Northsun.", text)
        self.assertIn(cp.LAB_ATTRIBUTION, text)

    def test_mnemix_explicitly_not_the_commercial_platform(self):
        self.assertIn(
            "Mnemix is not the commercial platform", read("mnemix-voice.md")
        )

    def test_no_stale_company_patterns_on_positive_surfaces(self):
        rules = [
            (r["id"], re.compile(r["regex"]), r["reason"])
            for r in brand_map()["stale_company_patterns"]
        ]
        for name in POSITIVE_FILES:
            text = read(name)
            for rule_id, pattern, reason in rules:
                self.assertIsNone(
                    pattern.search(text), f"{name}: [{rule_id}] {reason}"
                )


class BannedClaimTests(unittest.TestCase):
    def test_every_banned_claim_is_deny_listed(self):
        text = read("banned-phrases.md")
        for token, pattern in BANNED_CLAIM_TOKENS.items():
            self.assertTrue(
                pattern.search(text),
                f"banned-phrases.md must deny-list {token!r} verbatim",
            )

    def test_banned_claims_never_appear_as_allowed(self):
        for name in POSITIVE_FILES:
            text = read(name)
            for token, pattern in BANNED_CLAIM_TOKENS.items():
                self.assertIsNone(
                    pattern.search(text),
                    f"{name}: banned claim {token!r} presented as allowed",
                )

    def test_no_percent_metrics_on_positive_surfaces(self):
        # claims_policy has no percent rule, so enforce it here: unratified
        # percentage claims (64% / 68% / 95% ...) never belong in voice law.
        for name in POSITIVE_FILES:
            match = re.search(r"\d+\s*%", read(name))
            self.assertIsNone(
                match, f"{name}: percent-shaped metric {match and match.group(0)!r}"
            )


class ClaimsPolicyTests(unittest.TestCase):
    def test_positive_surfaces_have_no_claims_findings(self):
        for name in POSITIVE_FILES:
            findings = cp.h2_findings(read(name))
            self.assertEqual(
                findings, [], f"{name}: claims-policy findings: {findings}"
            )

    def test_bad_examples_are_actually_caught_by_claims_policy(self):
        self.assertTrue(
            cp.h2_findings(read("examples-bad.md")),
            "examples-bad.md must contain material the classifier flags, "
            "otherwise the bad examples teach nothing",
        )


class ChannelTests(unittest.TestCase):
    def test_abdur_sayeed_publish_paths_are_refused(self):
        text = read("abdur-voice.md")
        self.assertIn("@abdur_sayeed", text)
        self.assertIn("Do not write publish paths for @abdur_sayeed.", text)

    def test_northsunai_is_company_voice_only(self):
        text = read("northsun-voice.md")
        self.assertIn("@northsunai", text)
        self.assertIn("company voice only", text.lower())
        self.assertIn("never abdur first-person", text.lower())

    def test_northsun_dns_is_not_presented_as_live_cta(self):
        cta = re.compile(
            r"\b(visit|sign\s*up|go\s+to|try|start|register)\b[^.\n]{0,60}northsun\.ai",
            re.I,
        )
        for name in POSITIVE_FILES:
            match = cta.search(read(name))
            self.assertIsNone(
                match,
                f"{name}: northsun.ai DNS is not live; it must never be a CTA "
                f"({match and match.group(0)!r})",
            )
        self.assertIn(
            brand_map()["cta_policy"]["cta_href"],
            read("northsun-voice.md"),
            "northsun-voice.md must point CTAs at the owned waitlist surface",
        )


if __name__ == "__main__":
    unittest.main()
