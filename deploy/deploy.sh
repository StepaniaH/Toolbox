#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/.env" ]; then
  source "$SCRIPT_DIR/.env"
else
  echo "deploy/.env not found. See deploy/.env.example."
  exit 1
fi

echo "=== 1/4 Install dependencies ==="
pnpm install --frozen-lockfile

echo "=== 2/4 Build all apps ==="
pnpm build

echo "=== 3/4 Sync files to VPS ==="
ssh "$VPS_HOST" "mkdir -p $VPS_WWW"

# Homepage (static → root)
rsync -avz --delete apps/homepage/ "$VPS_HOST:$VPS_WWW/" \
  --exclude=README.md --exclude=README.zh-CN.md

# monitor-choice (static)
rsync -avz --delete apps/monitor-choice/ "$VPS_HOST:$VPS_WWW/monitor-choice/" \
  --exclude=README.md --exclude=README.zh-CN.md

# React apps (built dist/)
for app in rate-lens chrono-sphere sane-units; do
  echo "--- rsync $app ---"
  rsync -avz --delete "apps/$app/dist/" "$VPS_HOST:$VPS_WWW/$app/"
done

echo "=== 4/4 Deploy complete ==="
echo "Site: https://tools.s-ark.xyz"
echo ""
echo "First deploy or Caddy config change — run manually:"
echo "  cat deploy/Caddyfile.example | ssh $VPS_HOST \"cat >> $CADDY_CONFIG\""
echo "  ssh $VPS_HOST \"docker compose -f $CADDY_COMPOSE_DIR/docker-compose.yml restart\""