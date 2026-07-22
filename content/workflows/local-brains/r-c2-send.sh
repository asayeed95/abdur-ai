#!/bin/bash
# R-C2 send — posts the ONE morning batch message (07:30 ET launchd job).
# Thin env wrapper around batch_assemble.py, same Doppler pattern as hands-scheduler.sh.
# Assembly is idempotent by (date, host); a foreign-host manifest is a hard stop (G-15).
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
LOGDIR="$HOME/Library/Logs/content-brains"; mkdir -p "$LOGDIR"

export SLACK_TOKEN=$(doppler secrets get SLACK_BOT_TOKEN --plain -p asec-production -c prd_asec_collections)
export TG_TOKEN=$(doppler secrets get TELEGRAM_BOT_TOKEN --plain -p asec-production -c prd_asec_collections)
export TG_CHAT=$(doppler secrets get ABDUR_TELEGRAM_CHAT_ID --plain -p asec-production -c prd_asec_collections 2>/dev/null || echo "5279872105")

python3 "$DIR/batch_assemble.py" 2>&1 | tee -a "$LOGDIR/r-c2-send-$(date +%Y%m%d).log"
