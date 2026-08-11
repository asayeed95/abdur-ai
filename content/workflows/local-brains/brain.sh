#!/bin/bash
# Daily content brain — LOCAL Mac-mini runner (replaces the cloud routines lost in the 2026-07-10 account switch).
# Generates ONE locks-clean draft for <project> and posts it to Slack #mnemix-content for founder review.
# The model gets NO tools and NO secrets: the wrapper gathers all context and does all I/O.
# PUBLISHES NOTHING — Slack draft only. Approval + scheduling happen downstream (hands-scheduler.sh).
#
# Usage: brain.sh <mnemix|abdur-ai> [--test]
set -euo pipefail

PROJECT="${1:?usage: brain.sh <mnemix|abdur-ai> [--test]}"
TEST_PREFIX=""
[ "${2:-}" = "--test" ] && TEST_PREFIX="[TEST-RUN] "

DIR="$(cd "$(dirname "$0")" && pwd)"
CHANNEL="C0BAMF2P4L8"
LOGDIR="$HOME/Library/Logs/content-brains"; mkdir -p "$LOGDIR"
LOG="$LOGDIR/$PROJECT-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1
echo "=== brain.sh $PROJECT $(date -u +%FT%TZ) ==="

case "$PROJECT" in
  mnemix)   REPO="$HOME/projects/mnemix" ;;
  abdur-ai) REPO="$HOME/projects/abdur-ai" ;;
  *) echo "unknown project: $PROJECT"; exit 1 ;;
esac
PROMPT_FILE="$DIR/prompts/$PROJECT.md"
[ -f "$PROMPT_FILE" ] || { echo "missing prompt file $PROMPT_FILE"; exit 1; }

# --- secrets (Doppler; never echoed) ---
SLACK_TOKEN=$(doppler secrets get SLACK_BOT_TOKEN --plain -p asec-production -c prd_asec_collections)
[ -n "$SLACK_TOKEN" ] || { echo "no SLACK_BOT_TOKEN"; exit 1; }

# --- context: recent milestones (real sources only) ---
GITLOG=$(cd "$REPO" && git log --oneline -15)
EXTRA=""
if [ "$PROJECT" = "abdur-ai" ] && [ -f "$REPO/content/ship-log.json" ]; then
  EXTRA="SHIP LOG (real cross-project milestones):
$(head -40 "$REPO/content/ship-log.json")"
fi

