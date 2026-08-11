#!/bin/bash
# R-C1 — daily consolidated harvest + draft + refine (06:30 ET launchd job; Mac mini only).
# CONTENT-OPS-SYSTEM §4.1 (RATIFIED 2026-07-22). Supersedes the separate 08:06/08:30 brain
# schedules (one run, one batch). The 07:30 send is the sibling job (batch_assemble.py --send
# via r-c2-send in install-launchd.sh) — drafting may run in quiet hours, messaging may not.
#
# Runner pin (G-15): harvest cursors + date-keyed state are machine-local, so exactly one
# host owns this routine. install-launchd.sh bakes RC1_HOST=$(hostname -s) into the plist;
# a manual run elsewhere needs ALLOW_ANY_HOST=1 (and batch_assemble still hard-stops on a
# foreign-host manifest).
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
LOGDIR="$HOME/Library/Logs/content-brains"; mkdir -p "$LOGDIR"
LOG="$LOGDIR/r-c1-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1
echo "=== r-c1.sh $(date -u +%FT%TZ) host=$(hostname -s) ==="

if [ -n "${RC1_HOST:-}" ] && [ "${ALLOW_ANY_HOST:-}" != "1" ] && [ "$(hostname -s)" != "$RC1_HOST" ]; then
  echo "ABORT: pinned runner is $RC1_HOST, this is $(hostname -s) (set ALLOW_ANY_HOST=1 to override)"
  exit 2
fi

# --- kill switch / auto-pause honored at the top: drafting is safe while paused, but say so ---
[ -f "$DIR/.paused" ] && echo "note: content-ops is PAUSED — drafting continues, nothing will schedule"

# --- fetch-first (the 'cloud' half of the harvest: overnight agent merges land on origin/main) ---
for r in "$HOME/projects/mnemix" "$HOME/projects/abdur-ai" "$HOME/projects/dockerfile-ai" \
         "$HOME/projects/remotecli" "$HOME/projects/mnemix-learning"; do
  if [ -d "$r/.git" ]; then
    git -C "$r" fetch origin main --quiet 2>/dev/null || git -C "$r" fetch origin master --quiet 2>/dev/null \
      || echo "note: fetch failed for $r (harvest will use local state)"
  fi
done

# --- capture merged-to-main work into sources/repo-events (cursor-tracked, idempotent) ---
DRY_RUN=0 "$DIR/capture-repo-events.sh" || echo "note: capture had a non-fatal problem (see above)"

# --- the L-C1 loop per priority project (floor-only per D-8: one item per account) ---
FAILED=""
for p in mnemix abdur-ai; do
  python3 "$DIR/rc1_loop.py" --project "$p" || FAILED="$FAILED $p"
done
[ -n "$FAILED" ] && echo "note: loop failed for:$FAILED — batch will say so (partial is honest, silent is not)"

# --- runs.jsonl visibility row (§2.2/G-19) ---
python3 - "$DIR" "$FAILED" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo
d = Path(sys.argv[1]); failed = (sys.argv[2] or "").split()
row = {"date_key": datetime.now(ZoneInfo("America/New_York")).strftime("%Y-%m-%d"),
       "routine": "r-c1", "outcome": "ok" if not failed else f"partial (failed: {failed})",
       "host": __import__("socket").gethostname(),
       "ts": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
with open(d / ".." / ".." / "ledger" / "runs.jsonl", "a") as f:
    f.write(json.dumps(row) + "\n")
PY
echo "r-c1 complete"
