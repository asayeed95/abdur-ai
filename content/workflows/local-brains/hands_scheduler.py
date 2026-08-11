#!/usr/bin/env python3
"""The interim hands: Slack approvals -> Blotato schedule (veto window) -> Telegram -> ledger.

Two approval surfaces, one authority chain (CONTENT-OPS-SYSTEM.md §2.3/§4.3, RATIFIED 2026-07-22):
- LEGACY per-draft:  "APPROVED:" + json  (unchanged contract, now honors an optional
  "fire_at" from a batch manifest instead of always next-morning — grill G-01).
- BATCH (R-C2):      one morning batch manifest (content/drafts/BATCH-<date>.json) + the
  ratified reply grammar: yes · yes but <edits> (LLM merge -> repost -> confirm) · no ·
  skip <ids> · release <id> · edit <id>: <text> · drop <id>. `skip` anywhere in a
  yes-reply parses as skip semantics and the bot echoes its parse before acting (G-23).
  NEEDS-HUMAN items are released ONLY by per-item verbs; a yes-but merge may never pull
  one back in (G-03).

Safety properties (all preserved):
- Publishes ONLY on an explicit founder reply. Silence = hold (never auto-publish).
- Fire times are always in the future (veto window: DELETE /v2/schedules/{id} in Blotato).
- Spacing is enforced against the LIVE Blotato queue per account id, any lane (G-02/G-12).
- Idempotent: ledger ids — legacy slack-<ts>, batch batch-<date>-<item> — are (batch-id,
  item-id) keys; duplicate/conflicting replies no-op or alert, never double-schedule (G-04).
- Kill switch: "stop content" pauses scheduling (persisted flag); "resume content" clears.
  3 consecutive Blotato failures on one account auto-pause the same flag (§9, G-10).
- Re-lints (weighted <=280 + banned phrases) before anything is scheduled.
- DRY_RUN=1: parse + gates run for real; every side effect prints instead.
"""
import hashlib, json, os, re, socket, subprocess, sys, urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent))
import batchlib

CHANNEL = "C0BAMF2P4L8"
ET = ZoneInfo("America/New_York")
DRY_RUN = os.environ.get("DRY_RUN") == "1"   # parse + gate only; no Blotato, no ledger, no Telegram
SLACK = os.environ["SLACK_TOKEN"]; BLOTATO = os.environ["BLOTATO_KEY"]
TG_TOKEN = os.environ["TG_TOKEN"]; TG_CHAT = os.environ["TG_CHAT"]
LEDGER_DIR = Path(os.environ["LEDGER_DIR"]).resolve()
BANNED_FILE = Path(os.environ.get("BANNED_FILE", ""))
CONTENT_DIR = LEDGER_DIR.parent  # .../content/ledger -> .../content
SOURCES_ROOT = (CONTENT_DIR / "sources").resolve()
DRAFTS_DIR = CONTENT_DIR / "drafts"
BRAIN_DIR = Path(__file__).resolve().parent
PAUSE_FLAG = BRAIN_DIR / ".paused"
RISK_STATE = BRAIN_DIR / ".risk-state.json"
HOSTNAME = socket.gethostname()
USED_PLACEHOLDER = "**Used by:** _(none yet — pending draft)_"
RISK_PAUSE_THRESHOLD = 3                 # D-5-ratified 2026-07-22

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

def slack_post(text):
    if DRY_RUN:
        print(f"[dry-run] slack: {text[:160]}…"); return
    try:
        http("https://slack.com/api/chat.postMessage",
             data={"channel": CHANNEL, "text": text},
             headers={"Authorization": f"Bearer {SLACK}", "Content-Type": "application/json"})
    except Exception as e:
        print(f"slack post failed: {e}")

def telegram(text):
    if DRY_RUN:
        print(f"[dry-run] telegram: {text}"); return
    try:
        http(f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage",
             data={"chat_id": TG_CHAT, "text": text},
             headers={"Content-Type": "application/json"})
    except Exception as e:
        print(f"telegram failed: {e}")

