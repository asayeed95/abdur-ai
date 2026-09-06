#!/usr/bin/env bash
# install-git-hooks.sh — wire the build-discipline gate into local git so it
# fires on every commit WITHOUT anyone remembering to run it (checks beat
# prose). Idempotent + NON-DESTRUCTIVE: respects core.hooksPath, never
# clobbers a foreign pre-commit hook. Usage (once per clone):
#   bash scripts/install-git-hooks.sh
set -eu
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

HOOKDIR="$(git config core.hooksPath 2>/dev/null || true)"
[ -z "$HOOKDIR" ] && HOOKDIR=".git/hooks"
case "$HOOKDIR" in /*) ;; *) HOOKDIR="$ROOT/$HOOKDIR";; esac
mkdir -p "$HOOKDIR"
HOOK="$HOOKDIR/pre-commit"
SIG="build-discipline pre-commit gate"

if [ -f "$HOOK" ] && ! grep -q "$SIG" "$HOOK" 2>/dev/null; then
  echo "⚠ pre-commit already exists at $HOOK and is NOT ours — NOT overwriting (skipped)."
  echo "  To combine: have that hook also run 'bash scripts/check-phase.sh all --hard', or back it up and re-run."
  exit 0
fi

cat > "$HOOK" <<'SH'
#!/usr/bin/env bash
# build-discipline pre-commit gate (auto-installed). Deliberate bypass: git commit --no-verify
set -uo pipefail
fail=0

# 1) Never commit unresolved merge markers — inspect each staged blob's CONTENT
#    (catches brand-new files, which `git diff --check` misses). Open/close markers
#    are unambiguous (7 chars + space); skip the bare ======= to avoid markdown
#    false-positives — a real conflict always carries <<<<<<< and >>>>>>> too.
while IFS= read -r -d '' f; do
  if git show ":$f" 2>/dev/null | grep -qE '^(<<<<<<< |>>>>>>> )'; then
    echo "✗ pre-commit: merge-conflict marker in staged file: $f"
    fail=1
  fi
done < <(git diff --cached --name-only -z --diff-filter=d)

# 2) Run the phase gate if this repo has one (design-token lock + build/lint/typecheck).
if [ -x scripts/check-phase.sh ]; then
  if ! bash scripts/check-phase.sh all --hard >/tmp/.bd-precommit.out 2>&1; then
    echo "✗ pre-commit: check-phase --hard FAILED:"
    tail -20 /tmp/.bd-precommit.out
    fail=1
  fi
fi

if [ "$fail" = 0 ]; then
  echo "✓ build-discipline pre-commit gate passed"
else
  echo "Commit blocked by the build-discipline gate. Fix the above, or bypass deliberately: git commit --no-verify"
fi
exit $fail
SH

chmod +x "$HOOK"
echo "Installed $HOOK — merge-marker + check-phase --hard gate."
