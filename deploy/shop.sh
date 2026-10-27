#!/usr/bin/env bash
# GK Parfum — payment keys and the launch switch.
#
#   bash /opt/gk-parfum-web/deploy/shop.sh status       what's set up, which mode the shop is in
#   bash /opt/gk-parfum-web/deploy/shop.sh keys         store Stripe / PayPal keys (test or live) — asks, never shows secrets
#   bash /opt/gk-parfum-web/deploy/shop.sh prelaunch    shop public, checkout closed; testers use the preview link (test keys)
#   bash /opt/gk-parfum-web/deploy/shop.sh live         GO LIVE: live Stripe + PayPal keys, checkout open to everyone
#
# Keys are parked in deploy/.env as STRIPE_TEST_* / STRIPE_LIVE_* / PAYPAL_TEST_* / PAYPAL_LIVE_*;
# "prelaunch" and "live" copy the right set into the active STRIPE_* / PAYPAL_* settings and redeploy.
set -euo pipefail
DIR=${GK_DIR:-/opt/gk-parfum-web}
ENVF="$DIR/deploy/.env"
[ -f "$ENVF" ] || { echo "No $ENVF — run setup.sh first."; exit 1; }

get() { grep "^$1=" "$ENVF" | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
put() {
  local tmp
  tmp=$(mktemp)
  grep -v "^$1=" "$ENVF" > "$tmp" || true
  printf '%s=%s\n' "$1" "$2" >> "$tmp"
  cat "$tmp" > "$ENVF" && rm -f "$tmp"
  chmod 600 "$ENVF"
}
mask() { local v="$1"; [ -n "$v" ] && echo "${v:0:12}…" || echo "— not set —"; }
redeploy() {
  [ -n "${GK_NO_DEPLOY:-}" ] && { echo "(redeploy skipped)"; return; }
  echo "Redeploying (about 3–5 minutes)…"
  flock /tmp/gk-update.lock true
  bash "$DIR/deploy/update.sh" --force
}

# one-time: the keys entered before this script existed were the Stripe sandbox ones — park them as test keys
if [ -z "$(get STRIPE_TEST_API_KEY)" ] && [[ "$(get STRIPE_API_KEY)" == sk_test_* ]]; then
  put STRIPE_TEST_PUBLISHABLE_KEY "$(get STRIPE_PUBLISHABLE_KEY)"
  put STRIPE_TEST_API_KEY "$(get STRIPE_API_KEY)"
  put STRIPE_TEST_WEBHOOK_SECRET "$(get STRIPE_WEBHOOK_SECRET)"
fi

status() {
  echo "Shop mode:            $(get SHOP_MODE || true) ${SHOP_HINT:-}"
  echo "Active Stripe key:    $(mask "$(get STRIPE_PUBLISHABLE_KEY)")"
  echo "Active PayPal:        $(mask "$(get PAYPAL_CLIENT_ID)") ($(get PAYPAL_MODE || echo sandbox))"
  echo
  echo "Stripe TEST  pk / sk / whsec:  $(mask "$(get STRIPE_TEST_PUBLISHABLE_KEY)")  $(mask "$(get STRIPE_TEST_API_KEY)")  $(mask "$(get STRIPE_TEST_WEBHOOK_SECRET)")"
  echo "Stripe LIVE  pk / sk / whsec:  $(mask "$(get STRIPE_LIVE_PUBLISHABLE_KEY)")  $(mask "$(get STRIPE_LIVE_API_KEY)")  $(mask "$(get STRIPE_LIVE_WEBHOOK_SECRET)")"
  echo "PayPal TEST  id / secret:      $(mask "$(get PAYPAL_TEST_CLIENT_ID)")  $(mask "$(get PAYPAL_TEST_CLIENT_SECRET)")"
  echo "PayPal LIVE  id / secret:      $(mask "$(get PAYPAL_LIVE_CLIENT_ID)")  $(mask "$(get PAYPAL_LIVE_CLIENT_SECRET)")"
  local pk
  pk=$(get PREVIEW_KEY)
  [ -n "$pk" ] && echo && echo "Preview link (pre-launch testing): https://$(get SITE_DOMAIN)/preview?key=$pk"
}

ask() { # ask VAR "Prompt" secret?
  local v
  if [ "${3:-}" = secret ]; then read -rsp "$2: " v; echo; else read -rp "$2: " v; fi
  v=$(echo "$v" | tr -d '[:space:]')
  [ -n "$v" ] && put "$1" "$v" || echo "  (left unchanged)"
}

keys() {
  echo "Which keys? 1) Stripe TEST  2) Stripe LIVE  3) PayPal SANDBOX  4) PayPal LIVE"
  read -rp "Choose 1-4: " c
  case "$c" in
    1) ask STRIPE_TEST_PUBLISHABLE_KEY "Stripe TEST publishable key (pk_test_…)"
       ask STRIPE_TEST_API_KEY "Stripe TEST secret key (sk_test_…)" secret
       ask STRIPE_TEST_WEBHOOK_SECRET "Stripe TEST webhook signing secret (whsec_…)" secret ;;
    2) ask STRIPE_LIVE_PUBLISHABLE_KEY "Stripe LIVE publishable key (pk_live_…)"
       ask STRIPE_LIVE_API_KEY "Stripe LIVE secret key (sk_live_…)" secret
       ask STRIPE_LIVE_WEBHOOK_SECRET "Stripe LIVE webhook signing secret (whsec_…)" secret ;;
    3) ask PAYPAL_TEST_CLIENT_ID "PayPal SANDBOX client ID"
       ask PAYPAL_TEST_CLIENT_SECRET "PayPal SANDBOX secret" secret ;;
    4) ask PAYPAL_LIVE_CLIENT_ID "PayPal LIVE client ID"
       ask PAYPAL_LIVE_CLIENT_SECRET "PayPal LIVE secret" secret ;;
    *) echo "Nothing changed."; exit 0 ;;
  esac
  echo "Saved. They take effect with:  bash $DIR/deploy/shop.sh prelaunch   (test keys)   or   shop.sh live"
}

