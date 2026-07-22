#!/bin/bash
# Daily content brain — LOCAL Mac-mini runner (replaces the cloud routines lost in the 2026-07-10 account switch).
# Generates ONE locks-clean draft for <project> and posts it to Slack #mnemix-content for founder review.
# The model gets NO tools and NO secrets: the wrapper gathers all context and does all I/O.
# PUBLISHES NOTHING — Slack draft only. Approval + scheduling happen downstream (hands-scheduler.sh).
#
# Usage: brain.sh <mnemix|abdur-ai> [--test] [--emit-only <outfile>]
#   --emit-only: write the draft to <outfile> and DON'T post to Slack — the r-c1 loop
#   (rc1_loop.py) owns gating + revision + batch assembly in that mode. Gate failures
#   still emit the draft (exit 3) so the loop can revise instead of losing the attempt.
set -euo pipefail

PROJECT="${1:?usage: brain.sh <mnemix|abdur-ai> [--test] [--emit-only <outfile>]}"
TEST_PREFIX=""
EMIT_ONLY=""
DRAFT_OUT=""
shift || true
while [ $# -gt 0 ]; do
  case "$1" in
    --test) TEST_PREFIX="[TEST-RUN] " ;;
    --emit-only) EMIT_ONLY=1; DRAFT_OUT="${2:?--emit-only needs an output path}"; shift ;;
  esac
  shift
done

DIR="$(cd "$(dirname "$0")" && pwd)"
CHANNEL="C0BAMF2P4L8"
LOGDIR="$HOME/Library/Logs/content-brains"; mkdir -p "$LOGDIR"
LOG="$LOGDIR/$PROJECT-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1
echo "=== brain.sh $PROJECT $(date -u +%FT%TZ) ==="

case "$PROJECT" in
  mnemix)        REPO="$HOME/projects/mnemix" ;;
  abdur-ai)      REPO="$HOME/projects/abdur-ai" ;;
  dockerfile-ai) REPO="$HOME/projects/dockerfile-ai" ;;
  heycli)        REPO="$HOME/projects/remotecli" ;;
  # 2026-07-16: dockerfile-ai + heycli added (repo-delegation redefinition). Both route to
  # #mnemix-content with a [project] tag until #abdur-content exists, and to @abdur_sayeed
  # per ../repo-delegation/README.md's routing table. NOT launchd-scheduled yet — run manually
  # (`brain.sh dockerfile-ai` / `brain.sh heycli`) until Abdur confirms cadence + fire time.
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

# --- context: captured source records (preferred material — see ../repo-delegation/README.md) ---
# capture-repo-events.sh writes one file per merged-to-main event worth drafting from, already
# filtered to real feat/fix/decision commits with full receipts (not just an oneline subject).
# A record is "used" once its placeholder Used-by line is replaced (mark_source_used() in
# hands_scheduler.py does this at schedule time) — only UNUSED records are offered here, so a
# source can't get drafted twice. Filename convention: "$PROJECT-<sha>-<slug>.md", except the
# one real collision in this key set: "mnemix-*" globs also match "mnemix-learning-*" (mnemix
# is a prefix of mnemix-learning) — guarded below.
SOURCES_DIR="$DIR/../../sources/repo-events"
UNUSED_SOURCES=""
if [ -d "$SOURCES_DIR" ]; then
  for f in "$SOURCES_DIR/$PROJECT"-*.md; do
    [ -f "$f" ] || continue
    base="$(basename "$f")"
    if [ "$PROJECT" = "mnemix" ]; then
      case "$base" in mnemix-learning-*) continue ;; esac
    fi
    grep -q '_(none yet — pending draft)_' "$f" || continue   # already used elsewhere — skip
    UNUSED_SOURCES="$UNUSED_SOURCES

--- sources/repo-events/$base ---
$(cat "$f")"
  done
fi
[ -z "$UNUSED_SOURCES" ] && UNUSED_SOURCES="(none captured yet for $PROJECT — run capture-repo-events.sh, or everything captured is already used; falling back to RECENT GIT LOG below)"

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
CAPTURED SOURCE RECORDS (PREFERRED — already vetted, real, merged-to-main, full receipts.
If you use one, cite its exact path, e.g. "sources/repo-events/$PROJECT-abc1234-slug.md", as
the json "source" field verbatim so it can be marked used and never redrafted):
$UNUSED_SOURCES

RECENT GIT LOG (FALLBACK ONLY — use if nothing above fits; oneline subjects only, no receipts.
If you draft from here instead, put the bare commit sha as the json "source" field):
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

# In --emit-only mode a gate failure still hands the draft to the loop (exit 3 = revisable).
emit_reject() {
  echo "REJECT: $1"
  if [ -n "$EMIT_ONLY" ]; then
    printf '%s' "$DRAFT" > "$DRAFT_OUT"
    echo "EMITTED (gates failed) -> $DRAFT_OUT"
    exit 3
  fi
  exit 1
}

# --- gate 1: must contain the machine-readable json block ---
echo "$DRAFT" | grep -q '```json' || { echo "$DRAFT" | head -20; emit_reject "draft has no json block"; }

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
  *)  emit_reject "$COUNTS" ;;
esac

# --- gate 3: banned-phrases lint on the whole draft ---
BANNED_FILE="$DIR/../../voice/banned-phrases.md"
if [ -f "$BANNED_FILE" ]; then
  VIOL=$(awk '/^## MACHINE-CHECK BLOCK/,0' "$BANNED_FILE" | sed -n '/^```$/,/^```$/p' | sed '1d;$d' |
    while IFS= read -r ph; do [ -n "$ph" ] && echo "$DRAFT" | grep -qiF "$ph" && echo "$ph"; done || true)
  if [ -n "$VIOL" ]; then emit_reject "banned phrases: $VIOL"; fi
  echo "banned-phrases lint OK"
fi

# --- emit-only mode stops here: the loop owns approval routing ---
if [ -n "$EMIT_ONLY" ]; then
  printf '%s' "$DRAFT" > "$DRAFT_OUT"
  echo "EMITTED (gates green) -> $DRAFT_OUT"
  exit 0
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
