#!/usr/bin/env python3
"""Brand regression check for the Northsun / Mnemix dual-brand law.

Fails if stale company-level Mnemix branding returns anywhere it can be seen,
while allowing:

- MNEMIX_MEMORY_LAB — the free Memory Lab / Forgetting Test on mnemix.ai,
  attributed as a free diagnostic from Northsun;
- LEGACY_TECHNICAL_IDENTIFIER — frozen identifiers (env vars, list ids, tags,
  repo slugs, package scopes, component/export names, analytics events);
- HISTORICAL_EVIDENCE — dated posts, receipts, archives, ship-log entries.

Two scans, both driven by content/brand/brand-map.json:

1. Stale-pattern scan: precise company-level Mnemix branding patterns are
   denied repo-wide (posts included), except in the policy/test files that
   quote them and in the historical archive.
2. Live-surface default-deny: on live site surfaces (app/, components/, lib/,
   ...) every line mentioning Mnemix must match an allowed context. New prose
   that brands the product as Mnemix fails even if it dodges scan 1.

Read-only; exits 1 with file:line findings on failure.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BRAND_MAP = ROOT / "content" / "brand" / "brand-map.json"


def load_map() -> dict:
    return json.loads(BRAND_MAP.read_text(encoding="utf-8"))


def iter_text_files() -> list[Path]:
    skip_dirs = {".git", "node_modules", ".next", "coverage"}
    files: list[Path] = []
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file():
            continue
        if any(part in skip_dirs for part in path.parts):
            continue
        files.append(path)
    return files


def read_lines(path: Path) -> list[str] | None:
    try:
        return path.read_text(encoding="utf-8").splitlines()
    except (UnicodeDecodeError, OSError):
        return None


def main() -> int:
    brand_map = load_map()
    stale = [
        (rule["id"], re.compile(rule["regex"]), rule["reason"])
        for rule in brand_map["stale_company_patterns"]
    ]
    stale_exclude = tuple(brand_map["stale_scan_exclude"])
    live_prefixes = tuple(brand_map["live_surface_paths"])
    allowed = [
        (rule["id"], re.compile(rule["regex"]))
        for rule in brand_map["allowed_mnemix_contexts"]
    ]
    mnemix_token = re.compile(r"mnemix", re.I)

    failures: list[str] = []

    for path in iter_text_files():
        relative = path.relative_to(ROOT).as_posix()
        lines = read_lines(path)
        if lines is None:
            continue

        if not any(relative == e.rstrip("/") or relative.startswith(e) for e in stale_exclude):
            for number, line in enumerate(lines, start=1):
                for rule_id, pattern, reason in stale:
                    if pattern.search(line):
                        failures.append(f"{relative}:{number}: [{rule_id}] {reason} :: {line.strip()!r}")

        if any(relative == p.rstrip("/") or relative.startswith(p) for p in live_prefixes):
            for number, line in enumerate(lines, start=1):
                if not mnemix_token.search(line):
                    continue
                if any(pattern.search(line) for _, pattern in allowed):
                    continue
                failures.append(
                    f"{relative}:{number}: [live-surface-deny] Mnemix mention on a live surface "
                    f"matches no allowed context (Memory Lab / technical identifier) :: {line.strip()!r}"
                )

    for requirement in brand_map["required_public_truth"]:
        target = ROOT / requirement["file"]
        expected = requirement["contains"]
        try:
            content = target.read_text(encoding="utf-8")
        except OSError:
            failures.append(f"{requirement['file']}: unreadable; required public-truth value {expected!r}")
            continue
        if expected not in content:
            failures.append(f"{requirement['file']}: missing required public-truth value {expected!r}")

    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        print(f"\n{len(failures)} brand finding(s). Law: {brand_map['law']}")
        return 1
    print("PASS: Northsun / Mnemix dual-brand law (content/brand/brand-map.json)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
