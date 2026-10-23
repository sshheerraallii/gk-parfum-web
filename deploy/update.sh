#!/usr/bin/env bash
# Redeploys when GitHub has new commits (run by cron every 3 minutes). "--force" rebuilds anyway,
# e.g. after editing deploy/.env.
set -euo pipefail
DIR=/opt/gk-parfum-web
cd "$DIR"
exec 9>/tmp/gk-update.lock
flock -n 9 || exit 0

git fetch -q origin main
NEW=$(git rev-parse origin/main)
OLD=$(cat deploy/.deployed 2>/dev/null || echo none)
if [ "$NEW" = "$OLD" ] && [ "${1:-}" != "--force" ]; then exit 0; fi

echo "$(date -Is) deploying $NEW"
git reset -q --hard "$NEW"
cd deploy
set -a; . ./.env; set +a
# backend first (runs any database updates), then the shop
docker compose up -d --build postgres redis backend caddy
docker compose up -d --build storefront
echo "$NEW" > .deployed
docker image prune -f >/dev/null
echo "$(date -Is) done"
