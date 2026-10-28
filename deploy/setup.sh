#!/usr/bin/env bash
# GK Parfum — first-time server setup (Ubuntu 24.04/26.04, run as root).
#
#   curl -fsSL https://raw.githubusercontent.com/sshheerraallii/gk-parfum-web/main/deploy/setup.sh | bash -s -- <domain> <admin-email>
#
# Installs Docker (if missing), a firewall and swap, gets the code, creates the secrets, starts the database,
# backend/admin, shop and HTTPS, then sets up automatic updates from GitHub and nightly database backups.
# Safe to run again: it keeps existing secrets and data.
set -euo pipefail
# (when piped from curl, every command that could read stdin gets </dev/null so it can't swallow the rest of this script)

DOMAIN="${1:-}"
ADMIN_EMAIL="${2:-}"
REPO="https://github.com/sshheerraallii/gk-parfum-web.git"
DIR=/opt/gk-parfum-web
ENVF="$DIR/deploy/.env"

if [ -z "$DOMAIN" ] || [ -z "$ADMIN_EMAIL" ]; then
  echo "Usage: bash setup.sh <domain> <admin-email>   e.g. bash setup.sh gkparfum.co.uk owner@gkparfum.co.uk"; exit 1
fi
DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN#www.}"; DOMAIN="${DOMAIN%/}"
say() { printf '\n\033[1;33m== %s\033[0m\n' "$*"; }

say "System packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl ufw cron openssl ca-certificates >/dev/null

if ! command -v docker >/dev/null 2>&1; then
  say "Installing Docker"
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker >/dev/null 2>&1 || true
docker compose version >/dev/null

say "Firewall (SSH, web)"
ufw allow OpenSSH >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

if ! swapon --show | grep -q .; then
  say "4 GB swap (keeps builds from running out of memory)"
  fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

say "Code"
if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only; else git clone --depth 50 "$REPO" "$DIR"; fi
cd "$DIR/deploy"

say "Settings"
rand() { openssl rand -hex "$1"; }
if [ ! -f "$ENVF" ]; then
  ADMIN_PASSWORD="Gk-$(openssl rand -base64 12 | tr -dc 'A-Za-z0-9' | head -c 14)"
  cat > "$ENVF" <<ENV
SITE_DOMAIN=$DOMAIN
ADMIN_DOMAIN=admin.$DOMAIN
POSTGRES_PASSWORD=$(rand 24)
JWT_SECRET=$(rand 32)
COOKIE_SECRET=$(rand 32)
AUTH_MFA_ENCRYPTION_KEY=$(rand 32)
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
# filled in automatically after the first start
MEDUSA_PUBLISHABLE_KEY=
# emails (resend.com) — add the key, then run: bash $DIR/deploy/update.sh --force
RESEND_API_KEY=
EMAIL_FROM="GK Parfum <sales@$DOMAIN>"
OWNER_EMAIL=$ADMIN_EMAIL
# payments — add the live keys later, then run: bash $DIR/deploy/update.sh --force
STRIPE_PUBLISHABLE_KEY=
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=
ENV
  chmod 600 "$ENVF"
  echo "Created $ENVF"
else
  echo "Keeping existing $ENVF"
fi
set -a; . "$ENVF"; set +a

say "Database, backend + admin, HTTPS (first build takes ~5–10 minutes)"
mkdir -p /opt/caddy-sites
docker compose up -d --build postgres redis backend caddy </dev/null
echo -n "Waiting for the backend"
for i in $(seq 1 120); do
  if [ "$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q backend)" 2>/dev/null)" = "healthy" ]; then echo " — ready"; break; fi
  echo -n "."; sleep 5
  [ "$i" = 120 ] && { echo; echo "Backend didn't start. Logs:"; docker compose logs --tail 80 backend </dev/null; exit 1; }
done

if [ -z "${MEDUSA_PUBLISHABLE_KEY:-}" ]; then
  PK=$(docker compose exec -T postgres psql -U gk -d gk_medusa -Atc "select token from api_key where type='publishable' and revoked_at is null order by created_at limit 1" </dev/null)
  [ -n "$PK" ] || { echo "No publishable key found"; exit 1; }
  sed -i "s|^MEDUSA_PUBLISHABLE_KEY=.*|MEDUSA_PUBLISHABLE_KEY=$PK|" "$ENVF"
  export MEDUSA_PUBLISHABLE_KEY="$PK"
fi

say "Shop (building…)"
docker compose up -d --build storefront </dev/null

say "Automatic updates + nightly backups"
chmod +x "$DIR/deploy/update.sh" "$DIR/deploy/backup.sh"
cat > /etc/cron.d/gk-parfum <<CRON
# pull from GitHub and redeploy when something changed
*/3 * * * * root $DIR/deploy/update.sh >> /var/log/gk-update.log 2>&1
# database backup every night, last 14 kept in /root/backups
30 2 * * * root $DIR/deploy/backup.sh >> /var/log/gk-backup.log 2>&1
CRON
git -C "$DIR" rev-parse HEAD > "$DIR/deploy/.deployed"
"$DIR/deploy/backup.sh" </dev/null >/dev/null 2>&1 || true

IP=$(curl -fsS -4 https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
cat <<DONE

==================================================================
 GK Parfum is running.

 Shop:   https://$DOMAIN
 Admin:  https://admin.$DOMAIN
         login  $ADMIN_EMAIL
         pass   $(grep '^ADMIN_PASSWORD=' "$ENVF" | cut -d= -f2)   (change it after first login)

 DNS needed (A records → $IP):  @   www   admin
 HTTPS switches on by itself a minute after DNS points here.

 Settings file: $ENVF
 Logs:          cd $DIR/deploy && docker compose logs -f backend
==================================================================
DONE
