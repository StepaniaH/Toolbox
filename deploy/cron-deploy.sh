#!/usr/bin/env bash
# deploy/cron-deploy.sh
# Run on a build server (cron or manual) to pull latest, build, and rsync to VPS.
#
# Prerequisites:
#   - Build server has Tailscale connected and can reach VPS
#   - deploy/.env exists with VPS_HOST, VPS_WWW, etc.
#   - rsync + ssh available
#
# Usage:
#   bash deploy/cron-deploy.sh          # full: pull → build → rsync
#   bash deploy/cron-deploy.sh --pull   # skip git pull
#   bash deploy/cron-deploy.sh --build  # skip build (use existing dist/)
#
# Cron (every 30 min):
#   */30 * * * * bash /path/to/Toolbox/deploy/cron-deploy.sh >> /path/to/Toolbox/deploy/cron.log 2>&1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load secrets
if [ -f "$SCRIPT_DIR/.env" ]; then
  source "$SCRIPT_DIR/.env"
else
  echo "[ERROR] deploy/.env not found. Create it from deploy/.env.example."
  exit 1
fi

# Required env vars
: "${VPS_HOST:?Missing VPS_HOST}"
: "${VPS_WWW:?Missing VPS_WWW}"

SKIP_PULL=false
SKIP_BUILD=false
for arg in "$@"; do
  case "$arg" in
    --pull) SKIP_PULL=true ;;
    --build) SKIP_BUILD=true ;;
  esac
done

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# ── 1. Git pull ────────────────────────────────────────────
if [ "$SKIP_PULL" = false ]; then
  log "Pulling latest from origin/main..."
  cd "$PROJECT_DIR"
  git checkout main
  git pull origin main
fi

# ── 2. Install & Build ─────────────────────────────────────
if [ "$SKIP_BUILD" = false ]; then
  log "Installing dependencies..."
  cd "$PROJECT_DIR"
  pnpm install --frozen-lockfile

  log "Building all apps..."
  pnpm build
fi

# ── 3. Rsync to VPS ────────────────────────────────────────
log "Deploying to VPS..."

ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 \
  "$VPS_HOST" "mkdir -p $VPS_WWW"

# Homepage (static → root)
rsync -az --delete \
  --exclude='README.md' --exclude='README.zh-CN.md' \
  "$PROJECT_DIR/apps/homepage/" "$VPS_HOST:$VPS_WWW/"

# monitor-choice (static)
rsync -az --delete \
  --exclude='README.md' --exclude='README.zh-CN.md' \
  "$PROJECT_DIR/apps/monitor-choice/" "$VPS_HOST:$VPS_WWW/monitor-choice/"

# React apps (built dist/)
for app in rate-lens chrono-sphere sane-units; do
  log "  → $app"
  rsync -az --delete \
    "$PROJECT_DIR/apps/$app/dist/" "$VPS_HOST:$VPS_WWW/$app/"
done

log "Deploy complete → https://tools.s-ark.xyz"