def llm(prompt):
    """Locked-down local model call for the yes-but merge — same posture as brain.sh:
    no tools, no secrets in the prompt. DRY_RUN returns '' (merge is skipped, noted)."""
    if DRY_RUN:
        print("[dry-run] llm merge skipped"); return ""
    r = subprocess.run(["claude", "-p", prompt, "--model", "claude-sonnet-5", "--allowedTools", "",
                        "--disallowedTools", "Bash,Read,Write,Edit,Glob,Grep,WebFetch,WebSearch,Task,NotebookEdit"],
                       capture_output=True, text=True, timeout=300)
    return r.stdout or ""

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
    """Close the capture->draft loop (see brain.sh). Best-effort, never fatal, path-guarded."""
    if not source_rel or not source_rel.startswith("sources/"):
        return
    try:
        p = (CONTENT_DIR / source_rel).resolve()
        if os.path.commonpath([str(p), str(SOURCES_ROOT)]) != str(SOURCES_ROOT):
            print(f"mark_source_used: refused out-of-tree path {source_rel!r}"); return
        if not p.is_file():
            print(f"mark_source_used: no such file {source_rel!r} — leaving unmarked"); return
        txt = p.read_text()
        if USED_PLACEHOLDER not in txt:
            return
        if DRY_RUN:
            print(f"[dry-run] would mark source used: {source_rel}"); return
        p.write_text(txt.replace(USED_PLACEHOLDER, f"**Used by:** {note}"))
        print(f"marked source used: {source_rel}")
    except Exception as e:
        print(f"mark_source_used failed (non-fatal) for {source_rel!r}: {e}")

def jsonl_append(name, obj):
    """Append one row to a ledger stream (runs.jsonl / risk.jsonl / scheduled.jsonl / rejected.jsonl)."""
    if DRY_RUN:
        print(f"[dry-run] {name}: {json.dumps(obj, ensure_ascii=False)[:120]}…"); return
    with open(LEDGER_DIR / name, "a") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")

def ledger_append(obj):
    jsonl_append("scheduled.jsonl", obj)

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

# ---------- live-queue spacing + risk-wrapped scheduling ----------

_live_fires = None          # [(account_id, iso_utc)] — live Blotato queue + this run's placements

def live_fires():
    global _live_fires
    if _live_fires is None:
        fires = []
        try:
            d = http("https://backend.blotato.com/v2/schedules?limit=50",
                     headers={"blotato-api-key": BLOTATO})
            for it in d.get("items", []):
                acct = (it.get("draft") or {}).get("accountId") or (it.get("account") or {}).get("id")
                when = it.get("scheduledAt") or it.get("scheduledTime")
                if acct and when:
                    fires.append((str(acct), when.replace(".000Z", "Z")))
        except Exception as e:
            # Fail CLOSED on visibility loss: without the live queue we cannot prove spacing,
            # so the caller treats this run as unschedulable rather than risking a collision.
            raise RuntimeError(f"live queue unreadable ({e}) — refusing to schedule blind (G-02)")
        _live_fires = fires
    return _live_fires

def resolve_and_space(fire_at, route_hour, account_id):
    when, reason = batchlib.resolve_fire_time(fire_at, route_hour)
    spaced = batchlib.next_free_slot(when, account_id, live_fires())
    if spaced is None:
        nm, _ = batchlib.resolve_fire_time(None, route_hour,
                                           now=datetime.now(timezone.utc) + timedelta(hours=20))
        spaced = batchlib.next_free_slot(nm, account_id, live_fires())
        if spaced is None:
            raise RuntimeError(f"no spacing-compliant slot for account {account_id}")
        reason = "next-morning-spaced"
    return spaced, reason

def risky_schedule(account_id, platform, text, thread, when_utc):
    try:
        sid = blotato_schedule(account_id, platform, text, thread, when_utc)
        batchlib.risk_bump(RISK_STATE, account_id, ok=True)
        live_fires().append((str(account_id), when_utc))
        return sid
    except Exception as e:
        jsonl_append("risk.jsonl", {"ts": datetime.now(timezone.utc).isoformat(),
                                    "account_id": str(account_id), "error": str(e)[:300]})
        n = batchlib.risk_bump(RISK_STATE, account_id, ok=False)
        if n >= RISK_PAUSE_THRESHOLD and not DRY_RUN:
            batchlib.set_paused(PAUSE_FLAG, True, why=f"{n} consecutive rail failures on {account_id}")
            telegram(f"⛔️ content-ops AUTO-PAUSED: {n} consecutive Blotato failures on account "
                     f"{account_id}. Fix the rail, then reply 'resume content'.")
        raise

