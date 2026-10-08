#!/usr/bin/env bash
# End-to-end smoke test of the GK cart rules against a running backend.
# Usage: PK=<publishable key> ./integration-tests/smoke.sh [http://localhost:9000]
set -euo pipefail
API=${1:-http://localhost:9000}
H=(-H "x-publishable-api-key: $PK" -H "Content-Type: application/json")
j() { python3 -c "import sys,json; d=json.load(sys.stdin); print(eval(sys.argv[1]))" "$1"; }
items() { j "d['cart']['item_total'], sorted([(i['product_title'], i['quantity'], i['unit_price'], (i.get('metadata') or {}).get('gk_discount') or (i.get('metadata') or {}).get('gk_gift_box') or '') for i in d['cart']['items']]), [p['code'] for p in d['cart'].get('promotions') or []]"; }
fail() { echo "FAIL: $1"; exit 1; }

REGION=$(curl -s "${H[@]}" "$API/store/regions" | j "d['regions'][0]['id']")
PRODUCTS=$(curl -s "${H[@]}" "$API/store/products?limit=50&fields=handle,variants.id&region_id=$REGION")
v() { echo "$PRODUCTS" | j "[p['variants'][0]['id'] for p in d['products'] if p['handle']=='$1'][0]"; }
RA=$(v royal-adventure); CL=$(v crimson-luxe); KC=$(v kings-code)
new_cart() { curl -s "${H[@]}" -X POST "$API/store/carts" -d "{\"region_id\":\"$REGION\"}" | j "d['cart']['id']"; }
sync() { curl -s "${H[@]}" -X POST "$API/store/gk/carts/$1/sync" -d "$2"; }

CART=$(new_cart)
echo "== 1 bottle: full price 17.99 + free gift box at 0"
OUT=$(sync $CART "{\"lines\":[{\"variant_id\":\"$RA\",\"quantity\":1}]}" | items); echo "$OUT"
[[ "$OUT" == "(17.99,"* ]] || fail "single bottle"

echo "== 1 bottle on subscription: 10% off -> 16.19"
OUT=$(sync $CART "{\"lines\":[{\"variant_id\":\"$RA\",\"quantity\":1,\"subscribe\":true}]}" | items); echo "$OUT"
[[ "$OUT" == "(16.19,"* ]] || fail "subscription"

echo "== 2 bottles: 10% off each -> 16.19 + 15.29 = 31.48, no delivery code"
OUT=$(sync $CART "{\"lines\":[{\"variant_id\":\"$RA\",\"quantity\":1},{\"variant_id\":\"$KC\",\"quantity\":1}]}" | items); echo "$OUT"
[[ "$OUT" == "(31.48,"* && "$OUT" == *"[])" ]] || fail "two bottles"

echo "== 3 bottles: 10% off -> 16.19*2 + 15.29 = 47.67"
THREE="{\"lines\":[{\"variant_id\":\"$RA\",\"quantity\":1},{\"variant_id\":\"$CL\",\"quantity\":1},{\"variant_id\":\"$KC\",\"quantity\":1}]}"
OUT=$(sync $CART "$THREE" | items); echo "$OUT"
[[ "$OUT" == "(47.67,"* ]] || fail "three bottles"
ADDR='{"email":"test@example.com","shipping_address":{"first_name":"Test","last_name":"Buyer","address_1":"1 High Street","city":"London","postal_code":"SW1A 1AA","country_code":"gb","phone":"07700900000"}}'
curl -s "${H[@]}" -X POST "$API/store/carts/$CART" -d "$ADDR" > /dev/null
SO=$(curl -s "${H[@]}" "$API/store/shipping-options?cart_id=$CART" | j "[o['id'] for o in d['shipping_options'] if '48' in o['name']][0]")
curl -s "${H[@]}" -X POST "$API/store/carts/$CART/shipping-methods" -d "{\"option_id\":\"$SO\"}" > /dev/null
echo "== 3 bottles after delivery chosen: free delivery code applied"
OUT=$(sync $CART "$THREE" | items); echo "$OUT"
[[ "$OUT" == *"GK-BUNDLE-DELIVERY"* ]] || fail "delivery code not applied"
SHIP=$(curl -s "${H[@]}" "$API/store/carts/$CART?fields=+shipping_total" | j "d['cart']['shipping_total']"); echo "tracked 48 shipping: $SHIP"
[[ "$SHIP" == "0" ]] || fail "tracked 48 not free"
echo "== 3 bottles on Tracked 24: express is still charged (5.99)"
SO24=$(curl -s "${H[@]}" "$API/store/shipping-options?cart_id=$CART" | j "[o['id'] for o in d['shipping_options'] if '24' in o['name']][0]")
curl -s "${H[@]}" -X POST "$API/store/carts/$CART/shipping-methods" -d "{\"option_id\":\"$SO24\"}" > /dev/null
sync $CART "$THREE" > /dev/null
SHIP=$(curl -s "${H[@]}" "$API/store/carts/$CART?fields=+shipping_total" | j "d['cart']['shipping_total']"); echo "tracked 24 shipping: $SHIP"
[[ "$SHIP" == "5.99" ]] || fail "express made free"
curl -s "${H[@]}" -X POST "$API/store/carts/$CART/shipping-methods" -d "{\"option_id\":\"$SO\"}" > /dev/null

echo "== back to 2: delivery code removed"
OUT=$(sync $CART "{\"lines\":[{\"variant_id\":\"$RA\",\"quantity\":1},{\"variant_id\":\"$KC\",\"quantity\":1}]}" | items); echo "$OUT"
[[ "$OUT" == *"[])" ]] || fail "code not removed"

echo "== tamper: direct line-item edits refused (403, 403)"
ITEM=$(curl -s "${H[@]}" "$API/store/carts/$CART" | j "d['cart']['items'][0]['id']")
[[ $(curl -s -o /dev/null -w "%{http_code}" "${H[@]}" -X POST "$API/store/carts/$CART/line-items/$ITEM" -d '{"quantity":10}') == 403 ]] || fail "line edit allowed"
[[ $(curl -s -o /dev/null -w "%{http_code}" "${H[@]}" -X POST "$API/store/carts/$CART/line-items" -d "{\"variant_id\":\"$RA\",\"quantity\":1}") == 403 ]] || fail "line add allowed"

echo "== tamper: adding the bundle delivery code by hand with 2 bottles is refused at checkout"
curl -s "${H[@]}" -X POST "$API/store/carts/$CART/promotions" -d '{"promo_codes":["GK-BUNDLE-DELIVERY"]}' | j "[p['code'] for p in d['cart']['promotions']]"
PC=$(curl -s "${H[@]}" -X POST "$API/store/payment-collections" -d "{\"cart_id\":\"$CART\"}" | j "d['payment_collection']['id']")
curl -s "${H[@]}" -X POST "$API/store/payment-collections/$PC/payment-sessions" -d '{"provider_id":"pp_system_default"}' > /dev/null
OUT=$(curl -s "${H[@]}" -X POST "$API/store/carts/$CART/complete"); echo "$OUT" | head -c 200; echo
[[ "$OUT" != *'"type":"order"'* ]] || fail "hand-added delivery code accepted"

echo "== real order: 3 bottles, delivery free via bundle"
CART=$(new_cart)
sync $CART "{\"lines\":[{\"variant_id\":\"$RA\",\"quantity\":2},{\"variant_id\":\"$KC\",\"quantity\":1,\"subscribe\":true}]}" | items
curl -s "${H[@]}" -X POST "$API/store/carts/$CART" -d "$ADDR" > /dev/null
curl -s "${H[@]}" "$API/store/shipping-options?cart_id=$CART" | j "[(o['name'], o['amount']) for o in d['shipping_options']]"
SO=$(curl -s "${H[@]}" "$API/store/shipping-options?cart_id=$CART" | j "[o['id'] for o in d['shipping_options'] if '48' in o['name']][0]")
curl -s "${H[@]}" -X POST "$API/store/carts/$CART/shipping-methods" -d "{\"option_id\":\"$SO\"}" > /dev/null
sync $CART "{\"lines\":[{\"variant_id\":\"$RA\",\"quantity\":2},{\"variant_id\":\"$KC\",\"quantity\":1,\"subscribe\":true}]}" > /dev/null
OUT=$(curl -s "${H[@]}" "$API/store/carts/$CART?fields=+shipping_total,+discount_total,+total" | j "d['cart']['shipping_total'], d['cart']['discount_total'], d['cart']['total']"); echo "shipping, discount, total: $OUT"
[[ "$OUT" == *", 47.67)" ]] || fail "bundle free delivery"
PC=$(curl -s "${H[@]}" -X POST "$API/store/payment-collections" -d "{\"cart_id\":\"$CART\"}" | j "d['payment_collection']['id']")
curl -s "${H[@]}" -X POST "$API/store/payment-collections/$PC/payment-sessions" -d '{"provider_id":"pp_system_default"}' > /dev/null
OUT=$(curl -s "${H[@]}" -X POST "$API/store/carts/$CART/complete" | j "d['type'], d.get('order',{}).get('display_id'), d.get('order',{}).get('total')"); echo "$OUT"
[[ "$OUT" == "('order',"* ]] || fail "order not placed"

echo "== engagement endpoints"
for path in "search-log:{\"query\":\"I like woody scents and ouds\",\"results\":4,\"source\":\"matcher\"}" \
            "subscribe:{\"email\":\"fan@example.com\",\"phone\":\"07700900001\",\"source\":\"popup\"}" \
            "contact:{\"name\":\"Amelia\",\"email\":\"amelia@example.com\",\"message\":\"Where is my order please?\"}" \
            "reviews:{\"product_handle\":\"royal-adventure\",\"name\":\"Test Buyer\",\"email\":\"test@example.com\",\"rating\":5,\"title\":\"Lovely\",\"body\":\"Lasts all day, great value.\"}"; do
  P=${path%%:*}; B=${path#*:}
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "${H[@]}" -X POST "$API/store/gk/$P" -d "$B"); echo "$P -> $CODE"
  [[ $CODE == 201 ]] || fail "$P"
done
CODE=$(curl -s -o /dev/null -w "%{http_code}" "${H[@]}" -X POST "$API/store/gk/subscribe" -d '{"email":"bot@example.com","website":"spam"}'); echo "honeypot -> $CODE"
[[ $CODE == 400 ]] || fail "honeypot"
curl -s "${H[@]}" "$API/store/gk/reviews?product=royal-adventure" | j "d['count'], d['average']"
echo "ALL PASSED"
