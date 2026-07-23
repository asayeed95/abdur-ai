#!/usr/bin/env bash
# apply-domain.sh <slug> — attach <slug>.abdur.ai to the deployed app.
# THE FOUNDER FLIP: run this only after the application-microsite class is
# pre-authorized (floor-3c) — i.e. after the APPLY-FORGE PR is founder-merged.
# Requires: CLOUDFLARE_API_TOKEN (Doppler; DNS write on abdur.ai),
#           vercel CLI authenticated + project linked.
set -euo pipefail

SLUG="${1:?usage: apply-domain.sh <slug>}"
[[ "$SLUG" =~ ^[a-z0-9-]+$ ]] || { echo "invalid slug"; exit 1; }
[ -f "content/applications/${SLUG}.json" ] || { echo "no config for ${SLUG} — author it first"; exit 1; }
: "${CLOUDFLARE_API_TOKEN:?set via Doppler — never inline}"

ZONE_ID="$(curl -fsS -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones?name=abdur.ai" | node -pe 'JSON.parse(require("fs").readFileSync(0)).result[0].id')"

# CNAME <slug>.abdur.ai → Vercel edge (DNS-only; Vercel terminates TLS).
# Idempotent: a re-run after a partial failure skips an existing record
# instead of dying on Cloudflare error 81057 (review F9).
EXISTING="$(curl -fsS -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=CNAME&name=${SLUG}.abdur.ai" \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).result.length')"
if [ "$EXISTING" = "0" ]; then
  curl -fsS -X POST -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json" \
    "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
    --data "{\"type\":\"CNAME\",\"name\":\"${SLUG}\",\"content\":\"cname.vercel-dns.com\",\"proxied\":false,\"ttl\":300}" \
    >/dev/null && echo "✓ DNS: ${SLUG}.abdur.ai → cname.vercel-dns.com"
else
  echo "✓ DNS: ${SLUG}.abdur.ai already exists — skipping create"
fi

npx vercel domains add "${SLUG}.abdur.ai" >/dev/null && echo "✓ Vercel: domain attached"

echo "Verify: curl -sI https://${SLUG}.abdur.ai | head -1   (allow a minute for DNS + cert)"