# ---------- re-lint (defense in depth; the loop's gates.py already ran at draft time) ----------

def relint(thread, linkedin_text, banned):
    over = [i + 1 for i, t in enumerate(thread) if weighted(t) > 280]
    if over:
        return f"tweets over 280 (tweet {over})"
    corpus = " ".join(thread) + " " + (linkedin_text or "")
    viol = [p for p in banned if p.lower() in corpus.lower()]
    if viol:
        return f"banned phrases {viol}"
    return None

# ---------- batch (R-C2) reply processing ----------

def _draft_of(item):
    return item.get("draft") or {}

def _thread_of(draft):
    return draft.get("x_thread") or ([draft["x_text"]] if draft.get("x_text") else [])

def release_item(manifest, item, mode, seen, banned):
    """Schedule one manifest item. Returns a short status string for the founder ack."""
    item_id = item["item_id"]
    lid = f"batch-{manifest['date_key']}-{item_id}"
    if lid in seen:
        return f"{item_id}: already scheduled (idempotent no-op)"
    draft = _draft_of(item)
    project = draft.get("project", item.get("project", "mnemix"))
    route = ROUTES.get(project)
    if not route:
        return f"{item_id}: unknown project {project!r} — held"
    thread = _thread_of(draft)
    platform = item.get("platform", "twitter")
    problem = relint(thread if platform == "twitter" else [], draft.get("linkedin_text"), banned)
    if problem:
        item["status"] = "held"
        return f"{item_id}: re-lint failed ({problem}) — held"
    corpus = " ".join(thread) + " " + (draft.get("linkedin_text") or "")
    body_hash = hashlib.sha1(re.sub(r"\W+", "", corpus.lower()).encode()).hexdigest()
    try:
        if platform == "twitter":
            account = item.get("account_id") or route["x_account"]
            when, reason = resolve_and_space(item.get("fire_at"), route["x_hour"], account)
            sid = risky_schedule(account, "twitter", thread[0], thread, when)
        else:
            account = item.get("account_id") or route["li_account"]
            when, reason = resolve_and_space(item.get("fire_at"), route["li_hour"] or route["x_hour"], account)
            sid = risky_schedule(account, "linkedin", draft.get("linkedin_text") or thread[0], None, when)
    except Exception as e:
        return f"{item_id}: scheduling FAILED ({e}) — held"
    jsonl_append("scheduled.jsonl",
                 {"id": lid, "ts": datetime.now(timezone.utc).isoformat(), "project": project,
                  "channel": "x" if platform == "twitter" else "linkedin", "account": account,
                  "account_id": str(account), "source": draft.get("source", ""),
                  "state": "scheduled", "blotato_id": sid, "hash": body_hash, "fire_at": when,
                  "approval_mode": mode,
                  "keywords": sorted(set(re.findall(r"[a-z]{5,}", corpus.lower())))[:12]})
    mark_source_used(draft.get("source", ""), f"{project} batch item {item_id} scheduled {when}, ledger `{lid}`.")
    seen.add(lid)
    item["status"] = "scheduled"; item["fire_at"] = when; item["approval_mode"] = mode
    return f"{item_id}: queued {when} ({reason})"

def reject_item(manifest, item, reason):
    lid = f"batch-{manifest['date_key']}-{item['item_id']}"
    jsonl_append("rejected.jsonl", {"id": lid, "ts": datetime.now(timezone.utc).isoformat(),
                                    "project": _draft_of(item).get("project", ""), "state": "rejected",
                                    "reason": reason})
    item["status"] = "rejected"
    return f"{item['item_id']}: rejected ({reason})"

def merge_prompt(edit, items):
    return f"""You are applying ONE founder edit request to a set of approved-pending social drafts.
Founder edit request: {edit}

Items (JSON): {json.dumps([{ "item_id": it["item_id"], **_draft_of(it)} for it in items], ensure_ascii=False)}

Apply the edit ONLY where it applies; leave other items byte-identical. Never add facts,
numbers, links, or claims that are not already in an item. Output ONLY a json object:
{{"items": [{{"item_id": "...", "changed": true/false, "x_text": "...", "x_thread": [...], "linkedin_text": "..."}}]}}"""

