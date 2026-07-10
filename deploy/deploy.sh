#!/usr/bin/env bash
# deploy/deploy.sh
# Manual deploy: build on this machine, rsync to VPS.
#
# Usage:
#   bash deploy/deploy.sh           # full: git pull → install → build → rsync
#   bash deploy/deploy.sh --no-pull # skip git pull (already on latest commit)
#
# Prerequisites:
#   - deploy/.env exists (VPS_HOST, VPS_WWW)
#   - This machine can SSH to VPS (key auth recommended)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# ── Load secrets ──────────────────────────────────────────
if [ -f "$SCRIPT_DIR/.env" ]; then
  source "$SCRIPT_DIR/.env"
else
  echo "[ERROR] deploy/.env not found. Create it from deploy/.env.example:"
  echo "  cp deploy/.env.example deploy/.env"
  echo "  # then edit with real values"
  exit 1
fi

: "${VPS_HOST:?Missing VPS_HOST in deploy/.env}"
: "${VPS_WWW:?Missing VPS_WWW in deploy/.env}"
: "${VPS_PORT:=22222}"   # default, override in .env if different

log() { echo ">>> $(date '+%H:%M:%S') $*"; }

# ── 1. Git pull ────────────────────────────────────────────
SKIP_PULL=false
[[ "${1:-}" == "--no-pull" ]] && SKIP_PULL=true

if [ "$SKIP_PULL" = false ]; then
  log "Pulling latest from origin/main..."
  cd "$PROJECT_DIR"
  git checkout main 2>/dev/null || true
  git pull origin main
else
  log "Skipping git pull (--no-pull)"
fi

# ── 2. Install & Build ─────────────────────────────────────
log "Installing dependencies..."
cd "$PROJECT_DIR"
pnpm install --frozen-lockfile

log "Building all apps..."
pnpm build

# ── 3. Rsync to VPS ────────────────────────────────────────
log "Deploying to VPS ($VPS_HOST:$VPS_PORT)..."

SSH_CMD="ssh -p $VPS_PORT -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10"
RSYNC_CMD="rsync -az --delete -e $SSH_CMD"

$SSH_CMD "$VPS_HOST" "mkdir -p $VPS_WWW"

log "  homepage → root"
$RSYNC_CMD \
  --exclude='README.md' --exclude='README.zh-CN.md' \
  "$PROJECT_DIR/apps/homepage/" "$VPS_HOST:$VPS_WWW/"

log "  monitor-choice"
$RSYNC_CMD \
  --exclude='README.md' --exclude='README.zh-CN.md' \
  "$PROJECT_DIR/apps/monitor-choice/" "$VPS_HOST:$VPS_WWW/monitor-choice/"

for app in rate-lens chrono-sphere sane-units; do
  log "  $app"
  $RSYNC_CMD \
    "$PROJECT_DIR/apps/$app/dist/" "$VPS_HOST:$VPS_WWW/$app/"
done

echo
log "Done → https://tools.s-ark.xyz"
