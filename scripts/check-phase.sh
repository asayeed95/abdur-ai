#!/usr/bin/env bash
# check-phase.sh — abdur-ai build-discipline gate (light treatment).
#
# This repo does NOT run the full 7-phase build-discipline gate. See
# PROCESS.md for why: near-done public content site, no auth/payments/
# user-data surface. This script checks the two things that actually matter
# here:
#   1. [NEVER-SKIP] Nobody quietly edits the locked design tokens
#      (tailwind.config.ts / app/globals.css) without an explicit, on-record
#      override in docs/superpowers/specs/overrides.md — turns the existing
#      prose rule in CLAUDE.md/README.md into an enforced gate.
#   2. [NEVER-SKIP] Nobody publishes content (content/posts/*.mdx outside
#      _drafts/) without an explicit, on-record override in the same file —
#      see content/posts/_drafts/CONTENT-ROUTING-RULE.md for why.
#   3. The site actually builds, lints, and typechecks clean (built in a
#      .next/cache/gate mirror when rsync is available, so a running
#      `next dev` is not clobbered).
#
# Usage:
#   ./scripts/check-phase.sh              # soft: report, exit 0
#   ./scripts/check-phase.sh --hard       # CI/pre-commit: exit 1 on any FAIL
#   ./scripts/check-phase.sh all --hard   # "all" accepted for compat with
#                                         # install-git-hooks.sh; no-op here —
#                                         # there's only one gate set, not
#                                         # phase-numbered checks.

set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 0

HARD=0
for arg in "$@"; do
  case "$arg" in
    --hard) HARD=1 ;;
  esac
done

FAILS=0
pass()  { printf "  \033[32m✓\033[0m %s\n" "$1"; }
fail()  { printf "  \033[31m✗\033[0m %s\n" "$1"; FAILS=$((FAILS+1)); }
warn()  { printf "  \033[33m!\033[0m %s\n" "$1"; }

echo "==> abdur-ai build-discipline gate $([ $HARD -eq 1 ] && echo '[HARD]')"

# ---------- [NEVER-SKIP] Design/content lock ----------
echo "==> [NEVER-SKIP] Design token lock (tailwind.config.ts, app/globals.css)"
LOCKED_FILES="tailwind.config.ts app/globals.css"
OVERRIDES="docs/superpowers/specs/overrides.md"
# The override must be IN THE COMMIT, so read the staged (index) copy, not the
# working tree — an override typed into the file but left unstaged would
# otherwise clear the gate and then not ship.
OVERRIDES_STAGED="$(git show ":$OVERRIDES" 2>/dev/null || true)"
TMPD="$(mktemp -d "${TMPDIR:-/tmp}/bd-gate.XXXXXX")"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  STAGED_HITS=""
  for f in $LOCKED_FILES; do
    git diff --cached --name-only 2>/dev/null | grep -qx "$f" && STAGED_HITS="$STAGED_HITS $f"
  done
  UNSTAGED_HITS=""
  for f in $LOCKED_FILES; do
    git diff --name-only 2>/dev/null | grep -qx "$f" && UNSTAGED_HITS="$UNSTAGED_HITS $f"
  done

  if [ -n "$STAGED_HITS" ]; then
    UNCOVERED=""
    for f in $STAGED_HITS; do
      if printf "%s" "$OVERRIDES_STAGED" | grep -qE "design-token-override:[[:space:]]*${f}([[:space:]]|\$|#)"; then
        :
      else
        UNCOVERED="$UNCOVERED $f"
      fi
    done
    if [ -n "$UNCOVERED" ]; then
      fail "locked design file(s) staged with NO matching override:$UNCOVERED — add a 'design-token-override:' entry to $OVERRIDES (see PROCESS.md Soft-Gate Procedure) or unstage the change"
    else
      warn "locked design file(s) staged ($STAGED_HITS) — override entry found in $OVERRIDES, allowing"
    fi
  elif [ -n "$UNSTAGED_HITS" ]; then
    warn "locked design file(s) modified but not staged:$UNSTAGED_HITS — will be gated at commit time"
  else
    pass "no changes to locked design tokens"
  fi
else
  warn "not inside a git work tree — skipping design-token lock check"
fi

# ---------- [NEVER-SKIP] Content publish lock ----------
echo "==> [NEVER-SKIP] Content publish lock (content/posts/*.mdx outside _drafts/)"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  STAGED_PUBLISHED=$(git diff --cached --name-only 2>/dev/null | grep -E '^content/posts/[^/]+\.mdx$' || true)

  if [ -n "$STAGED_PUBLISHED" ]; then
    UNCOVERED=""
    for f in $STAGED_PUBLISHED; do
      if printf "%s" "$OVERRIDES_STAGED" | grep -qE "content-publish-override:[[:space:]]*${f}([[:space:]]|\$|#)"; then
        :
      else
        UNCOVERED="$UNCOVERED $f"
      fi
    done
    if [ -n "$UNCOVERED" ]; then
      fail "published content staged with NO matching override:$UNCOVERED — per CONTENT-ROUTING-RULE.md, all content lands in content/posts/_drafts/ first; add a 'content-publish-override:' entry to $OVERRIDES to publish deliberately"
    else
      warn "published content staged ($STAGED_PUBLISHED) — override entry found in $OVERRIDES, allowing"
    fi
  else
    pass "no direct-to-published content staged"
  fi
else
  warn "not inside a git work tree — skipping content publish lock check"
fi

# ---------- Public claims ----------
echo "==> Public claims"
if python3 scripts/check-public-claims.py >$TMPD/public-claims.out 2>&1; then
  pass "python3 scripts/check-public-claims.py"
