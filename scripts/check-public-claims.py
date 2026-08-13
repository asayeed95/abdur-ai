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
    # mnemixUrl() helper, which appends attribution params.
    #
    # Match the actual `href` EXPRESSION, not a bare mention of the helper. An
    # earlier version accepted any `mnemixUrl(` occurrence anywhere in the file,
    # so a component could carry an unused helper call while its CTA href pointed
    # somewhere else entirely — the check would pass on a decoy. Accepting an
    # indirection is only safe when the indirection is the thing being pointed at,
    # AND the helper's own destination is verified (immediately below).
    #
    # A second argument to mnemixUrl() overrides the default `waitlist` fragment,
    # so helper-based CTAs must call it with the surface only.
    href_literal = re.compile(
        r"""href\s*=\s*["']""" + re.escape(WAITLIST_URL) + r"""["']""", re.I
    )
    href_helper = re.compile(r"href\s*=\s*\{\s*mnemixUrl\(\s*[^,)]+\s*\)\s*\}")
    href_helper_with_hash = re.compile(r"href\s*=\s*\{\s*mnemixUrl\([^)]*,[^)]*\)\s*\}")
    for relative in ("components/MnemixSection.tsx", "components/post/LeadMagnets.tsx"):
        content = (ROOT / relative).read_text(encoding="utf-8")
        if href_helper_with_hash.search(content):
            failures.append(
                f"{relative}: Mnemix CTA href passes a second mnemixUrl() argument, "
                "overriding the waitlist fragment"
            )
        elif not href_literal.search(content) and not href_helper.search(content):
            failures.append(
                f"{relative}: Mnemix CTA href must be {WAITLIST_URL!r} or mnemixUrl(<surface>)"
            )

    # Close the indirection the rule above opened.
    #
    # Read the canonical CTA contract from lib/site.ts and validate the ACTUAL
    # mnemixUrl() return template against it. Earlier versions scanned the file for
    # loose substrings — "https://mnemix.ai/" appearing anywhere satisfied the check,
    # so a comment or a decoy string could pass it while the real template was broken.
    site = (ROOT / "lib/site.ts").read_text(encoding="utf-8")
    canon = {}
    for key in ("origin", "fragment", "refParam", "refValue", "surfaceParam"):
        m = re.search(key + r'\s*:\s*"([^"]+)"', site)
        if m:
            canon[key] = m.group(1)

    missing = [k for k in ("origin", "fragment", "refParam", "refValue", "surfaceParam")
               if k not in canon]
    if missing:
        # An unreadable source of truth is a FAILURE, never a skip. Absence of the
        # contract cannot be treated as agreement with it.
        failures.append(
            "lib/site.ts: SITE.flagship.cta is missing " + str(missing)
            + " — the CTA contract cannot be validated"
        )
    else:
        analytics = (ROOT / "lib/analytics.ts").read_text(encoding="utf-8")
        # Capture the RETURN STATEMENT only, then join every template literal in it.
        #
        # Two traps, both hit while writing this:
        #   1. The template is a multi-part concatenation. A regex grabbing only the
        #      first backtick segment reads half a URL and reports the other half
        #      missing — judging a whole from a part.
        #   2. Scoping to the whole function body captures backticks inside COMMENTS
        #      (`location.search` and friends), which then join ahead of the real
        #      template and corrupt the assembled URL. Prose that quotes code is not
        #      code.
        # Scoping to `return ... ;` avoids both.
        body = re.search(r"export function mnemixUrl\([^)]*\)[^{]*\{(.*?)\n\}",
                         analytics, re.S)
        ret = re.search(r"\breturn\b(.*?);", body.group(1), re.S) if body else None
        segments = re.findall(r"`([^`]*)`", ret.group(1)) if ret else []
        if not segments:
            failures.append("lib/analytics.ts: could not locate the mnemixUrl() return template")
        else:
            # Resolve ${CTA.x} against site.ts so the ASSEMBLED url is checked, not
            # the source text of the template.
            resolved = re.sub(r"\$\{CTA\.(\w+)\}",
                              lambda mm: canon.get(mm.group(1), mm.group(0)),
                              "".join(segments))
            resolved = re.sub(r"\$\{[^}]*surface[^}]*\}", "SURFACE", resolved)
            resolved = resolved.replace("${hash}", canon["fragment"])

            q = resolved.find("?")
            h = resolved.find("#")
            if q == -1:
                failures.append("lib/analytics.ts: mnemixUrl() emits no query string")
            elif h == -1:
                # Guarded. `index("#")` on a template without a fragment raised
                # ValueError and killed the checker with a traceback instead of
                # reporting a finding — a crash is not a verdict.
                failures.append(
                    "lib/analytics.ts: mnemixUrl() emits no '#" + canon["fragment"] + "' fragment"
                )
            elif h < q:
                failures.append(
                    "lib/analytics.ts: mnemixUrl() must put the query string before the fragment "
                    "(params after '#' never reach location.search)"
                )

            # Fragment compared EXACTLY. The previous check was case-insensitive, so
            # '#WAITLIST' passed — a different anchor that lands the visitor nowhere.
            if not resolved.endswith("#" + canon["fragment"]):
                failures.append(
                    "lib/analytics.ts: mnemixUrl() must end with the exact fragment '#"
                    + canon["fragment"] + "' (case-sensitive)"
                )
            if not resolved.startswith(canon["origin"]):
                failures.append(
                    "lib/analytics.ts: mnemixUrl() must build from " + repr(canon["origin"])
                )
            for needle in (canon["refParam"] + "=" + canon["refValue"],
                           canon["surfaceParam"] + "="):
                if needle not in resolved:
                    failures.append(
                        "lib/analytics.ts: mnemixUrl() must carry " + repr(needle)
                        + " — without it the attribution carrier is inert"
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
