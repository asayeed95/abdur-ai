#!/bin/bash
# Evening buffer monitor — the guaranteed-daily backstop.
# Reads the Blotato queue; if @mnemix_official or @abdur_sayeed has nothing scheduled in the
# next 48h, Telegrams a RED alert so a human hand-queues one. Runs daily 20:00 local.
set -euo pipefail
BLOTATO_KEY=$(doppler secrets get BLOTATO_API_KEY --plain -p asec-production -c prd_asec_collections)
TG_TOKEN=$(doppler secrets get TELEGRAM_BOT_TOKEN --plain -p asec-production -c prd_asec_collections)
TG_CHAT=$(doppler secrets get ABDUR_TELEGRAM_CHAT_ID --plain -p asec-production -c prd_asec_collections 2>/dev/null || echo "5279872105")
export BLOTATO_KEY TG_TOKEN TG_CHAT
python3 << 'PYEOF'
import json, os, urllib.request
from datetime import datetime, timedelta, timezone

def http(url, data=None, headers=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode() if data else None, headers=headers or {})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode() or "{}")

d = http("https://backend.blotato.com/v2/schedules?limit=50",
         headers={"blotato-api-key": os.environ["BLOTATO_KEY"]})
items = d.get("items") or d.get("schedules") or (d if isinstance(d, list) else [])
now = datetime.now(timezone.utc); horizon = now + timedelta(hours=48)
WATCH = {"18856": "@mnemix_official", "20072": "@abdur_sayeed"}
queued = {aid: [] for aid in WATCH}
for it in items:
    acct = str((it.get("account") or {}).get("id") or (it.get("draft") or {}).get("accountId") or "")
    when = it.get("scheduledAt") or it.get("scheduledTime") or ""
    try:
        t = datetime.fromisoformat(when.replace("Z", "+00:00"))
    except Exception:
        continue
    if acct in queued and now <= t <= horizon:
        queued[acct].append(t.strftime("%m-%d %H:%M UTC"))

lines, red = [], False
for aid, handle in WATCH.items():
    if queued[aid]:
        lines.append(f"✅ {handle}: {len(queued[aid])} queued ({', '.join(queued[aid][:3])})")
    else:
        lines.append(f"🔴 {handle}: NOTHING queued in next 48h — hand-queue one (approve a Slack draft or run brain.sh)")
        red = True
msg = ("⚠️ CONTENT BUFFER ALERT\n" if red else "🌙 Content buffer OK\n") + "\n".join(lines)
http(f"https://api.telegram.org/bot{os.environ['TG_TOKEN']}/sendMessage",
     data={"chat_id": os.environ["TG_CHAT"], "text": msg},
     headers={"Content-Type": "application/json"})
print(msg)
PYEOF
