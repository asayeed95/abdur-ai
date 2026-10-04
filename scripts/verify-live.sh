#!/usr/bin/env bash
# verify-live.sh — is a published article actually LIVE on production? (AGE-2595 / AGE-2884)
#
# "Merged" is not "deployed" and "deployed" is not "verified". After a content PR
# merges, run this with the post's slug. It checks the PUBLIC URL, not any
# provider API, and prints receipt lines you can paste into Linear.
#
#   scripts/verify-live.sh <slug>                  one check, exit 0 only if every check passes
#   scripts/verify-live.sh <slug> --wait <minutes> keep checking every 30 s until live or time runs out
#
# Exit codes: 0 live and verified, 1 reachable but a check failed, 2 not live (404/5xx/unreachable).
# When it is not live, look for the Vercel bot comment on the merged PR: the free plan
# rejects production deploys past 100/day ("api-deployments-free-per-day", AGE-2595).
set -uo pipefail

SLUG="${1:-}"; [ -n "$SLUG" ] || { echo "usage: $0 <slug> [--wait <minutes>]" >&2; exit 64; }
WAIT_MIN=0
[ "${2:-}" = "--wait" ] && WAIT_MIN="${3:-0}"
BASE="${SITE_URL:-https://abdur.ai}"
URL="$BASE/writing/$SLUG"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/verify-live.XXXXXX")"; trap 'rm -rf "$TMP"' EXIT

stamp() { date -u +%FT%TZ; }
# Prints the HTTP status, or 000 if the transport failed twice (a reset is retried once).
fetch() {
  local c; c="$(curl -sS --max-time 30 -o "$1" -D "$1.hdr" -w '%{http_code}' "$2" 2>/dev/null)"
  if [ -z "$c" ] || [ "$c" = "000" ]; then sleep 2; c="$(curl -sS --max-time 30 -o "$1" -D "$1.hdr" -w '%{http_code}' "$2" 2>/dev/null)"; fi
  echo "${c:-000}"
}

check_once() {
  local plain bust code
  plain="$(fetch "$TMP/plain.html" "$URL")"
  bust="$(fetch "$TMP/bust.html" "$URL?cb=$(date +%s)")"
  echo "$(stamp) GET $URL -> $plain (cache-busted -> $bust)"
  if [ "$plain" != "200" ] || [ "$bust" != "200" ]; then
    echo "RESULT: NOT LIVE (HTTP $plain / $bust)"; return 2
  fi
  local html="$TMP/bust.html" fails=0
  ok()   { echo "  ok   $1"; }
  bad()  { echo "  FAIL $1"; fails=$((fails+1)); }

  grep -qi '^content-type: text/html' "$html.hdr" && ok "content-type text/html" || bad "content-type is not text/html"
  grep -q "<link rel=\"canonical\" href=\"$URL\"" "$html" && ok "canonical is $URL" || bad "canonical missing or different"
  [ "$(grep -o '<h1[ >]' "$html" | wc -l)" -eq 1 ] && ok "exactly one h1" || bad "h1 count is not 1"
  grep -q '"@type":"BlogPosting"' "$html" && ok "BlogPosting JSON-LD present" || bad "BlogPosting JSON-LD missing"
  grep -q 'name="description"' "$html" && ok "meta description present" || bad "meta description missing"
  if grep -q 'data-signup="post-end"' "$html" || grep -q 'GET THE NEXT POSTMORTEM' "$html"; then ok "newsletter signup present"; else bad "no newsletter signup on the article"; fi
  curl -sS --max-time 30 "$BASE/sitemap.xml" 2>/dev/null | grep -q "<loc>$URL</loc>" && ok "listed in sitemap.xml" || bad "not in sitemap.xml"
  curl -sS --max-time 30 "$BASE/writing/rss.xml" 2>/dev/null | grep -q "/writing/$SLUG" && ok "listed in /writing/rss.xml" || bad "not in /writing/rss.xml"
  echo "  body sha256 $(sha256sum "$html" | cut -d' ' -f1)"
  if [ "$fails" -eq 0 ]; then echo "RESULT: LIVE AND VERIFIED"; return 0; fi
  echo "RESULT: REACHABLE BUT $fails CHECK(S) FAILED"; return 1
}

deadline=$(( $(date +%s) + WAIT_MIN * 60 ))
while true; do
  check_once; rc=$?
  [ "$rc" -eq 0 ] && exit 0
  [ "$(date +%s)" -ge "$deadline" ] && { [ "$rc" -eq 2 ] && echo "Not live. If the merged PR carries a Vercel bot comment saying 'Resource is limited', production deploys are blocked by the plan cap (AGE-2595)."; exit "$rc"; }
  sleep 30
done
