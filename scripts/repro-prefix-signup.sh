#!/usr/bin/env bash
# Reproduce how the signup route behaved BEFORE the AGE-2884 audit.
#
# Builds the route as it stood at a commit (default c7bc07f) in a throwaway git
# worktree, patched in exactly one way: its Resend origin is read from
# RESEND_API_BASE_URL so it can reach a local stand-in. Then sends the probe
# requests in scripts/probe-signup-route.mjs and prints what came back.
# Nothing here contacts the real Resend API.
#
# Usage: scripts/repro-prefix-signup.sh [commit]
set -euo pipefail
cd "$(dirname "$0")/.."
COMMIT="${1:-c7bc07f}"
WT="$(mktemp -d "${TMPDIR:-/tmp}/signup-prefix.XXXXXX")"
trap 'git worktree remove --force "$WT" >/dev/null 2>&1 || true' EXIT

git worktree add -f "$WT" "$COMMIT" >/dev/null
ln -s "$PWD/node_modules" "$WT/node_modules"

python3 - "$WT/app/api/subscribe/route.ts" <<'EOF'
import re, sys
p = sys.argv[1]
s = open(p).read()
s = re.sub(r'"https://api\.resend\.com/([^"]*)"', lambda m: "`${API}/" + m.group(1) + "`", s)
s = s.replace("https://api.resend.com", "${API}")
s = s.replace('import { z } from "zod";', 'import { z } from "zod";\nconst API = process.env.RESEND_API_BASE_URL;', 1)
open(p, "w").write(s)
EOF

(cd "$WT" && npm run build >/dev/null 2>&1)
node scripts/probe-signup-route.mjs "$WT" "$COMMIT"
