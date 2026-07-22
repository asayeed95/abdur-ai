#!/usr/bin/env python3
"""The interim hands: Slack APPROVED: -> Blotato schedule (veto window) -> Telegram -> ledger.

Safety properties:
- Publishes ONLY drafts a human explicitly approved with an "APPROVED:" message in Slack.
- Always schedules with a FUTURE fire time (next morning) so the founder can still veto by
  deleting the schedule in Blotato (DELETE /v2/schedules/{id}).
- Idempotent: the Slack ts of the APPROVED message is the ledger id; already-processed ids are skipped.
- Re-lints tweets (weighted <=280) and banned phrases before anything is scheduled (defense in depth).
- Any failure -> Telegram alert; nothing half-recorded.
"""
import hashlib, json, os, re, sys, urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

CHANNEL = "C0BAMF2P4L8"
ET = ZoneInfo("America/New_York")
DRY_RUN = os.environ.get("DRY_RUN") == "1"   # parse + gate only; no Blotato, no ledger, no Telegram
SLACK = os.environ["SLACK_TOKEN"]; BLOTATO = os.environ["BLOTATO_KEY"]
TG_TOKEN = os.environ["TG_TOKEN"]; TG_CHAT = os.environ["TG_CHAT"]
LEDGER_DIR = Path(os.environ["LEDGER_DIR"]).resolve()
BANNED_FILE = Path(os.environ.get("BANNED_FILE", ""))
CONTENT_DIR = LEDGER_DIR.parent  # .../content/ledger -> .../content
SOURCES_ROOT = (CONTENT_DIR / "sources").resolve()
USED_PLACEHOLDER = "**Used by:** _(none yet — pending draft)_"

# project -> (X blotato accountId, X fire hour ET, linkedin accountId or None, linkedin fire hour ET)
ROUTES = {
    "mnemix":   {"x_account": "18856", "x_hour": 9,  "li_account": "21401", "li_hour": 10},
    "abdur-ai": {"x_account": "20072", "x_hour": 10, "li_account": "21401", "li_hour": 11},
    "dockerfile-ai": {"x_account": "20072", "x_hour": 11, "li_account": None, "li_hour": None},
    "heycli":        {"x_account": "20072", "x_hour": 11, "li_account": None, "li_hour": None},
    "mnemix-learning": {"x_account": "20072", "x_hour": 11, "li_account": None, "li_hour": None},
}

def http(url, data=None, headers=None, method=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode() if data is not None else None,
                                 headers=headers or {}, method=method)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode() or "{}")

def slack_history(limit=50):
    d = http(f"https://slack.com/api/conversations.history?channel={CHANNEL}&limit={limit}",
             headers={"Authorization": f"Bearer {SLACK}"})
    if not d.get("ok"):
        raise RuntimeError(f"slack history: {d.get('error')}")
    return d.get("messages", [])

def telegram(text):
    if DRY_RUN:
        print(f"[dry-run] telegram: {text}"); return
    try:
        http(f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage",
             data={"chat_id": TG_CHAT, "text": text},
             headers={"Content-Type": "application/json"})
    except Exception as e:
        print(f"telegram failed: {e}")

def weighted(s):
    t = 0
    for ch in s:
        c = ord(ch)
        t += 1 if (0 <= c <= 4351 or 8192 <= c <= 8205 or 8208 <= c <= 8223 or 8242 <= c <= 8247) else 2
    return t

def banned_phrases():
    if not BANNED_FILE.exists(): return []
    txt = BANNED_FILE.read_text()
    m = re.search(r"## MACHINE-CHECK BLOCK.*?```\n(.*?)```", txt, re.S)
    return [l.strip() for l in (m.group(1).splitlines() if m else []) if l.strip()]

def ledger_ids():
    ids = set()
    for name in ("scheduled.jsonl", "posted.jsonl", "rejected.jsonl"):
        p = LEDGER_DIR / name
        if p.exists():
            for line in p.read_text().splitlines():
                try: ids.add(json.loads(line).get("id"))
                except Exception: pass
    return ids

def mark_source_used(source_rel, note):
    """Close the capture->draft loop: flip a sources/repo-events/*.md record's placeholder
    'Used by' line once it's actually SCHEDULED, so tomorrow's brain run (which only offers
    UNUSED records — see brain.sh) can't draft the same material twice. Best-effort and
    NEVER fatal: the real side effect (the Blotato schedule) already succeeded by the time
    this runs, so a bug here must not surface as a scheduling failure or block the Telegram
    confirmation. Path-traversal guarded: only ever writes under content/sources/."""
    if not source_rel or not source_rel.startswith("sources/"):
        return  # not a capture-repo-events.sh record (e.g. a bare commit sha) — nothing to mark
    try:
        p = (CONTENT_DIR / source_rel).resolve()
        if os.path.commonpath([str(p), str(SOURCES_ROOT)]) != str(SOURCES_ROOT):
            print(f"mark_source_used: refused out-of-tree path {source_rel!r}"); return
        if not p.is_file():
            print(f"mark_source_used: no such file {source_rel!r} — leaving unmarked"); return
        txt = p.read_text()
        if USED_PLACEHOLDER not in txt:
            return  # already marked (or hand-authored, non-placeholder format) — leave it alone
        if DRY_RUN:
            print(f"[dry-run] would mark source used: {source_rel}"); return
        p.write_text(txt.replace(USED_PLACEHOLDER, f"**Used by:** {note}"))
        print(f"marked source used: {source_rel}")
    except Exception as e:
        print(f"mark_source_used failed (non-fatal) for {source_rel!r}: {e}")

