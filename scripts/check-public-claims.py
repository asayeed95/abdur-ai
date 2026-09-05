#!/usr/bin/env python3
"""Check public abdur.ai copy against the shared Northsun claims policy.

Northsun is the commercial platform; Mnemix survives only as the Memory Lab /
Forgetting Test diagnostic (see content/brand/brand-map.json).

Static mode is safe for local/CI use. ``--verify-live`` adds only read-only
HTTP checks that the product landing the public CTA points at exists.  It
never schedules, posts, sends, or reads credentials.
"""

from __future__ import annotations

import argparse
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "content" / "workflows"))
import claims_policy  # noqa: E402

# The three registers a published post may declare. Mirrors lib/registers.ts —
# if you add one there, add it here, or a post can declare a register the site
# renders and this gate does not police.
REGISTERS = ("reported", "designed", "argued")
POSTS_DIR = ROOT / "content" / "posts"


PUBLIC_SOURCES = (
    "lib/site.ts",
    "components/MnemixSection.tsx",
    "components/NorthsunWaitlistForm.tsx",
    "components/post/LeadMagnets.tsx",
    "app/now/page.tsx",
    "app/hire/page.tsx",
    "app/about/page.tsx",
    "app/llms.txt/route.ts",
)
# northsun.ai DNS is not live yet (verified 2026-08-22), so product CTAs must
# point at owned surfaces: the on-site waitlist form backed by the real
# /api/subscribe route and the frozen "mnemix-beta" audience list.
SITE_URL = "https://abdur.ai"
WAITLIST_ANCHOR = "/#waitlist"
WAITLIST_LIST_ID = "mnemix-beta"


def sources() -> list[Path]:
    posts = sorted((ROOT / "content" / "posts").glob("*.mdx"))
    return [ROOT / relative for relative in PUBLIC_SOURCES] + posts


def check_static() -> list[str]:
    failures: list[str] = []
    for path in sources():
        content = path.read_text(encoding="utf-8")
        for segment in claims_policy.mnemix_context_segments(content):
            for finding in claims_policy.h2_findings(segment):
                failure = f"{path.relative_to(ROOT)}: {finding['detail']}"
                if failure not in failures:
                    failures.append(failure)

    required = {
        "lib/site.ts": claims_policy.IDENTITY,
        "components/MnemixSection.tsx": claims_policy.IDENTITY,
        "app/llms.txt/route.ts": claims_policy.IDENTITY,
        "app/hire/page.tsx": claims_policy.IDENTITY,
        "components/post/LeadMagnets.tsx": claims_policy.IDENTITY,
        "components/MnemixSection.tsx#cta": "NorthsunWaitlistForm",
        "components/NorthsunWaitlistForm.tsx#list": WAITLIST_LIST_ID,
        "components/post/LeadMagnets.tsx#cta": WAITLIST_ANCHOR,
        "components/MnemixSection.tsx#closer": claims_policy.CLOSER,
    }
    for key, expected in required.items():
        relative = key.split("#", 1)[0]
        content = (ROOT / relative).read_text(encoding="utf-8")
        if expected.lower() not in content.lower():
            failures.append(f"{relative}: missing required public-truth value {expected!r}")

    for relative in ("components/MnemixSection.tsx", "components/post/LeadMagnets.tsx"):
        content = (ROOT / relative).read_text(encoding="utf-8").lower()
        if "waitlist" not in content and "beta" not in content:
            failures.append(f"{relative}: Northsun CTA must invite waitlist or beta access")
    return failures


def _frontmatter_keys(text: str) -> dict[str, str]:
    """Top-level frontmatter keys and their inline scalar values.

    Deliberately stdlib-only: this gate runs in pre-commit and CI, and adding a
    YAML dependency to it would make the claims gate the first thing to break
    on a fresh checkout. Nested keys are not needed — every key this policy
    cares about is top-level. A key whose value is a block (``receipts:``) maps
    to "" and is detected by presence, not value.
    """
    if not text.startswith("---"):
        return {}
    _, _, rest = text.partition("---")
    body, sep, _ = rest.partition("\n---")
    if not sep:
        return {}
    keys: dict[str, str] = {}
    for line in body.splitlines():
        if not line or line[0].isspace() or line.lstrip().startswith("#"):
            continue
        key, colon, value = line.partition(":")
        if colon and key.strip() == key:
            keys[key.strip()] = value.strip().strip('"\'')
    return keys