def process_batch(msgs, seen, banned):
    """Apply the ratified reply grammar to today's manifest. Returns True if anything changed."""
    date_key = datetime.now(ET).strftime("%Y-%m-%d")
    manifest = batchlib.load_manifest(DRAFTS_DIR, date_key)
    changed = False
    for msg in sorted(msgs, key=lambda m: float(m.get("ts", 0))):
        text = (msg.get("text") or "").strip()
        cmd = batchlib.parse_reply(text)
        if not cmd:
            continue
        ts = msg.get("ts")
        # kill switch works with or without a manifest
        if cmd["cmd"] == "pause":
            if not batchlib.is_paused(PAUSE_FLAG):
                batchlib.set_paused(PAUSE_FLAG, True, why=f"founder stop content ({ts})")
                slack_post("⏸ content-ops paused. Reply 'resume content' to resume."); telegram("⏸ content-ops paused by founder.")
            continue
        if cmd["cmd"] == "resume":
            if batchlib.is_paused(PAUSE_FLAG):
                batchlib.set_paused(PAUSE_FLAG, False)
                slack_post("▶️ content-ops resumed."); telegram("▶️ content-ops resumed.")
            continue
        if manifest is None or batchlib.is_paused(PAUSE_FLAG):
            continue
        if float(ts) <= float(manifest.get("sent_ts") or 0):
            continue                          # replies predating the batch message aren't for it
        if ts in manifest.setdefault("processed_ts", []):
            continue                          # (batch-id, reply) dedupe — cross-channel/dup replies no-op
        manifest["processed_ts"].append(ts); changed = True
        nh = batchlib.needs_human_ids(manifest)
        pending = batchlib.pending_items(manifest)
        acks = []

        if cmd["cmd"] == "yes":
            for it in pending:
                acks.append(release_item(manifest, it, "batch_yes", seen, banned))
            if nh: acks.append(f"NEEDS-HUMAN held (per-item verbs only): {', '.join(sorted(nh))}")
        elif cmd["cmd"] == "no":
            for it in manifest["items"]:
                if it["status"] in ("pending", "needs_human"):
                    acks.append(reject_item(manifest, it, "founder-veto"))
        elif cmd["cmd"] == "skip":
            refs = [batchlib.resolve_ref(r, manifest) for r in cmd["refs"]]
            if None in refs:
                slack_post(f"↩︎ couldn't resolve item ref(s) in {text!r} — nothing done. Use the item numbers from the batch message.")
                continue
            slack_post(f"↩︎ parsed: skip {', '.join(refs)}, release the rest — acting.")
            for it in manifest["items"]:
                if it["item_id"] in refs and it["status"] in ("pending", "needs_human"):
                    acks.append(reject_item(manifest, it, "founder-veto"))
                elif it["status"] == "pending":
                    acks.append(release_item(manifest, it, "batch_yes", seen, banned))
        elif cmd["cmd"] in ("release", "edit", "drop"):
            ref = batchlib.resolve_ref(cmd["ref"], manifest)
            it = next((i for i in manifest["items"] if i["item_id"] == ref), None)
            if not it:
                slack_post(f"↩︎ couldn't resolve {cmd['ref']!r} — nothing done."); continue
            slack_post(f"↩︎ parsed: {cmd['cmd']} {ref} — acting.")
            if cmd["cmd"] == "release":
                acks.append(release_item(manifest, it, "per_item", seen, banned))
            elif cmd["cmd"] == "drop":
                acks.append(reject_item(manifest, it, "founder-veto"))
            else:
                out = llm(merge_prompt(cmd["edit"], [it]))
                try:
                    rd = json.loads(out[out.index("{"): out.rindex("}") + 1])["items"][0]
                    if rd.get("changed"):
                        it["draft"].update({k: v for k, v in rd.items() if k in ("x_text", "x_thread", "linkedin_text")})
                    acks.append(release_item(manifest, it, "per_item_edited", seen, banned))
                except Exception as e:
                    acks.append(f"{ref}: edit-merge failed ({e}) — held; try 'edit {ref}: …' again")
        elif cmd["cmd"] == "yes_but":
            targets = pending                                   # NEVER needs_human (G-03)
            out = llm(merge_prompt(cmd["edit"], targets))
            try:
                revised = json.loads(out[out.index("{"): out.rindex("}") + 1])["items"]
            except Exception as e:
                slack_post(f"↩︎ yes-but merge failed to parse ({e}). Use per-item verbs, or retry."); continue
            ok_ids = {it["item_id"] for it in targets}
            revised = [r for r in revised if r.get("item_id") in ok_ids]   # refuse merged-in NEEDS-HUMAN ids
            manifest["merge"] = {"edit": cmd["edit"], "posted_ts": batchlib.utc_iso(datetime.now(timezone.utc)),
                                 "items": revised, "confirmed": False}
            preview = "\n\n".join(f"[{r['item_id']}] changed={r.get('changed')}\n" +
                                  "\n".join(_thread_of(r) or [r.get('linkedin_text') or ''])
                                  for r in revised)
            slack_post(f"✏️ revised batch per: {cmd['edit']!r}\n\n{preview}\n\nReply `confirm` to release — "
                       f"or per-item verbs. Untouched items auto-release in {batchlib.MERGE_CONFIRM_TIMEOUT_H}h.")
        elif cmd["cmd"] == "confirm":
            merge = manifest.get("merge")
            if not merge or merge.get("confirmed"):
                continue
            merge["confirmed"] = True
            by_id = {r["item_id"]: r for r in merge["items"]}
            for it in batchlib.pending_items(manifest):
                r = by_id.get(it["item_id"])
                if r and r.get("changed"):
                    it["draft"].update({k: v for k, v in r.items() if k in ("x_text", "x_thread", "linkedin_text")})
                # G-13: any yes-but marks EVERY item of the batch as edited for Phase-2 ratio purposes
                acks.append(release_item(manifest, it, "yes_but_edited", seen, banned))
        if acks:
            slack_post("Batch " + manifest["date_key"] + ":\n" + "\n".join(acks))
            telegram("Batch " + manifest["date_key"] + ": " + " · ".join(acks))

    if manifest:
        # unconfirmed yes-but past the cutoff: release the untouched items, hold only the edited
        merge = manifest.get("merge")
        if merge and not merge.get("confirmed"):
            age_h = (datetime.now(timezone.utc) - batchlib.parse_utc(merge["posted_ts"])).total_seconds() / 3600
            if age_h >= batchlib.MERGE_CONFIRM_TIMEOUT_H:
                changed_ids = {r["item_id"] for r in merge["items"] if r.get("changed")}
                acks = []
                for it in batchlib.pending_items(manifest):
                    if it["item_id"] in changed_ids:
                        it["status"] = "held"; acks.append(f"{it['item_id']}: edited, held for explicit confirm")
                    else:
                        acks.append(release_item(manifest, it, "batch_yes", seen, banned))
                merge["confirmed"] = "timeout-split"
                changed = True
                slack_post("⏲ yes-but confirm window passed — released untouched items; edited item(s) held:\n" + "\n".join(acks))
        # TTL: nothing accepted after 22:00 ET; leftovers expire (re-offered ≤2 by tomorrow's assemble)
        if datetime.now(ET).hour >= batchlib.TTL_HOUR_ET:
            for it in manifest["items"]:
                if it["status"] in ("pending", "needs_human", "held"):
                    it["status"] = "expired"; changed = True
        if changed and not DRY_RUN:
            batchlib.save_manifest(DRAFTS_DIR, manifest)
        elif changed:
            print("[dry-run] manifest changes not saved")
    return changed