def ledger_append(obj):
    if DRY_RUN:
        print(f"[dry-run] ledger: {json.dumps(obj)[:120]}…"); return
    with open(LEDGER_DIR / "scheduled.jsonl", "a") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")

def next_morning(hour_et):
    now = datetime.now(ET)
    t = (now + timedelta(days=1)).replace(hour=hour_et, minute=7, second=0, microsecond=0)
    return t.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def blotato_schedule(account_id, platform, text, thread, when_utc):
    if DRY_RUN:
        print(f"[dry-run] would schedule {platform} acct={account_id} at {when_utc}: {text[:60]}…")
        return "dry-run-id"
    content = {"text": text, "platform": platform, "mediaUrls": []}
    if platform == "twitter" and thread and len(thread) > 1:
        content["additionalPosts"] = [{"text": t, "mediaUrls": []} for t in thread[1:]]
    d = http("https://backend.blotato.com/v2/posts",
             data={"post": {"accountId": account_id, "target": {"targetType": platform}, "content": content},
                   "scheduledTime": when_utc},
             headers={"blotato-api-key": BLOTATO, "Content-Type": "application/json"})
    sid = d.get("postSubmissionId") or d.get("id")
    if not sid:
        raise RuntimeError(f"blotato schedule failed: {d}")
    return sid

def main():
    seen = ledger_ids()
    banned = banned_phrases()
    processed = 0
    for msg in slack_history():
        text = (msg.get("text") or "").strip()
        if not text.upper().startswith("APPROVED:"):
            continue
        mid = f"slack-{msg['ts']}"
        if mid in seen:
            continue
        try:
            raw = text[text.index("{"): text.rindex("}") + 1]
            d = json.loads(raw)
        except Exception as e:
            telegram(f"⚠️ hands: APPROVED message {msg['ts']} has unparseable json ({e}). Fix and repost APPROVED: + json.")
            ledger_append({"id": mid, "ts": datetime.now(timezone.utc).isoformat(), "state": "rejected",
                           "reason": f"unparseable-json: {e}"})
            continue

        project = d.get("project", "mnemix")
        route = ROUTES.get(project)
        if not route:
            telegram(f"⚠️ hands: unknown project '{project}' in APPROVED {msg['ts']} — skipped.")
            continue
        thread = d.get("x_thread") or ([d["x_text"]] if d.get("x_text") else [])
        if not thread:
            telegram(f"⚠️ hands: APPROVED {msg['ts']} has no x_text/x_thread — skipped.")
            continue

        over = [i + 1 for i, t in enumerate(thread) if weighted(t) > 280]
        if over:
            telegram(f"⚠️ hands: APPROVED {msg['ts']} tweets over 280 (tweet {over}) — NOT scheduled. Edit and re-approve.")
            continue
        corpus = " ".join(thread) + " " + (d.get("linkedin_text") or "")
        viol = [p for p in banned if p.lower() in corpus.lower()]
        if viol:
            telegram(f"⚠️ hands: APPROVED {msg['ts']} contains banned phrases {viol} — NOT scheduled. Edit and re-approve.")
            continue

        body_hash = hashlib.sha1(re.sub(r"\W+", "", corpus.lower()).encode()).hexdigest()
        notes = []
        try:
            when_x = next_morning(route["x_hour"])
            x_id = blotato_schedule(route["x_account"], "twitter", thread[0], thread, when_x)
            notes.append(f"X {when_x} id={x_id}")
            ledger_append({"id": mid, "ts": datetime.now(timezone.utc).isoformat(), "project": project,
                           "channel": "x", "account": route["x_account"], "source": d.get("source", ""),
                           "state": "scheduled", "blotato_id": x_id, "hash": body_hash,
                           "keywords": sorted(set(re.findall(r"[a-z]{5,}", corpus.lower())))[:12]})
            mark_source_used(d.get("source", ""),
                              f"{project} draft scheduled for {when_x} (X), ledger id `{mid}`.")
            if d.get("linkedin_text") and route["li_account"]:
                when_li = next_morning(route["li_hour"])
                li_id = blotato_schedule(route["li_account"], "linkedin", d["linkedin_text"], None, when_li)
                notes.append(f"LinkedIn {when_li} id={li_id}")
                ledger_append({"id": mid + "-li", "ts": datetime.now(timezone.utc).isoformat(), "project": project,
                               "channel": "linkedin", "account": route["li_account"], "source": d.get("source", ""),
                               "state": "scheduled", "blotato_id": li_id, "hash": body_hash, "keywords": []})
        except Exception as e:
            telegram(f"🔴 hands: Blotato scheduling FAILED for {project} ({msg['ts']}): {e}. Nothing (further) queued.")
            print(f"FAIL {mid}: {e}")
            continue

        processed += 1
        telegram("🕘 Queued (veto window open) — " + f"{project}: " + " · ".join(notes) +
                 "\nDelete in Blotato before fire time to veto.")
        print(f"scheduled {mid}: {notes}")
    print(f"hands run complete, {processed} approval(s) processed")

if __name__ == "__main__":
    main()
