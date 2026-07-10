#!/bin/bash
# One-time installer for the Mac-mini content loops (run BY THE FOUNDER — installs standing launchd jobs).
#   ! bash ~/projects/abdur-ai/content/workflows/local-brains/install-launchd.sh
# Installs:
#   com.agencyflow.content-brain-mnemix   daily 08:06 local — drafts Mnemix post to Slack
#   com.agencyflow.content-brain-abdur    daily 08:30 local — drafts abdur.ai post to Slack
#   com.agencyflow.content-hands          every 30 min 08:00-23:00 — schedules APPROVED drafts via Blotato (veto window)
#   com.agencyflow.content-buffer-monitor daily 20:00 local — RED alert if next 48h has no queued post
# All jobs log to ~/Library/Logs/content-brains/. Uninstall: launchctl bootout gui/$(id -u)/<label>; rm the plist.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
LA=~/Library/LaunchAgents; mkdir -p "$LA" ~/Library/Logs/content-brains

install_job() { # label, minute-config-xml, program-args-xml
  local LABEL=$1 CAL=$2 ARGS=$3
  cat > "$LA/$LABEL.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string>$ARGS</array>
  $CAL
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string></dict>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/content-brains/$LABEL.out</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/content-brains/$LABEL.err</string>
</dict></plist>
EOF
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$LA/$LABEL.plist"
  echo "✓ $LABEL"
}

install_job com.agencyflow.content-brain-mnemix \
  "<key>StartCalendarInterval</key><dict><key>Hour</key><integer>8</integer><key>Minute</key><integer>6</integer></dict>" \
  "<string>$DIR/brain.sh</string><string>mnemix</string>"

install_job com.agencyflow.content-brain-abdur \
  "<key>StartCalendarInterval</key><dict><key>Hour</key><integer>8</integer><key>Minute</key><integer>30</integer></dict>" \
  "<string>$DIR/brain.sh</string><string>abdur-ai</string>"

# hands: every 30 min, gated inside the script to 08:00-23:00 local
install_job com.agencyflow.content-hands \
  "<key>StartInterval</key><integer>1800</integer>" \
  "<string>$DIR/hands-scheduler.sh</string>"

install_job com.agencyflow.content-buffer-monitor \
  "<key>StartCalendarInterval</key><dict><key>Hour</key><integer>20</integer><key>Minute</key><integer>0</integer></dict>" \
  "<string>$DIR/buffer-monitor.sh</string>"

echo; launchctl list | grep com.agencyflow.content || true
echo "Done. Logs: ~/Library/Logs/content-brains/"