# --- context: ledger angles (dedup corpus part 1 — everything already posted/scheduled) ---
LEDGER_DIR="$DIR/../../ledger"
LEDGER_ANGLES=$(python3 -c "
import json, pathlib
seen=[]
for name in ('posted.jsonl','scheduled.jsonl'):
    p=pathlib.Path('$LEDGER_DIR')/name
    if p.exists():
        for line in p.read_text().splitlines():
            try:
                d=json.loads(line)
                seen.append(f\"- [{d.get('state','')}] {d.get('project','')}/{d.get('channel','')}: {d.get('angle','')[:150]}\")
            except Exception: pass
print('\n'.join(seen[-40:]) if seen else '(ledger empty)')
")

# --- context: recent drafts in the channel (dedup corpus part 2) ---
RECENT=$(curl -s -H "Authorization: Bearer $SLACK_TOKEN" \
  "https://slack.com/api/conversations.history?channel=$CHANNEL&limit=20" |
  python3 -c "
import json,sys
d=json.load(sys.stdin)
if not d.get('ok'): print('(slack history unavailable:', d.get('error'), ')'); raise SystemExit
for m in d.get('messages',[]):
    t=(m.get('text') or '').replace(chr(10),' ')[:220]
    if t: print('-', t)
" )

# --- compose the full prompt ---
COMPOSED=$(mktemp)
cat "$PROMPT_FILE" > "$COMPOSED"
cat >> "$COMPOSED" << EOF

---
RECENT GIT LOG (your raw material — pick a REAL shipped thing):
$GITLOG

$EXTRA

ALREADY POSTED OR SCHEDULED (ledger — do NOT repeat any of these angles):
$LEDGER_ANGLES

RECENT DRAFTS ALREADY IN THE CHANNEL (do NOT repeat these either):
$RECENT
EOF

# --- generate (no tools, no network, pure text out) ---
# NOTE: --allowedTools is an auto-approval list, NOT a whitelist — headless denies un-allowed
# tools, but belt-and-braces we explicitly disallow every side-effect tool as well.
DRAFT=$(cd "$REPO" && claude -p "$(cat "$COMPOSED")" --model claude-sonnet-5 \
  --allowedTools "" \
  --disallowedTools "Bash,Read,Write,Edit,Glob,Grep,WebFetch,WebSearch,Task,NotebookEdit" \
  2>>"$LOG") || { echo "claude -p failed"; exit 1; }
rm -f "$COMPOSED"
[ -n "$DRAFT" ] || { echo "empty draft"; exit 1; }
echo "$DRAFT" > "${LOG%.log}-draft.md"   # persist for post-mortem on gate rejects

# --- gate 1: must contain the machine-readable json block ---
echo "$DRAFT" | grep -q '```json' || { echo "REJECT: draft has no json block"; echo "$DRAFT" | head -20; exit 1; }

# --- gate 2: weighted tweet-length check on the json thread ---
COUNTS=$(echo "$DRAFT" | python3 -c "
import json,re,sys
txt=sys.stdin.read()
m=re.search(r'\`\`\`json\s*(.*?)\`\`\`', txt, re.S)
try: d=json.loads(m.group(1))
except Exception as e: print('JSONFAIL', e); raise SystemExit(1)
def w(s):
    t=0
    for ch in s:
        c=ord(ch)
        t+=1 if (0<=c<=4351 or 8192<=c<=8205 or 8208<=c<=8223 or 8242<=c<=8247) else 2
    return t
bad=[f'tweet{i+1}={w(t)}' for i,t in enumerate(d.get('x_thread') or [d.get('x_text','')]) if w(t)>280]
print('OVER ' + ' '.join(bad) if bad else 'OK')
")
case "$COUNTS" in
  OK) echo "tweet lengths OK" ;;
  *)  echo "REJECT: $COUNTS"; exit 1 ;;
esac

# --- gate 3: banned-phrases lint on the whole draft ---
BANNED_FILE="$DIR/../../voice/banned-phrases.md"
if [ -f "$BANNED_FILE" ]; then
  VIOL=$(awk '/^## MACHINE-CHECK BLOCK/,0' "$BANNED_FILE" | sed -n '/^```$/,/^```$/p' | sed '1d;$d' |
    while IFS= read -r ph; do [ -n "$ph" ] && echo "$DRAFT" | grep -qiF "$ph" && echo "$ph"; done || true)
  if [ -n "$VIOL" ]; then echo "REJECT: banned phrases: $VIOL"; exit 1; fi
  echo "banned-phrases lint OK"
fi

# --- post to Slack for approval ---
HEADER="${TEST_PREFIX}🧠 _Daily Content Brain — ${PROJECT} draft for review_ ($(date +%Y-%m-%d), local Mac-mini brain)"
FOOTER="APPROVE (reply APPROVED: + the json) · EDIT (reply with changes) · SKIP (reply SKIP). Publishes nothing until a human acts."
BODY="$HEADER

$DRAFT

$FOOTER"
RESP=$(SLACK_BODY="$BODY" SLACK_TOKEN_ENV="$SLACK_TOKEN" python3 -c "
import json,os,urllib.request
req=urllib.request.Request('https://slack.com/api/chat.postMessage',
    data=json.dumps({'channel':'$CHANNEL','text':os.environ['SLACK_BODY']}).encode(),
    headers={'Authorization':'Bearer '+os.environ['SLACK_TOKEN_ENV'],'Content-Type':'application/json'})
print(urllib.request.urlopen(req).read().decode())
")
echo "$RESP" | grep -q '"ok":true' && echo "POSTED to #mnemix-content ✓" || { echo "SLACK POST FAILED: $RESP"; exit 1; }