def _receipt_paths(text: str) -> list[str]:
    """Non-empty `path:` values inside the frontmatter `receipts:` block.

    `receipts:` with no items, `receipts: []`, or items with a blank path all
    return [] — a declared-but-empty block must not satisfy `reported`.
    """
    if not text.startswith("---"):
        return []
    body = text.partition("---")[2].partition("\n---")[0]
    paths, inside = [], False
    for line in body.splitlines():
        if inside and line and not line[0].isspace():
            break
        if re.match(r"^receipts:\s*(\[\s*\]\s*)?$", line):
            inside = not line.rstrip().endswith("]")
            continue
        if inside:
            m = re.match(r"^\s+-?\s*path:\s*[\"']?([^\"'\n]+?)[\"']?\s*$", line)
            if m and m.group(1).strip():
                paths.append(m.group(1).strip())
    return paths


def _ts_registers() -> tuple[str, ...]:
    """The register list as `lib/registers.ts` actually defines it."""
    source = (ROOT / "lib" / "registers.ts").read_text(encoding="utf-8")
    match = re.search(r"export const REGISTERS = \[(.*?)\] as const;", source, re.S)
    if not match:
        return ()
    return tuple(re.findall(r'"([a-z]+)"', match.group(1)))


def check_registers() -> list[str]:
    """Every published post declares a register, and honours what it obliges.

    Three things, none of which the other gates cover:

    1. The site build refuses an undeclared post (``lib/posts.ts``), but only
       for pages it renders. This re-checks every published file directly.
    2. A ``reported`` post asserts an event happened, so it owes a receipt.
       That obligation is the whole difference between the registers and it is
       not expressible in the type system.
    3. This module's register list must still match ``lib/registers.ts``.
       Without this, adding a fourth register in TypeScript would ship a
       register the site renders and this gate silently does not police.
    """
    failures: list[str] = []

    declared = _ts_registers()
    if declared != REGISTERS:
        failures.append(
            f"lib/registers.ts defines {declared or '<unparseable>'} but this gate "
            f"polices {REGISTERS} — update scripts/check-public-claims.py"
        )

    for path in sorted(POSTS_DIR.glob("*.mdx")):
        rel = path.relative_to(ROOT)
        keys = _frontmatter_keys(path.read_text(encoding="utf-8"))
        register = keys.get("register", "")
        if register not in REGISTERS:
            failures.append(
                f"{rel}: register must be one of {', '.join(REGISTERS)}; "
                f"got {register or '<missing>'!r}"
            )
            continue
        if register == "reported" and not _receipt_paths(path.read_text(encoding="utf-8")):
            failures.append(
                f"{rel}: register 'reported' claims an event happened and owes a "
                f"receipts: block with at least one item carrying a non-empty path: "
                f"(PR, SHA, log, or measurement) — an empty or absent block is not a receipt"
            )
    return failures


def _read(url: str) -> tuple[int, str]:
    request = urllib.request.Request(url, headers={"User-Agent": "abdur-ai-public-claims-check/1.1"})
    with urllib.request.urlopen(request, timeout=15) as response:
        return response.status, response.read().decode("utf-8", errors="replace")


def check_live() -> list[str]:
    try:
        landing_status, landing = _read(SITE_URL)
    except (OSError, urllib.error.URLError, urllib.error.HTTPError) as error:
        return [f"live beta verification failed: {error}"]
    failures: list[str] = []
    if landing_status != 200:
        failures.append(f"{SITE_URL} returned {landing_status}, not 200")
    if "waitlist" not in landing.lower():
        failures.append("home page no longer presents the Northsun waitlist the product CTAs point at")
    return failures


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify-live", action="store_true", help="perform read-only beta-access checks")
    args = parser.parse_args(argv)
    failures = check_static()
    failures.extend(check_registers())
    if args.verify_live:
        failures.extend(check_live())
    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        return 1
    print("PASS: shared static public-claims policy")
    print("PASS: registers mirror lib/registers.ts; reported posts carry receipts")
    if args.verify_live:
        print("PASS: live Northsun private-beta landing")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