# ---------- main ----------

def main():
    seen = ledger_ids()
    banned = banned_phrases()
    processed = 0
    outcome = "ok"
    try:
        msgs = slack_history()
        process_batch(msgs, seen, banned)
        if batchlib.is_paused(PAUSE_FLAG):
            print("paused — scheduling skipped (reply 'resume content' in Slack to resume)")
            outcome = "paused"
            jsonl_append("runs.jsonl", {"date_key": datetime.now(ET).strftime("%Y-%m-%d"),
                                        "routine": "hands", "outcome": outcome, "host": HOSTNAME,
                                        "ts": datetime.now(timezone.utc).isoformat()})
            return
        for msg in msgs:
            text = (msg.get("text") or "").strip()
            if text.upper().startswith("SKIP"):
                # close the long-standing contract gap: a founder SKIP writes a rejected row
                mid = f"slack-{msg['ts']}"
                if mid not in seen and re.fullmatch(r"SKIP:?\s*.*", text, re.S):
                    reason = text[4:].lstrip(": ").strip() or "founder-veto"
                    jsonl_append("rejected.jsonl", {"id": mid, "ts": datetime.now(timezone.utc).isoformat(),
                                                    "state": "rejected", "reason": f"founder-skip: {reason[:120]}"})
                    seen.add(mid)
                continue
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
                jsonl_append("rejected.jsonl", {"id": mid, "ts": datetime.now(timezone.utc).isoformat(),
                                                "state": "rejected", "reason": f"unparseable-json: {e}"})
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

            problem = relint(thread, d.get("linkedin_text"), banned)
            if problem:
                telegram(f"⚠️ hands: APPROVED {msg['ts']} {problem} — NOT scheduled. Edit and re-approve.")
                continue

            corpus = " ".join(thread) + " " + (d.get("linkedin_text") or "")
            body_hash = hashlib.sha1(re.sub(r"\W+", "", corpus.lower()).encode()).hexdigest()
            notes = []
            try:
                # G-01: an explicit manifest fire_at is honored; otherwise legacy next-morning.
                when_x, _ = resolve_and_space(d.get("fire_at"), route["x_hour"], route["x_account"])
                x_id = risky_schedule(route["x_account"], "twitter", thread[0], thread, when_x)
                notes.append(f"X {when_x} id={x_id}")
                jsonl_append("scheduled.jsonl",
                             {"id": mid, "ts": datetime.now(timezone.utc).isoformat(), "project": project,
                              "channel": "x", "account": route["x_account"], "account_id": route["x_account"],
                              "source": d.get("source", ""), "state": "scheduled", "blotato_id": x_id,
                              "hash": body_hash, "fire_at": when_x, "approval_mode": "per_item",
                              "keywords": sorted(set(re.findall(r"[a-z]{5,}", corpus.lower())))[:12]})
                mark_source_used(d.get("source", ""),
                                 f"{project} draft scheduled for {when_x} (X), ledger id `{mid}`.")
                if d.get("linkedin_text") and route["li_account"]:
                    when_li, _ = resolve_and_space(d.get("fire_at_li"), route["li_hour"], route["li_account"])
                    li_id = risky_schedule(route["li_account"], "linkedin", d["linkedin_text"], None, when_li)
                    notes.append(f"LinkedIn {when_li} id={li_id}")
                    jsonl_append("scheduled.jsonl",
                                 {"id": mid + "-li", "ts": datetime.now(timezone.utc).isoformat(), "project": project,
                                  "channel": "linkedin", "account": route["li_account"], "account_id": route["li_account"],
                                  "source": d.get("source", ""), "state": "scheduled", "blotato_id": li_id,
                                  "hash": body_hash, "fire_at": when_li, "approval_mode": "per_item", "keywords": []})
            except Exception as e:
                telegram(f"🔴 hands: Blotato scheduling FAILED for {project} ({msg['ts']}): {e}. Nothing (further) queued.")
                print(f"FAIL {mid}: {e}")
                continue

            processed += 1
            seen.add(mid)
            telegram("🕘 Queued (veto window open) — " + f"{project}: " + " · ".join(notes) +
                     "\nDelete in Blotato before fire time to veto.")
            print(f"scheduled {mid}: {notes}")
    except Exception as e:
        outcome = f"failed: {e}"
        raise
    finally:
        jsonl_append("runs.jsonl", {"date_key": datetime.now(ET).strftime("%Y-%m-%d"), "routine": "hands",
                                    "outcome": outcome, "processed": processed, "host": HOSTNAME,
                                    "ts": datetime.now(timezone.utc).isoformat()})
    print(f"hands run complete, {processed} approval(s) processed")

if __name__ == "__main__":
    main()
