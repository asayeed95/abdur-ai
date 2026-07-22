#!/bin/bash
# One-time installer for the Mac-mini content loops (run BY THE FOUNDER — installs standing launchd jobs).
#   ! bash ~/projects/abdur-ai/content/workflows/local-brains/install-launchd.sh
# Installs (content-ops Slice 1, per Mnemix docs/superpowers/specs/CONTENT-OPS-SYSTEM.md — RATIFIED 2026-07-22):
#   com.agencyflow.content-rc1            daily 06:30 local — R-C1: fetch-first harvest + L-C1 loops -> item jsons
#   com.agencyflow.content-rc2-send       daily 07:30 local — R-C2: assemble + send the ONE morning batch
#   com.agencyflow.content-hands          every 30 min 08:00-23:00 — batch replies + APPROVED drafts -> Blotato (veto window)
#   com.agencyflow.content-buffer-monitor daily 20:00 local — RED alert if next 48h has no queued post
# The old per-project brain jobs (08:06/08:30) are SUPERSEDED by content-rc1 and removed on
# install; brain.sh itself stays for manual runs (`brain.sh dockerfile-ai` etc.).
# NOTE: launchd Hour/Minute are MACHINE-LOCAL time — the schedule assumes the runner's TZ is ET
# (same assumption the original jobs made).
# All jobs log to ~/Library/Logs/content-brains/. Uninstall: launchctl bootout gui/$(id -u)/<label>; rm the plist.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
LA=~/Library/LaunchAgents; mkdir -p "$LA" ~/Library/Logs/content-brains

install_job() { # label, minute-config-xml, program-args-xml, [extra-env-xml]
  local LABEL=$1 CAL=$2 ARGS=$3 EXTRAENV="${4:-}"
  cat > "$LA/$LABEL.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string>$ARGS</array>
  $CAL
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>$EXTRAENV</dict>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/content-brains/$LABEL.out</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/content-brains/$LABEL.err</string>
</dict></plist>
EOF
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$LA/$LABEL.plist"
  echo "✓ $LABEL"
}

# Supersession (spec §4.1): one consolidated run replaces the two separate brain schedules.
for OLD in com.agencyflow.content-brain-mnemix com.agencyflow.content-brain-abdur; do
  launchctl bootout "gui/$(id -u)/$OLD" 2>/dev/null || true
  rm -f "$LA/$OLD.plist" && echo "✗ removed superseded $OLD" || true
done

# RC1_HOST is baked at install time: exactly one host owns the date-keyed state (G-15).
install_job com.agencyflow.content-rc1 \
  "<key>StartCalendarInterval</key><dict><key>Hour</key><integer>6</integer><key>Minute</key><integer>30</integer></dict>" \
  "<string>$DIR/r-c1.sh</string>" \
  "<key>RC1_HOST</key><string>$(hostname -s)</string>"

install_job com.agencyflow.content-rc2-send \
  "<key>StartCalendarInterval</key><dict><key>Hour</key><integer>7</integer><key>Minute</key><integer>30</integer></dict>" \
  "<string>$DIR/r-c2-send.sh</string>"

# hands: every 30 min, gated inside the script to 08:00-23:00 local
install_job com.agencyflow.content-hands \
  "<key>StartInterval</key><integer>1800</integer>" \
  "<string>$DIR/hands-scheduler.sh</string>"

install_job com.agencyflow.content-buffer-monitor \
  "<key>StartCalendarInterval</key><dict><key>Hour</key><integer>20</integer><key>Minute</key><integer>0</integer></dict>" \
  "<string>$DIR/buffer-monitor.sh</string>"

echo; launchctl list | grep com.agencyflow.content || true
echo "Done. Logs: ~/Library/Logs/content-brains/"
