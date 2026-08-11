#!/bin/bash
# capture-repo-events.sh — Phase 1 inbound delegation (see ../repo-delegation/README.md).
#
# Turns real commits across watched repos into normalized, permanent
# content/sources/repo-events/<repo>-<sha>-<slug>.md records, cursor-tracked per repo so
# nothing is re-captured. This is the INBOUND half of "one inbox, multiple outbound":
# every watched repo's real work lands in this shared inbox; brain.sh + hands-scheduler.sh
# still own OUTBOUND (drafting + Blotato fan-out per project).
#
# Local-first by design — matches the existing architecture principle (Mac-mini owns repo
# truth). No webhook, no Pipedream dependency, no new secret. Just local git.
#
# DRY_RUN-safe by default (matches hands_scheduler.py's convention) — run it, read the output,
# THEN decide to actually write.
#
# Usage:
#   ./capture-repo-events.sh                  # all watched repos, prints what WOULD be written
#   DRY_RUN=0 ./capture-repo-events.sh         # actually write source files + advance cursors
#   ./capture-repo-events.sh dockerfile-ai     # single repo
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
CONTENT_DIR="$(cd "$DIR/../.." && pwd)"        # .../abdur-ai/content
SOURCES_DIR="$CONTENT_DIR/sources/repo-events"
CURSOR_DIR="$DIR/.cursors"
mkdir -p "$SOURCES_DIR" "$CURSOR_DIR"

DRY_RUN="${DRY_RUN:-1}"   # default SAFE: print only, touch nothing

REPO_KEYS="mnemix abdur-ai dockerfile-ai heycli mnemix-learning"

repo_path() {
  case "$1" in
    mnemix)           echo "$HOME/projects/mnemix" ;;
    abdur-ai)         echo "$HOME/projects/abdur-ai" ;;
    dockerfile-ai)    echo "$HOME/projects/dockerfile-ai" ;;
    heycli)           echo "$HOME/projects/remotecli" ;;
    mnemix-learning)  echo "$HOME/projects/mnemix-learning" ;;
    *)                echo "" ;;
  esac
}

TARGETS="$REPO_KEYS"
[ "${1:-}" != "" ] && TARGETS="$1"

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g' | cut -c1-60
}

# Heuristic for "worth a source record": conventional-commit types (feat/fix/gate/freeze/
# savepoint, requiring "(" or ":" right after so "fixture: ..." can't false-positive on "fix"),
# OR any ticket/decision-tag prefix ([A-Z]{2,}- : covers BE-VERIFY-002, DEC-PAYWALL-001,
# SPEC-FIX-001, EVAL-CORPUS-001, PLAN-CANON-001, AGE-294 — one pattern instead of enumerating
# every repo's tag vocabulary), OR phase labels (P1-, P2-, used in the heycli repo).
# Deliberately excludes bare chore/deps/style/docs/lint-only and untagged free-text commits to
# keep the inbox signal, not noise — over-capturing real fixes/features/decisions is fine
# (cheap markdown files, filtered later by human judgment at DRAFT); a genuinely significant
# but untagged commit (rare — seen once in mnemix-learning's history) won't get a structured
# record here, but it's still visible to brain.sh's own raw `git log` context, so it isn't
# fully invisible to drafting — just not in the permanent structured trail. Tune as repos'
# commit conventions evolve.
WORTHY_RE='^((feat|fix|gate|freeze|savepoint)(\(|:)|[A-Z]{2,}-|P[0-9]+[-.])'

