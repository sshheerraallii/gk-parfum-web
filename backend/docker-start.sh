#!/bin/sh
# Boots the GK Parfum backend inside its container.
set -e

# Database tables + first-time GK seed. Safe to run on every boot.
./node_modules/.bin/medusa db:migrate

# Optional: create the first admin login from env vars (ignored if it already exists).
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  ./node_modules/.bin/medusa user -e "$ADMIN_EMAIL" -p "$ADMIN_PASSWORD" >/dev/null 2>&1 \
    && echo "GK: admin user $ADMIN_EMAIL created" \
    || echo "GK: admin user $ADMIN_EMAIL already exists"
fi

# Run the binary directly (not via npx) to save ~70 MB of RAM on small free servers.
exec ./node_modules/.bin/medusa start
