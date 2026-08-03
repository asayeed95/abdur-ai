#!/usr/bin/env python3
"""Check public abdur.ai copy against the shared Mnemix claims policy.

Static mode is safe for local/CI use. ``--verify-live`` adds only read-only
HTTP checks that the beta waitlist and signup route exist before a public CTA
relies on them.  It never schedules, posts, sends, or reads credentials.
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


PUBLIC_SOURCES = (
    "lib/site.ts",
    "components/MnemixSection.tsx",
    "components/post/LeadMagnets.tsx",
    "app/now/page.tsx",
    "app/hire/page.tsx",
    "app/about/page.tsx",
    "app/llms.txt/route.ts",
)
WAITLIST_URL = "https://mnemix.ai/#waitlist"


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
    }
    for key, expected in required.items():
        relative = key.split("#", 1)[0]
        content = (ROOT / relative).read_text(encoding="utf-8")
        if expected.lower() not in content.lower():
            failures.append(f"{relative}: missing required public-truth value {expected!r}")

    # The Mnemix CTA destination may be the literal waitlist URL *or* the
    # mnemixUrl() helper, which appends attribution params. Accepting an
    # indirection is only safe because the helper itself is verified below —
    # without that, "any call to a function named mnemixUrl" would be a blank
    # cheque that a later edit could quietly point anywhere.
    for relative in ("components/MnemixSection.tsx", "components/post/LeadMagnets.tsx"):
        content = (ROOT / relative).read_text(encoding="utf-8").lower()
        if WAITLIST_URL.lower() not in content and "mnemixurl(" not in content:
            failures.append(
                f"{relative}: Mnemix CTA must link to {WAITLIST_URL!r} or use mnemixUrl()"
            )

    # Close the indirection the rule above opened.
    analytics = (ROOT / "lib/analytics.ts").read_text(encoding="utf-8")
    if 'hash = "waitlist"' not in analytics:
        failures.append("lib/analytics.ts: mnemixUrl() default destination must be the waitlist")
    if "https://mnemix.ai/" not in analytics:
        failures.append("lib/analytics.ts: mnemixUrl() must build a mnemix.ai URL")
    # Query string must precede the fragment. Reversed, the params land inside
    # the fragment, never reach location.search, and the attribution carrier is
    # silently inert while looking exactly like a working one.
    built = re.search(r"return\s+`(https://mnemix\.ai/[^`]*)`", analytics)
    if not built:
        failures.append("lib/analytics.ts: could not verify the mnemixUrl() template")
    elif "?" not in built.group(1) or built.group(1).index("#") < built.group(1).index("?"):
        failures.append(
            "lib/analytics.ts: mnemixUrl() must put the query string before the fragment "
            "(params after '#' never reach location.search)"
        )

    for relative in ("components/MnemixSection.tsx", "components/post/LeadMagnets.tsx"):
        content = (ROOT / relative).read_text(encoding="utf-8").lower()
        if "waitlist" not in content and "beta" not in content:
            failures.append(f"{relative}: Mnemix CTA must invite waitlist or beta access")
    return failures


def _read(url: str) -> tuple[int, str]:
    request = urllib.request.Request(url, headers={"User-Agent": "abdur-ai-public-claims-check/1.1"})
    with urllib.request.urlopen(request, timeout=15) as response:
        return response.status, response.read().decode("utf-8", errors="replace")


def check_live() -> list[str]:
    try:
        landing_status, landing = _read("https://mnemix.ai")
        signup_status, _ = _read("https://mnemix.ai/signup")
    except (OSError, urllib.error.URLError, urllib.error.HTTPError) as error:
        return [f"live beta verification failed: {error}"]
    failures: list[str] = []
    if landing_status != 200:
        failures.append(f"https://mnemix.ai returned {landing_status}, not 200")
    if signup_status != 200:
        failures.append(f"https://mnemix.ai/signup returned {signup_status}, not 200")
    if "private beta" not in landing.lower() or "waitlist" not in landing.lower():
        failures.append("Mnemix landing page no longer presents a visible private-beta waitlist")
    return failures


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify-live", action="store_true", help="perform read-only beta-access checks")
    args = parser.parse_args(argv)
    failures = check_static()
    if args.verify_live:
        failures.extend(check_live())
    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        return 1
    print("PASS: shared static public-claims policy")
    if args.verify_live:
        print("PASS: live Mnemix private-beta waitlist and signup route")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