for key in $TARGETS; do
  REPO="$(repo_path "$key")"
  if [ -z "$REPO" ]; then
    echo "unknown repo key: $key (known: $REPO_KEYS)"; exit 1
  fi
  if [ ! -d "$REPO/.git" ]; then
    echo "skip $key: no git repo at $REPO"
    continue
  fi

  # --- TRUTH GATE: capture from the repo's LOCAL main branch, never from HEAD. ---
  # 4 of 5 repos sit on feature branches day-to-day (worktrees, agent branches). HEAD there
  # is UNMERGED work — recording it as a permanent "real shipped work" source would let a
  # draft claim something that never landed. Merged / deployed / verified are separate states
  # (workspace CLAUDE.md); this inbox only ever ingests MERGED-to-main commits. If local main
  # is behind origin, we capture late, never wrong. (No fetch here by design: local-first,
  # no network, no creds.)
  REF=""
  for cand in main master; do
    if git -C "$REPO" rev-parse --verify -q "$cand" >/dev/null; then REF="$cand"; break; fi
  done
  if [ -z "$REF" ]; then
    echo "=== $key ($REPO): SKIP — no local main/master branch found ==="
    continue
  fi

  CURSOR_FILE="$CURSOR_DIR/$key.sha"
  SINCE=""
  [ -f "$CURSOR_FILE" ] && SINCE="$(cat "$CURSOR_FILE")"

  echo "=== $key ($REPO) ref=$REF since=${SINCE:-<none: first run, last 15>} ==="

  # %H (full sha, later cut to a FIXED 7 chars for filenames) + %s. Never --oneline: its
  # abbreviation length is config/repo-dependent, and filename stability is what makes the
  # already-captured dedup check work across machines and time.
  if [ -z "$SINCE" ]; then
    COMMITS="$(git -C "$REPO" log --format='%H %s' -15 "$REF")"
  else
    # A vanished cursor sha (rebase/force-push on main, pruned clone) must NOT read as
    # "nothing new" — that would stall this repo's capture silently and forever (SOL R13:
    # state discontinuity invalidates the receipt). Detect, warn, re-baseline to last 15.
    if git -C "$REPO" cat-file -e "$SINCE^{commit}" 2>/dev/null; then
      COMMITS="$(git -C "$REPO" log --format='%H %s' "$SINCE..$REF")"
    else
      echo "  WARN: cursor sha $SINCE no longer exists in $key (rebase/force-push?) — re-baselining to last 15 on $REF"
      COMMITS="$(git -C "$REPO" log --format='%H %s' -15 "$REF")"
    fi
  fi

  if [ -z "$COMMITS" ]; then
    echo "  (nothing new)"
    continue
  fi

  NEWEST_SHA="$(git -C "$REPO" rev-parse "$REF")"
  WROTE_COUNT=0

  while IFS= read -r line; do
    [ -z "$line" ] && continue
    fullsha="${line%% *}"
    sha="$(echo "$fullsha" | cut -c1-7)"   # fixed 7-char filename key, independent of git config
    msg="${line#* }"

    if ! echo "$msg" | grep -qE "$WORTHY_RE"; then
      echo "  skip (not worthy): $sha $msg"
      continue
    fi

    slug="$(slugify "$msg")"
    fname="$key-$sha-$slug.md"
    fpath="$SOURCES_DIR/$fname"

    if [ -f "$fpath" ]; then
      echo "  skip (already captured): $fname"
      continue
    fi

    if [ "$DRY_RUN" = "1" ]; then
      # True dry run: no filesystem write of any kind, not even a temp file.
      echo "  WOULD WRITE: $fname"
      continue
    fi

    AUTHOR_DATE="$(git -C "$REPO" log -1 --format='%an, %ad' --date=short "$fullsha")"
    BODY="$(git -C "$REPO" log -1 --format='%b' "$fullsha")"

    {
      echo "# $key $sha — $msg"
      echo "**Receipts:** \`git -C $key log -1 $sha\` (merged to $REF) — $AUTHOR_DATE"
      if [ -n "$BODY" ]; then
        echo
        echo "$BODY"
      fi
      echo
      echo "**Used by:** _(none yet — pending draft)_"
    } > "$fpath"
    echo "  wrote: $fname"
    WROTE_COUNT=$((WROTE_COUNT + 1))
  done <<EOF_COMMITS
$COMMITS
EOF_COMMITS

  if [ "$DRY_RUN" != "1" ]; then
    echo "$NEWEST_SHA" > "$CURSOR_FILE"
    echo "  cursor advanced -> $NEWEST_SHA ($WROTE_COUNT new source record(s))"
  fi
done

if [ "$DRY_RUN" = "1" ]; then
  echo
  echo "(DRY_RUN=1 — nothing written, no cursors advanced. Re-run with DRY_RUN=0 to commit.)"
fi
