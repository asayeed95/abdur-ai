#!/usr/bin/env python3
"""batch_assemble.py — R-C2 front half: build today's batch manifest + send the ONE morning
message (Slack = reply channel, Telegram = outbound mirror). CONTENT-OPS-SYSTEM §4.3 (RATIFIED).

Reads the item jsons rc1_loop.py wrote, carries re-offers from yesterday's manifest
(≤2 re-offers, then wrong-timing — D-5), applies the D-8 FLOOR-ONLY ruling (1 original/
day/account; one LinkedIn item max, Mnemix first), assigns the ratified slots
(09:07 / 09:37 / 10:07 ET as UTC instants — G-01 DST-safe), and refuses to run beside a
foreign-host manifest for the same date (G-15). Sending nothing silently is forbidden:
zero items still sends "no batch today: <reason>".

Usage: batch_assemble.py [--date YYYY-MM-DD] [--no-send]   (DRY_RUN=1 implies --no-send)
"""
import argparse, json, os, socket, sys, urllib.request
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

DIR = Path(__file__).resolve().parent
CONTENT = (DIR / ".." / "..").resolve()
sys.path.insert(0, str(DIR))
import batchlib

ET = ZoneInfo("America/New_York")
CHANNEL = "C0BAMF2P4L8"
HOST = socket.gethostname()
PROJECTS = ("mnemix", "abdur-ai")                       # daily floor accounts, in release order
SLOTS = {"mnemix-x": (9, 7), "abdur-ai-x": (9, 37), "li": (10, 7)}   # D-5-ratified defaults
LI_ACCOUNT = "21401"
HANDLES = {"18856": "@mnemix_official", "20072": "@abdur_sayeed", "21401": "LinkedIn Abdur"}

def http(url, data, headers):
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode() or "{}")

def jsonl_append(path, obj):
    with open(path, "a") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")

def s_mean(item):
    for step in reversed(item.get("trail", [])):
        card = step.get("judge") or {}
        if isinstance(card.get("mean_S"), (int, float)):
            return card["mean_S"]
    return None

def last_defects(item):
    for step in reversed(item.get("trail", [])):
        card = step.get("judge") or {}
        gate_f = [f["detail"] for f in (step.get("gates") or {}).get("failures", [])]
        if gate_f or card.get("defects"):
            return (gate_f + (card.get("defects") or []))[:3]
    return []

def build_items(date_key):
    items, notes = [], []
    li_taken = False
    yesterday = (datetime.strptime(date_key, "%Y-%m-%d") - timedelta(days=1)).strftime("%Y-%m-%d")
    prev = batchlib.load_manifest(CONTENT / "drafts", yesterday) or {"items": []}
    for it in prev.get("items", []):
        if it.get("status") == "expired":
            offers = it.get("offer_count", 1)
            if offers + 1 >= batchlib.MAX_OFFERS + 1:
                notes.append(f"{it['item_id']}: expired after {offers} offers → wrong-timing (ledger)")
                jsonl_append(CONTENT / "ledger" / "rejected.jsonl",
                             {"id": f"batch-{yesterday}-{it['item_id']}", "ts": batchlib.utc_iso(datetime.now(ZoneInfo('UTC'))),
                              "state": "rejected", "reason": "wrong-timing"})
                continue
            it = dict(it, status="pending" if it["status"] != "needs_human" else it["status"],
                      offer_count=offers + 1)
            notes.append(f"re-offering {it['item_id']} (offer {it['offer_count']}/{batchlib.MAX_OFFERS})")
            items.append(it)
    for project in PROJECTS:
        p = CONTENT / "drafts" / project / f"{date_key}-{project}.json"
        if not p.exists():
            notes.append(f"{project}: no item produced today")
            continue
        item = json.loads(p.read_text())
        hh, mm = SLOTS[f"{project}-x"]
        item["fire_at"] = batchlib.slot_fire(datetime.now(ET).date(), hh, mm)
        item.setdefault("offer_count", 1)
        items.append(item)
        li_text = (item.get("draft") or {}).get("linkedin_text")
        if li_text and not li_taken:                     # FLOOR-ONLY: one LinkedIn/day (D-8/D-5)
            hh, mm = SLOTS["li"]
            items.append({"item_id": f"{project}-li", "project": project, "platform": "linkedin",
                          "account_id": LI_ACCOUNT, "status": item["status"],
                          "fire_at": batchlib.slot_fire(datetime.now(ET).date(), hh, mm),
                          "draft": item["draft"], "offer_count": 1})
            li_taken = True
        elif li_text:
            notes.append(f"{project}: linkedin variant held (floor-only, one LinkedIn/day)")
    return items, notes

