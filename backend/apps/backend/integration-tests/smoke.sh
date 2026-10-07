#!/usr/bin/env bash
# End-to-end smoke test of the GK cart flow against a running backend.
# Usage: PK=<publishable key> ./integration-tests/smoke.sh [http://localhost:9000]
set -euo pipefail
API=${1:-http://localhost:9000}
H=(-H "x-publishable-api-key: $PK" -H "Content-Type: application/json")
j() { python3 -c "import sys,json; d=json.load(sys.stdin); print(eval(sys.argv[1]))" "$1"; }

echo "== offers"
curl -s "${H[@]}" "$API/store/gk/offers" | j "d['offers']['bundle'], d['offers']['freeDelivery'], [ (s['id'], s['price']) for s in d['offers']['shipping'] ]"

REGION=$(curl -s "${H[@]}" "$API/store/regions" | j "d['regions'][0]['id']")
PRODUCTS=$(curl -s "${H[@]}" "$API/store/products?limit=50&fields=handle,variants.id,variants.sku&region_id=$REGION")
v() { echo "$PRODUCTS" | j "[p['variants'][0]['id'] for p in d['products'] if p['handle']=='$1'][0]"; }
RA=$(v royal-adventure); CL=$(v crimson-luxe); KC=$(v kings-code); DN=$(v desert-nectar-elixir)

CART=$(curl -s "${H[@]}" -X POST "$API/store/carts" -d "{\"region_id\":\"$REGION\"}" | j "d['cart']['id']")
echo "cart $CART"

echo "== 2 bottles (no bundle): expect 17.99 + 16.99 = 34.98"
curl -s "${H[@]}" -X POST "$API/store/gk/carts/$CART/sync" -d "{\"lines\":[{\"variant_id\":\"$RA\",\"quantity\":1},{\"variant_id\":\"$KC\",\"quantity\":1}]}" \
  | j "d['cart']['item_total'], [(i['title'], i['quantity'], i['unit_price']) for i in d['cart']['items']]"

echo "== 4 bottles + gift box: expect 45 (bundle) + 16.99 + 4.99 = 66.98"
curl -s "${H[@]}" -X POST "$API/store/gk/carts/$CART/sync" -d "{\"lines\":[{\"variant_id\":\"$RA\",\"quantity\":2},{\"variant_id\":\"$CL\",\"quantity\":1},{\"variant_id\":\"$DN\",\"quantity\":1}],\"gift_boxes\":1}" \
  | j "d['cart']['item_total'], [(i['product_title'], i['quantity'], i['unit_price'], i.get('metadata')) for i in d['cart']['items']]"

echo "== tamper: direct line-item edit must be refused (expect 403)"
ITEM=$(curl -s "${H[@]}" "$API/store/carts/$CART" | j "d['cart']['items'][0]['id']")
curl -s -o /dev/null -w "%{http_code}\n" "${H[@]}" -X POST "$API/store/carts/$CART/line-items/$ITEM" -d '{"quantity":10}'
curl -s -o /dev/null -w "%{http_code}\n" "${H[@]}" -X POST "$API/store/carts/$CART/line-items" -d "{\"variant_id\":\"$RA\",\"quantity\":1}"

echo "== checkout: address, shipping (expect Tracked 48 free over £35), manual payment, complete"
curl -s "${H[@]}" -X POST "$API/store/carts/$CART" -d '{"email":"test@example.com","shipping_address":{"first_name":"Test","last_name":"Buyer","address_1":"1 High Street","city":"London","postal_code":"SW1A 1AA","country_code":"gb","phone":"07700900000"}}' > /dev/null
curl -s "${H[@]}" "$API/store/shipping-options?cart_id=$CART" | j "[(o['name'], o['amount'], o['id']) for o in d['shipping_options']]"
SO=$(curl -s "${H[@]}" "$API/store/shipping-options?cart_id=$CART" | j "[o['id'] for o in d['shipping_options'] if '48' in o['name']][0]")
curl -s "${H[@]}" -X POST "$API/store/carts/$CART/shipping-methods" -d "{\"option_id\":\"$SO\"}" | j "d['cart']['shipping_total'], d['cart']['total']"
PC=$(curl -s "${H[@]}" -X POST "$API/store/payment-collections" -d "{\"cart_id\":\"$CART\"}" | j "d['payment_collection']['id']")
curl -s "${H[@]}" -X POST "$API/store/payment-collections/$PC/payment-sessions" -d '{"provider_id":"pp_system_default"}' > /dev/null
curl -s "${H[@]}" -X POST "$API/store/carts/$CART/complete" | j "d['type'], d.get('order',{}).get('display_id'), d.get('order',{}).get('total')"
