#!/usr/bin/env bash
# Sets a new password for an admin login — no email needed.
#   bash /opt/gk-parfum-web/deploy/set-admin-password.sh [email]
# You're asked for the new password (it isn't shown or saved in the shell history).
set -euo pipefail
cd "$(dirname "$0")"
EMAIL="${1:-$(grep '^ADMIN_EMAIL=' .env | cut -d= -f2)}"
[ -n "$EMAIL" ] || { echo "Usage: $0 <admin-email>"; exit 1; }

read -rsp "New password for $EMAIL (min 8 characters): " PW; echo
read -rsp "Type it again: " PW2; echo
[ "$PW" = "$PW2" ] || { echo "Passwords don't match."; exit 1; }
[ ${#PW} -ge 8 ] || { echo "Too short — use at least 8 characters."; exit 1; }

# hash it exactly like Medusa does (scrypt, logN 15 r 8 p 1), inside the backend container
HASH=$(docker compose exec -T -e PW="$PW" backend node -e '
  const { createRequire } = require("module");
  const req = createRequire(require.resolve("@medusajs/auth-emailpass"));
  req("scrypt-kdf").kdf(process.env.PW, { logN: 15, r: 8, p: 1 }).then((b) => process.stdout.write(b.toString("base64")));
' </dev/null)
[ -n "$HASH" ] || { echo "Couldn't hash the password."; exit 1; }

N=$(docker compose exec -T postgres psql -U gk -d gk_medusa -qAtc "
  update provider_identity
     set provider_metadata = jsonb_set(coalesce(provider_metadata, '{}'::jsonb), '{password}', to_jsonb('$HASH'::text))
   where provider = 'emailpass' and lower(entity_id) = lower('$EMAIL') and deleted_at is null
  returning id;" </dev/null | grep -c . || true)

if [ "$N" = "1" ]; then
  echo "Done — log in at the admin with $EMAIL and the new password."
else
  echo "No admin login found for $EMAIL. Logins on this server:"
  docker compose exec -T postgres psql -U gk -d gk_medusa -Atc "select entity_id from provider_identity where provider='emailpass' and deleted_at is null" </dev/null
  exit 1
fi