else
  fail "python3 scripts/check-public-claims.py FAILED — see $TMPD/public-claims.out"
  tail -20 $TMPD/public-claims.out | sed 's/^/      /'
fi

# ---------- Typecheck ----------
echo "==> Typecheck"
# Regenerate .next/types (routes.d.ts, validator.ts) so `tsc` checks the same
# generated route types with or without a dev server, and a validator left
# stale by a deleted route cannot keep the gate red. `next typegen` writes only
# `.next/types/{routes.d.ts,validator.ts}` under `.next` — no BUILD_ID, no
# manifests — so it is safe under a running dev.
if ! "$ROOT/node_modules/.bin/next" typegen >"$TMPD/typegen.out" 2>&1; then
  warn "next typegen failed — see $TMPD/typegen.out (typecheck runs without regenerated route types)"
fi
if npm run typecheck >$TMPD/typecheck.out 2>&1; then
  pass "npm run typecheck"
else
  fail "npm run typecheck FAILED — see $TMPD/typecheck.out"
  tail -20 $TMPD/typecheck.out | sed 's/^/      /'
fi

# ---------- Lint ----------
echo "==> Lint"
if npm run lint >$TMPD/lint.out 2>&1; then
  pass "npm run lint"
else
  fail "npm run lint FAILED — see $TMPD/lint.out"
  tail -20 $TMPD/lint.out | sed 's/^/      /'
fi

# ---------- Build ----------
# Why a mirror: `next dev` and `next build` share `.next` (Next 15.5 has no
# dev/build distDir split). An in-place build writes BUILD_ID and production
# manifests under a running dev server, which then serves SSR HTML whose
# /_next/static assets 404, and the overlay shows
# `__webpack_modules__[moduleId] is not a function`. A separate distDir was
# rejected: every build rewrites tsconfig.json `include` and next-env.d.ts to
# point at `${distDir}/types`, and the generated routes.d.ts declares global
# types, so two copies fail the build's own type check. Instead the build runs
# in a disposable copy of the tree, so nothing the dev server serves (BUILD_ID,
# manifests, static chunks) is written to `.next`; the gate only adds
# `.next/cache/gate` and `.next/types` (plus `next lint`'s `.next/cache/eslint`). The mirror sits under `.next/cache/`
# because dev startup and in-place builds wipe `.next` except `cache/`.
echo "==> Build"
MIRROR="$ROOT/.next/cache/gate"
if command -v rsync >/dev/null 2>&1; then
  # Excludes: the unanchored .git/node_modules/.next skip any nested checkout's
  # deps and build output; /.claude is agent config, never a build input;
  # /package-lock.json is left out so the mirror does not add a second
  # lockfile — Next walks up and picks the top-most one
  # (next/dist/lib/find-root.js), so the inferred root is the same as an
  # in-place build's ($ROOT in a normal checkout) and a copy would only add a
  # "multiple lockfiles" warning. rsync never --deletes excluded destination
  # paths, which keeps the mirror's .next/cache between runs. node_modules is
  # rm'd and re-linked (not `ln -sfn`) because -sfn onto a real directory
  # silently creates node_modules/node_modules instead.
  if [ ! -f "$ROOT/package.json" ]; then
    fail "cannot locate repo root ($ROOT) — refusing to mirror-build"
  else
    if { mkdir -p "$MIRROR" &&
         rsync -a --delete --exclude=.git --exclude=node_modules --exclude=.next \
           --exclude=/.claude --exclude=/package-lock.json "$ROOT/" "$MIRROR/" &&
         rm -rf "$MIRROR/node_modules" &&
         ln -s "$ROOT/node_modules" "$MIRROR/node_modules"; } >"$TMPD/rsync.out" 2>&1; then
      if (cd "$MIRROR" && npm run build) >"$TMPD/build.out" 2>&1; then
        pass "npm run build (in .next/cache/gate mirror — no BUILD_ID/manifests/chunks written to .next)"
      else
        fail "npm run build FAILED — see $TMPD/build.out"
        tail -30 "$TMPD/build.out" | sed 's/^/      /'
      fi
    else
      fail "mirror sync into .next/cache/gate FAILED — see $TMPD/rsync.out"
      tail -20 "$TMPD/rsync.out" | sed 's/^/      /'
    fi
  fi
else
  warn "rsync not found — building IN PLACE; this breaks a running \`next dev\` (recover: stop next dev, rm -rf .next, npm run dev)"
  if npm run build >$TMPD/build.out 2>&1; then
    pass "npm run build"
  else
    fail "npm run build FAILED — see $TMPD/build.out"
    tail -30 $TMPD/build.out | sed 's/^/      /'
  fi
fi

# ---------- RETRO hygiene (nudge only, not a gate) ----------
if [ -f "RETRO.md" ]; then
  ENTRIES=$(grep -cE '^\- \[[0-9]{4}-[0-9]{2}-[0-9]{2}\]' RETRO.md 2>/dev/null || echo 0)
  [ "$ENTRIES" -ge 5 ] 2>/dev/null && warn "RETRO.md has $ENTRIES entries — worth a review pass."
fi

echo
if [ "$FAILS" -gt 0 ]; then
  echo "==> $FAILS gate failure(s). The design-token and content-publish locks are [NEVER-SKIP] — only a named entry in $OVERRIDES clears either, not re-running with different flags."
  [ "$HARD" -eq 1 ] && exit 1
  echo "    (soft mode: fix before committing; --hard mirrors what the pre-commit hook enforces)"
else
  echo "==> All gates green."
fi
exit 0
