#!/usr/bin/env bash
# Nightly database backup: /root/backups/gk-YYYY-MM-DD.sql.gz, last 14 kept.
# Restore: gunzip -c FILE | docker compose -f /opt/gk-parfum-web/deploy/docker-compose.yml exec -T postgres psql -U gk -d gk_medusa
set -euo pipefail
mkdir -p /root/backups
cd /opt/gk-parfum-web/deploy
F=/root/backups/gk-$(date +%F).sql.gz
docker compose exec -T postgres pg_dump -U gk -d gk_medusa --no-owner | gzip > "$F.tmp" && mv "$F.tmp" "$F"
ls -1t /root/backups/gk-*.sql.gz | tail -n +15 | xargs -r rm -f
echo "$(date -Is) backup $F ($(du -h "$F" | cut -f1))"
