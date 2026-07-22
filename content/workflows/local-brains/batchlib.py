#!/usr/bin/env python3
"""batchlib.py — pure logic for the R-C2 morning batch (CONTENT-OPS-SYSTEM §4.3/§4.4, RATIFIED 2026-07-22).

Everything here is deterministic and testable without network or env: reply-grammar parsing
(with the G-23 precedence rule), fire-time resolution (manifest slot honored, late-approval
recompute, quiet hours, DST-safe via ZoneInfo), live-queue spacing (G-02: ≥15 min against
EVERY queued fire on the account, any lane), manifest I/O, and the pause/risk state files.
hands_scheduler.py owns all side effects (Slack/Telegram/Blotato/ledger) and calls into this.
"""
import json, os, re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")
QUIET_START, QUIET_END = 23, 7          # no fire scheduled outside 07:00–23:00 ET (x-spec rule 4)
SPACING_MIN = 15                        # min gap per account vs the LIVE queue (grill G-02)
LATE_RECOMPUTE_MIN = 30                 # late approval → earliest slot ≥30 min out (D-5)
MERGE_CONFIRM_TIMEOUT_H = 2             # unconfirmed yes-but → split-release after 2h (D-5)
TTL_HOUR_ET = 22                        # batch replies accepted until 22:00 ET (D-5)
MAX_OFFERS = 3                          # first offer + 2 re-offers, then wrong-timing (spec §4.3)

# ---------- time ----------

def utc_iso(dt):
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def parse_utc(iso):
    return datetime.strptime(iso, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)

def slot_fire(date_et, hour, minute):
    """A same-day ET slot as a UTC iso instant — DST-safe because ZoneInfo does the math."""
    return utc_iso(datetime(date_et.year, date_et.month, date_et.day, hour, minute, tzinfo=ET))

def in_quiet_hours(dt_utc):
    h = dt_utc.astimezone(ET).hour
    return h >= QUIET_START or h < QUIET_END

def resolve_fire_time(fire_at, route_hour, now=None):
    """Manifest slot honored when still comfortably in the future; a late approval gets the
    earliest same-day time ≥LATE_RECOMPUTE_MIN out; anything landing in quiet hours rolls to
    the next morning's route default (HH:07 ET). Returns (iso_utc, reason)."""
    now = now or datetime.now(timezone.utc)
    if fire_at:
        t = parse_utc(fire_at)
        if t >= now + timedelta(minutes=5) and not in_quiet_hours(t):
            return fire_at, "manifest-slot"
    cand = now + timedelta(minutes=LATE_RECOMPUTE_MIN)
    if not in_quiet_hours(cand) and cand.astimezone(ET).hour >= QUIET_END:
        return utc_iso(cand), "late-recompute"
    nm = (now.astimezone(ET) + timedelta(days=1)).replace(hour=route_hour, minute=7, second=0, microsecond=0)
    return utc_iso(nm), "next-morning"

def next_free_slot(candidate_iso, account_id, live_fires, max_shifts=8):
    """Shift by SPACING_MIN until ≥SPACING_MIN from every queued fire on this account —
    the live Blotato queue, any lane, plus in-run placements (G-02: the W28 collision was
    cross-lane; batch-internal spacing alone would not have prevented it). None = no slot."""
    t = parse_utc(candidate_iso)
    fires = [parse_utc(f) for a, f in live_fires if str(a) == str(account_id)]
    for _ in range(max_shifts + 1):
        if in_quiet_hours(t):
            return None
        if all(abs((t - f).total_seconds()) >= SPACING_MIN * 60 for f in fires):
            return utc_iso(t)
        t += timedelta(minutes=SPACING_MIN)
    return None

# ---------- reply grammar (G-23 precedence: `skip` anywhere in a yes-reply = skip semantics) ----------

_IDS = r"([\w,\s#-]+?)"

def parse_reply(text):
    t = re.sub(r"[.!\s]+$", "", (text or "").strip()).strip()
    low = t.lower()
    if low in ("stop content",):    return {"cmd": "pause"}
    if low in ("resume content",):  return {"cmd": "resume"}
    if low == "yes":                return {"cmd": "yes"}
    if low == "no":                 return {"cmd": "no"}
    if low == "confirm":            return {"cmd": "confirm"}
    m = re.fullmatch(r"(?:yes\b[,\s]*)?(?:but\s+)?skip[:\s]+" + _IDS, low)
    if m:                           return {"cmd": "skip", "refs": _refs(m.group(1))}
    if low.startswith("yes") and re.search(r"\bskip\b", low):
        m = re.search(r"\bskip\b[:\s]*" + _IDS + r"$", low)
        return {"cmd": "skip", "refs": _refs(m.group(1))} if m else {"cmd": "unparseable", "raw": t}
    m = re.fullmatch(r"yes\s+but\s+(.+)", t, re.I | re.S)
    if m:                           return {"cmd": "yes_but", "edit": m.group(1).strip()}
    m = re.fullmatch(r"release\s+(\S+)", low)
    if m:                           return {"cmd": "release", "ref": m.group(1)}
    m = re.fullmatch(r"edit\s+(\S+?)\s*:\s*(.+)", t, re.I | re.S)
    if m:                           return {"cmd": "edit", "ref": m.group(1).lower(), "edit": m.group(2).strip()}
    m = re.fullmatch(r"drop\s+(\S+)", low)
    if m:                           return {"cmd": "drop", "ref": m.group(1)}
    return None                      # not batch grammar (APPROVED:/SKIP:/chatter handled elsewhere)

def _refs(blob):
    return [r for r in re.split(r"[,\s]+", blob.strip()) if r]

def resolve_ref(ref, manifest):
    """'2' (1-based list position) or an item_id substring → item_id, else None."""
    items = manifest.get("items", [])
    ref = str(ref).lstrip("#")
    if ref.isdigit():
        i = int(ref) - 1
        return items[i]["item_id"] if 0 <= i < len(items) else None
    hits = [it["item_id"] for it in items if ref in it["item_id"]]
    return hits[0] if len(hits) == 1 else None

# ---------- manifest ----------

def manifest_path(drafts_dir, date_key):
    return Path(drafts_dir) / f"BATCH-{date_key}.json"

def load_manifest(drafts_dir, date_key):
    p = manifest_path(drafts_dir, date_key)
    if not p.exists(): return None
    return json.loads(p.read_text())

def save_manifest(drafts_dir, manifest):
    p = manifest_path(drafts_dir, manifest["date_key"])
    tmp = p.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    os.replace(tmp, p)

def pending_items(manifest):
    return [it for it in manifest.get("items", []) if it.get("status") == "pending"]

def needs_human_ids(manifest):
    return {it["item_id"] for it in manifest.get("items", []) if it.get("status") == "needs_human"}

# ---------- pause + risk state ----------

def is_paused(flag_path):
    return Path(flag_path).exists()

def set_paused(flag_path, on, why=""):
    p = Path(flag_path)
    if on:
        p.write_text(json.dumps({"ts": utc_iso(datetime.now(timezone.utc)), "why": why}))
    elif p.exists():
        p.unlink()

def risk_bump(state_path, account_id, ok):
    """Track consecutive rail failures per account; returns the new count (0 on success)."""
    p = Path(state_path)
    state = {}
    if p.exists():
        try: state = json.loads(p.read_text())
        except Exception: state = {}
    state[str(account_id)] = 0 if ok else state.get(str(account_id), 0) + 1
    p.write_text(json.dumps(state))
    return state[str(account_id)]
