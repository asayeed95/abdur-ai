#!/usr/bin/env python3
"""rc1_loop.py — L-C1: brain draft -> deterministic gates -> judge -> revise, ≤3 iterations.

Loop contract per CONTENT-OPS-SYSTEM §2.1/§4.2 (RATIFIED 2026-07-22): rubric =
gates.check_draft (hard) + prompts/judge.md scorecard (soft, fresh `claude -p` context —
P-012); pass = gates green AND all judge diagnostics pass AND mean(S)≥4.0 AND min(S)≥3
(arithmetic re-checked HERE, never trusted from the judge's own `pass` field — P-011);
guard = 3 iterations; on trip the item is written status=needs_human with its full
scorecard trail (shown in the batch, releasable only by per-item verbs). The loop never
schedules, never posts, never self-re-arms — it writes one item json and exits.

Usage: rc1_loop.py --project mnemix [--date YYYY-MM-DD] [--no-llm] [--max-iter 3]
`--no-llm`: skip brain+judge (tests / offline) — gate an existing draft passed via --draft-file.
"""
import argparse, json, re, subprocess, sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

DIR = Path(__file__).resolve().parent
CONTENT = (DIR / ".." / "..").resolve()
sys.path.insert(0, str(DIR))
import gates

ET = ZoneInfo("America/New_York")
PROFILE_CANDIDATES = [Path.home() / "Projects" / "content-ops" / "BRAND-VOICE-PROFILE.md",
                      Path.home() / "projects" / "content-ops" / "BRAND-VOICE-PROFILE.md"]
VOICE_LAW = CONTENT / "voice" / "abdur-voice.md"
X_ACCOUNTS = {"mnemix": "18856", "abdur-ai": "20072"}

def sh(cmd, timeout=600):
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)

def llm(prompt):
    r = sh(["claude", "-p", prompt, "--model", "claude-sonnet-5", "--allowedTools", "",
            "--disallowedTools", "Bash,Read,Write,Edit,Glob,Grep,WebFetch,WebSearch,Task,NotebookEdit"])
    return r.stdout or ""

def extract_json(text):
    m = re.search(r"```json\s*(.*?)```", text, re.S)
    blob = m.group(1) if m else text[text.index("{"): text.rindex("}") + 1]
    return json.loads(blob)

def voice_checklist():
    for p in PROFILE_CANDIDATES:
        if p.exists():
            txt = p.read_text()
            m = re.search(r"(## 4 · Judge checklist.*?)(?=\n## \d)", txt, re.S)
            if m:
                return m.group(1), "profile"
    # Fallback keeps the loop alive on a runner without content-ops/ synced (D-3 install note);
    # the judge then grades against the prose law and the scorecard is labeled accordingly.
    return VOICE_LAW.read_text(), "fallback-voice-law"

def seed_text_of(draft):
    src = (draft.get("source") or "").strip()
    if src.startswith("sources/"):
        p = CONTENT / src
        if p.is_file():
            return p.read_text(), None
        return None, f"source record missing: {src}"
    return None, "commit-sha seed — orphan-number lint not applicable (H3 numbers unverified)"

def run_judge(draft, seed_text, checklist, checklist_kind):
    tmpl = (DIR / "prompts" / "judge.md").read_text()
    prompt = (tmpl.replace("{{VOICE_CHECKLIST}}", checklist)
                  .replace("{{SEED}}", seed_text or "(commit-sha seed — no record text)")
                  .replace("{{DRAFT}}", json.dumps(draft, ensure_ascii=False, indent=2)))
    out = llm(prompt)
    try:
        card = extract_json(out)
    except Exception as e:
        return {"error": f"judge output unparseable: {e}", "pass": False}
    card.setdefault("labels", {})["checklist"] = checklist_kind
    # Re-derive the verdict — the judge reports numbers, the loop owns the arithmetic.
    try:
        diags_ok = all(v == "pass" for k, v in card["diagnostics"].items() if k != "notes")
        s = [v for v in (card["scores"].get(k) for k in ("S1", "S2", "S3", "S4", "S5")) if v is not None]
        card["computed_pass"] = bool(diags_ok and s and sum(s) / len(s) >= 4.0 and min(s) >= 3)
    except Exception as e:
        card["computed_pass"] = False
        card["error"] = f"scorecard shape: {e}"
    return card

def revise(draft, failures, defects, seed_text):
    tmpl = (DIR / "prompts" / "revise.md").read_text()
    prompt = (tmpl.replace("{{DRAFT_JSON}}", json.dumps(draft, ensure_ascii=False, indent=2))
                  .replace("{{FAILURES}}", json.dumps(failures + defects, ensure_ascii=False, indent=2))
                  .replace("{{SEED}}", seed_text or "(commit-sha seed — do not add any numbers)"))
    out = llm(prompt)
    return extract_json(out)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--date")
    ap.add_argument("--max-iter", type=int, default=3)
    ap.add_argument("--no-llm", action="store_true")
    ap.add_argument("--draft-file", help="skip brain.sh; gate this draft file (md with json block, or bare json)")
    a = ap.parse_args()
    date_key = a.date or datetime.now(ET).strftime("%Y-%m-%d")
    out_dir = CONTENT / "drafts" / a.project
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{date_key}-{a.project}.json"
    if out_path.exists():
        print(f"already produced today: {out_path} — idempotent no-op")
        return 0

    if a.draft_file:
        draft = extract_json(Path(a.draft_file).read_text())
    else:
        tmp = DIR / ".out"; tmp.mkdir(exist_ok=True)
        raw = tmp / f"{a.project}-{date_key}.md"
        r = sh(["bash", str(DIR / "brain.sh"), a.project, "--emit-only", str(raw)], timeout=900)
        if r.returncode not in (0, 3) or not raw.exists():
            print(f"brain.sh failed rc={r.returncode}: {r.stdout[-400:]}{r.stderr[-400:]}")
            return 1
        draft = extract_json(raw.read_text())

    seed_text, seed_note = seed_text_of(draft)
    checklist, checklist_kind = (None, None) if a.no_llm else voice_checklist()
    trail = []
    status = "needs_human"
    for i in range(1, a.max_iter + 1):
        rep = gates.check_draft(draft, seed_text=seed_text, ledger_dir=CONTENT / "ledger",
                                content_dir=CONTENT, kind="social")
        card = {"skipped": True} if a.no_llm else run_judge(draft, seed_text, checklist, checklist_kind)
        judge_ok = True if a.no_llm else card.get("computed_pass", False)
        trail.append({"iteration": i, "gates": rep, "judge": card})
        if rep["pass"] and judge_ok:
            status = "pending"
            break
        if i < a.max_iter:
            if a.no_llm:
                break                      # tests: no reviser available — first verdict stands
            defects = card.get("defects", []) if isinstance(card, dict) else []
            try:
                draft = revise(draft, rep["failures"], defects, seed_text)
                draft.setdefault("project", a.project)
            except Exception as e:
                trail.append({"iteration": i, "revise_error": str(e)})
                break

    item = {"item_id": f"{a.project}-x", "project": a.project, "platform": "twitter",
            "account_id": X_ACCOUNTS.get(a.project, ""), "status": status, "draft": draft,
            "seed_note": seed_note, "iterations": len(trail), "trail": trail,
            "date_key": date_key}
    out_path.write_text(json.dumps(item, indent=2, ensure_ascii=False))
    print(f"{a.project}: {status} after {len(trail)} iteration(s) -> {out_path}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