def message_of(manifest, notes):
    lines = [f"CONTENT BATCH {manifest['date_key']} — "
             f"{sum(1 for i in manifest['items'] if i['status'] == 'pending')} releasable item(s)",
             "(batch verbs: yes | yes but <edits> | no | skip <ids> · "
             "per-item verbs: release <id> | edit <id>: <text> | drop <id>)", ""]
    for n, it in enumerate(manifest["items"], 1):
        if it["status"] not in ("pending", "needs_human"):
            continue
        d = it.get("draft") or {}
        body = "\n".join(d.get("x_thread") or ([d.get("x_text")] if d.get("x_text") else [])) \
            if it["platform"] == "twitter" else (d.get("linkedin_text") or "")
        et_t = batchlib.parse_utc(it["fire_at"]).astimezone(ET).strftime("%H:%M")
        s = s_mean(it)
        tag = "" if it["status"] == "pending" else "  ⟵ NEEDS-HUMAN (per-item verbs only)"
        offer = "" if it.get("offer_count", 1) == 1 else f" · re-offer {it['offer_count']}/{batchlib.MAX_OFFERS}"
        lines.append(f"[{n}] {HANDLES.get(str(it['account_id']), it['account_id'])} {et_t} ET "
                     f"— {it['item_id']} — seed: {d.get('source', '?')}{offer}{tag}")
        lines.append(body)
        lines.append(f"    gates {'✅' if it['status'] == 'pending' else '❌ ' + '; '.join(last_defects(it))}"
                     + (f" · S {s:.1f}" if s is not None else "") + "\n")
    if notes:
        lines.append("notes: " + " · ".join(notes))
    lines.append("Reply IN-CHANNEL (not thread). Slack is the only reply channel until AGE-148 "
                 "activates; Telegram mirrors. Silence = hold. TTL 22:00 ET.")
    return "\n".join(lines)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date"); ap.add_argument("--no-send", action="store_true")
    a = ap.parse_args()
    no_send = a.no_send or os.environ.get("DRY_RUN") == "1"
    date_key = a.date or datetime.now(ET).strftime("%Y-%m-%d")
    drafts = CONTENT / "drafts"

    existing = batchlib.load_manifest(drafts, date_key)
    if existing:
        if existing.get("host") != HOST:                 # G-15: two runners, one date — hard stop
            print(f"CONFLICT: manifest for {date_key} was produced by {existing.get('host')!r}, "
                  f"this is {HOST!r} — refusing. One runner owns the date.")
            return 2
        print(f"batch {date_key} already assembled on this host — idempotent no-op")
        return 0

    items, notes = build_items(date_key)
    manifest = {"date_key": date_key, "host": HOST, "created_ts": batchlib.utc_iso(datetime.now(ZoneInfo("UTC"))),
                "sent_ts": None, "items": items, "processed_ts": []}
    text = message_of(manifest, notes) if items else \
        f"CONTENT BATCH {date_key} — no batch today: " + ("; ".join(notes) or "no items produced")

    if no_send:
        print(text)
        print("[no-send] manifest written, message not posted")
    else:
        slack = os.environ["SLACK_TOKEN"]
        d = http("https://slack.com/api/chat.postMessage", {"channel": CHANNEL, "text": text},
                 {"Authorization": f"Bearer {slack}", "Content-Type": "application/json"})
        if not d.get("ok"):
            print(f"slack post failed: {d}"); return 1
        manifest["sent_ts"] = d.get("ts")
        try:
            http(f"https://api.telegram.org/bot{os.environ['TG_TOKEN']}/sendMessage",
                 {"chat_id": os.environ["TG_CHAT"], "text": "(mirror — reply in Slack)\n" + text[:3800]},
                 {"Content-Type": "application/json"})
        except Exception as e:
            print(f"telegram mirror failed (non-fatal): {e}")
    batchlib.save_manifest(drafts, manifest)
    jsonl_append(CONTENT / "ledger" / "runs.jsonl",
                 {"date_key": date_key, "routine": "batch-assemble", "host": HOST,
                  "outcome": "sent" if not no_send and items else ("no-send" if no_send else "empty"),
                  "items": len(items), "ts": batchlib.utc_iso(datetime.now(ZoneInfo("UTC")))})
    print(f"batch {date_key}: {len(items)} item(s), sent={not no_send}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
