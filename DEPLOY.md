# Deploying GK Parfum

Production runs on one VPS with Docker Compose (`deploy/`): Caddy (HTTPS) → Next.js shop + Medusa backend/admin, PostgreSQL 16, Redis 7.
Shop: `https://<domain>` · Admin + API: `https://admin.<domain>` (admin at `/app`).

First-time setup on a fresh Ubuntu server (as root), after pointing DNS `@`, `www`, `admin` at it:
```bash
curl -fsSL https://raw.githubusercontent.com/sshheerraallii/gk-parfum-web/main/deploy/setup.sh | bash -s -- <domain> <admin-email>
```

## Launch switch (payments)

`deploy/shop.sh` keeps test and live keys side by side in `deploy/.env` and flips the shop between modes:

```bash
bash /opt/gk-parfum-web/deploy/shop.sh status      # mode + which keys are stored (masked)
bash /opt/gk-parfum-web/deploy/shop.sh keys        # store Stripe test/live or PayPal sandbox/live keys (hidden input)
bash /opt/gk-parfum-web/deploy/shop.sh prelaunch   # public site, checkout closed; testers use the printed /preview?key=… link
bash /opt/gk-parfum-web/deploy/shop.sh live        # go live: live keys, checkout open (asks you to type LIVE)
```

- **prelaunch**: test keys active, `SHOP_MODE=prelaunch`. The backend refuses payments unless the bag carries `PREVIEW_KEY`, which a browser gets by opening `https://<domain>/preview?key=…` once. Everyone else sees "launching very soon".
- **live**: live Stripe (+ live PayPal if stored) active, `SHOP_MODE=live`, checkout open.
- Stripe webhook (test and live each have their own signing secret): `https://admin.<domain>/hooks/payment/stripe_stripe`, events `payment_intent.succeeded`, `payment_intent.amount_capturable_updated`, `payment_intent.payment_failed`, `payment_intent.partially_funded`.
- PayPal: credentials from developer.paypal.com → Apps & Credentials (Sandbox and Live apps). No webhook needed — the payment is captured when the order is placed.

## 1. How changes go live (yes — git push deploys to the VPS)

1. Make the change in the repo (Claude does this in a session), commit, **push to `main`**.
2. On the server, cron runs `deploy/update.sh` **every 3 minutes**: if GitHub `main` has a new commit it does `git reset --hard origin/main`, rebuilds and restarts — backend first (database migrations run automatically on start), then the shop. Typical rebuild: 1–3 minutes (first build ~10).
3. So a push is live in roughly **3–6 minutes**. Log: `/var/log/gk-update.log`.

Force a rebuild now (e.g. after editing `.env`):
```bash
bash /opt/gk-parfum-web/deploy/update.sh --force
```

**Never edit code directly on the server** — the next update resets it to GitHub. Only `deploy/.env` is server-only.

Database changes to existing data: add a one-off script in `backend/apps/backend/src/migration-scripts/` (named `z-gk-revisions-N.ts`, runs once, recorded in `script_migrations`). Schema changes to custom modules: `npx medusa db:generate <module>`.

---

## 2. Server scripts (in `/opt/gk-parfum-web/deploy/`)

| Script | What it does |
|---|---|
| `setup.sh <domain> <admin-email>` | First-time install: Docker, firewall (22/80/443), 4 GB swap, clone, secrets, start everything, cron for updates + backups. Safe to re-run (keeps `.env` and data). One-liner: `curl -fsSL https://raw.githubusercontent.com/sshheerraallii/gk-parfum-web/main/deploy/setup.sh \| bash -s -- gkparfum.co.uk info.gkparfum@gmail.com` |
| `update.sh [--force]` | Pull + redeploy (cron, every 3 min) |
| `backup.sh` | `pg_dump` → `/root/backups/gk-YYYY-MM-DD.sql.gz`, keeps 14 (cron, 02:30 nightly) |
| `set-admin-password.sh [email]` | Set a new admin password without email (asks twice, hidden) |

Useful commands (run from `/opt/gk-parfum-web/deploy`):
```bash
docker ps --format 'table {{.Names}}\t{{.Status}}'      # all 5 should be Up / healthy
docker compose logs --tail 50 backend                    # backend errors
docker compose logs --tail 20 caddy                      # HTTPS certificate status
docker compose restart caddy                             # retry certificates now (after DNS changes)
nano .env  →  bash update.sh --force                     # change settings / keys
```
Restore a backup:
```bash
gunzip -c /root/backups/gk-2026-10-23.sql.gz | docker compose exec -T postgres psql -U gk -d gk_medusa
```

### `deploy/.env` keys
`SITE_DOMAIN`, `ADMIN_DOMAIN`, `POSTGRES_PASSWORD`, `JWT_SECRET`, `COOKIE_SECRET`, `AUTH_MFA_ENCRYPTION_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (first-boot only), `MEDUSA_PUBLISHABLE_KEY` (auto-filled), `STRIPE_PUBLISHABLE_KEY`, `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`. Optional S3 storage: `S3_BUCKET`, `S3_FILE_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_ENDPOINT`.

### Gotchas already hit
- Medusa forces SSL for any non-localhost database → the compose `DATABASE_URL` ends `?sslmode=disable`.
- When piping a script from curl, any `docker compose exec` must get `</dev/null` or it swallows the rest of the script.
- Medusa admin cookie is Secure; works behind Caddy (HTTPS). Locally, prod mode needs header `X-Forwarded-Proto: https`.
- "Forgot password" fails until email (Resend) is added — use `set-admin-password.sh`.

---