activate() { # activate TEST|LIVE
  local s=STRIPE_$1 p=PAYPAL_$1
  put STRIPE_PUBLISHABLE_KEY "$(get ${s}_PUBLISHABLE_KEY)"
  put STRIPE_API_KEY "$(get ${s}_API_KEY)"
  put STRIPE_WEBHOOK_SECRET "$(get ${s}_WEBHOOK_SECRET)"
  put PAYPAL_CLIENT_ID "$(get ${p}_CLIENT_ID)"
  put PAYPAL_CLIENT_SECRET "$(get ${p}_CLIENT_SECRET)"
  if [ "$1" = LIVE ]; then put PAYPAL_MODE live; else put PAYPAL_MODE sandbox; fi
  put ALLOW_TEST_ORDERS false
}

case "${1:-status}" in
  status) status ;;
  keys) keys ;;
  prelaunch)
    [ -n "$(get STRIPE_TEST_API_KEY)$(get PAYPAL_TEST_CLIENT_ID)" ] || { echo "No test keys stored yet — run: bash $0 keys"; exit 1; }
    activate TEST
    put SHOP_MODE prelaunch
    [ -n "$(get PREVIEW_KEY)" ] || put PREVIEW_KEY "$(openssl rand -hex 12)"
    redeploy
    echo; status
    echo
    echo "Pre-launch: checkout is closed to the public. Open the preview link once in a browser to test with test cards."
    ;;
  live)
    [ -n "$(get STRIPE_LIVE_API_KEY)" ] || { echo "No LIVE Stripe keys stored yet — run: bash $0 keys  (choose 2)"; exit 1; }
    [[ "$(get STRIPE_LIVE_API_KEY)" == sk_live_* ]] || { echo "The stored LIVE Stripe secret doesn't start with sk_live_ — check it with: bash $0 keys"; exit 1; }
    [ -n "$(get STRIPE_LIVE_WEBHOOK_SECRET)" ] || { echo "No LIVE Stripe webhook secret — create the live webhook in Stripe first, then: bash $0 keys"; exit 1; }
    [ -n "$(get PAYPAL_LIVE_CLIENT_ID)" ] || echo "Note: no LIVE PayPal keys — the shop goes live with Stripe only (PayPal hidden)."
    read -rp "Go LIVE now? Real cards will be charged. Type LIVE to confirm: " ok
    [ "$ok" = LIVE ] || { echo "Cancelled."; exit 0; }
    activate LIVE
    put SHOP_MODE live
    redeploy
    echo; status
    echo
    echo "GK Parfum is LIVE. Place one small real order and refund it from Stripe to be sure."
    ;;
  *) sed -n '2,9p' "$0"; exit 1 ;;
esac
