#!/usr/bin/env bash
# sola-is auto-deploy: pull main and rebuild if origin/main advanced.
# Called by systemd timer sola-is-deploy.timer every minute.
set -euo pipefail

REPO=/home/pajp/stacks/sola-is
LOG=/home/pajp/stacks/sola-is/deploy.log

cd "$REPO"

git fetch --quiet origin main
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

{
  echo "=== $(date -Is) — updating $LOCAL → $REMOTE ==="
  git pull --ff-only origin main
  docker-compose up -d --build
  echo "=== done ==="
} >> "$LOG" 2>&1
