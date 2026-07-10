#!/usr/bin/env bash
# Manual production deploy: verify main, build locally, then rsync static files.
#
# Usage:
#   bash deploy/deploy.sh
#   bash deploy/deploy.sh --no-pull  # use the existing origin/main ref
#
# This script never changes branches. Run it only from a clean, synchronized
# main checkout after creating deploy/.env from deploy/.env.example.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

log() { echo ">>> $(date '+%H:%M:%S') $*"; }
die() {
  echo "[ERROR] $*" >&2
  exit 1
}

usage() {
  echo "Usage: bash deploy/deploy.sh [--no-pull]" >&2
}

SKIP_PULL=false
case "${1:-}" in
  "") ;;
  --no-pull) SKIP_PULL=true ;;
  *)
    usage
    exit 2
    ;;
esac

[[ $# -le 1 ]] || {
  usage
  exit 2
}

# ── 1. Git release preflight ──────────────────────────────
cd "$PROJECT_DIR"

CURRENT_BRANCH="$(git symbolic-ref --short -q HEAD || true)"
[[ "$CURRENT_BRANCH" == "main" ]] || \
  die "Production deploys must run from main (current: ${CURRENT_BRANCH:-detached HEAD})."

[[ -z "$(git status --porcelain --untracked-files=normal)" ]] || \
  die "Working tree is not clean. Commit or remove local changes before deploying."

if [[ "$SKIP_PULL" == false ]]; then
  log "Fast-forwarding main from origin/main..."
  git pull --ff-only origin main
else
  log "Skipping network update; verifying against the existing origin/main ref..."
fi

git rev-parse --verify origin/main >/dev/null 2>&1 || \
  die "origin/main is unavailable. Run without --no-pull to refresh it."

[[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/main)" ]] || \
  die "Local main does not exactly match origin/main. Refusing to deploy."

[[ -z "$(git status --porcelain --untracked-files=normal)" ]] || \
  die "Working tree changed during preflight. Refusing to deploy."

# ── 2. Load private deployment values ─────────────────────
[[ -f "$SCRIPT_DIR/.env" ]] || \
  die "deploy/.env not found. Copy deploy/.env.example and replace every placeholder."

# shellcheck source=/dev/null
source "$SCRIPT_DIR/.env"

: "${VPS_HOST:?Missing VPS_HOST in deploy/.env}"
: "${VPS_PORT:?Missing VPS_PORT in deploy/.env}"
: "${VPS_WWW:?Missing VPS_WWW in deploy/.env}"

if [[ ! "$VPS_PORT" =~ ^[0-9]+$ ]] || ((VPS_PORT < 1 || VPS_PORT > 65535)); then
  die "VPS_PORT must be an integer between 1 and 65535."
fi
[[ "$VPS_HOST" =~ ^[A-Za-z0-9._@:-]+$ ]] || \
  die "VPS_HOST contains unsupported characters. Use an SSH alias or user@host."
[[ "$VPS_WWW" =~ ^(/|~/)[A-Za-z0-9._/-]+$ ]] || \
  die "VPS_WWW must be an absolute or home-relative path without whitespace."

# ── 3. Install and build ───────────────────────────────────
log "Installing locked dependencies..."
pnpm install --frozen-lockfile

log "Building all applications..."
pnpm build

# ── 4. Sync static artifacts ───────────────────────────────
log "Deploying verified static artifacts..."

SSH_ARGS=(
  -p "$VPS_PORT"
  -o StrictHostKeyChecking=accept-new
  -o ConnectTimeout=10
)
export RSYNC_RSH="ssh -p ${VPS_PORT} -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10"
RSYNC_ARGS=(-az --delete --no-motd)

ssh "${SSH_ARGS[@]}" "$VPS_HOST" mkdir -p -- "$VPS_WWW"

log "  homepage → root"
rsync "${RSYNC_ARGS[@]}" \
  "$PROJECT_DIR/apps/homepage/dist/" "$VPS_HOST:$VPS_WWW/"

log "  monitor-choice"
rsync "${RSYNC_ARGS[@]}" \
  --exclude='README.md' --exclude='README.zh-CN.md' \
  "$PROJECT_DIR/apps/monitor-choice/" "$VPS_HOST:$VPS_WWW/monitor-choice/"

for app in rate-lens chrono-sphere sane-units; do
  log "  $app"
  rsync "${RSYNC_ARGS[@]}" \
    "$PROJECT_DIR/apps/$app/dist/" "$VPS_HOST:$VPS_WWW/$app/"
done

log "Done → https://tools.s-ark.xyz"
