#!/bin/bash
# The interim "hands" (Mac-mini local; durable target = Pipedream per the blueprint).
# Scans #mnemix-content for founder messages starting "APPROVED:", schedules them to Blotato
# for a NEXT-MORNING fire (the veto window), Telegrams the founder, appends the content ledger.
# Idempotent: dedups on the Slack message ts via ledger/scheduled.jsonl. Publishes ONLY founder-approved drafts.
set -euo pipefail
HOUR=$(date +%H)
if [ "$HOUR" -lt 8 ] || [ "$HOUR" -ge 23 ]; then exit 0; fi   # quiet hours

DIR="$(cd "$(dirname "$0")" && pwd)"
LOGDIR="$HOME/Library/Logs/content-brains"; mkdir -p "$LOGDIR"
export SLACK_TOKEN=$(doppler secrets get SLACK_BOT_TOKEN --plain -p asec-production -c prd_asec_collections)
export BLOTATO_KEY=$(doppler secrets get BLOTATO_API_KEY --plain -p asec-production -c prd_asec_collections)
export TG_TOKEN=$(doppler secrets get TELEGRAM_BOT_TOKEN --plain -p asec-production -c prd_asec_collections)
export TG_CHAT=$(doppler secrets get ABDUR_TELEGRAM_CHAT_ID --plain -p asec-production -c prd_asec_collections 2>/dev/null || echo "5279872105")
export LEDGER_DIR="$DIR/../../ledger"
export BANNED_FILE="$DIR/../../voice/banned-phrases.md"
python3 "$DIR/hands_scheduler.py" 2>&1 | tee -a "$LOGDIR/hands-$(date +%Y%m%d).log"
