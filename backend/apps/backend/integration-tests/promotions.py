"""
Checks that the discounts an owner can create in the admin work alongside the GK bundle pricing.
Usage: python3 integration-tests/promotions.py <publishable key> <admin token> [http://localhost:9000]
Creates its own test promotions and price list (prefixed TEST-) and removes them at the end.
"""
import json
import sys
import urllib.request

PK, TOKEN = sys.argv[1], sys.argv[2]
API = sys.argv[3] if len(sys.argv) > 3 else "http://localhost:9000"
results = []


def call(method, path, body=None, admin=False):
    h = {"Content-Type": "application/json"}
    h.update({"Authorization": f"Bearer {TOKEN}"} if admin else {"x-publishable-api-key": PK})
    req = urllib.request.Request(API + path, method=method, headers=h, data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def check(name, ok, detail=""):
    results.append((name, ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{detail}]" if detail else ""))


region = call("GET", "/store/regions")[1]["regions"][0]["id"]
prods = call("GET", f"/store/products?limit=50&region_id={region}&fields=id,handle,variants.id,*variants.calculated_price")[1]["products"]
V = {p["handle"]: p["variants"][0]["id"] for p in prods}
P = {p["handle"]: p["id"] for p in prods}
ADDR = {"email": "promo@example.com", "shipping_address": {"first_name": "P", "last_name": "T", "address_1": "1 High St", "city": "London", "postal_code": "SW1A 1AA", "country_code": "gb", "phone": "07700900000"}}


def cart(lines, ship=True):
    cid = call("POST", "/store/carts", {"region_id": region})[1]["cart"]["id"]
    call("POST", f"/store/gk/carts/{cid}/sync", {"lines": lines})
    if ship:
        call("POST", f"/store/carts/{cid}", ADDR)
        opts = call("GET", f"/store/shipping-options?cart_id={cid}")[1]["shipping_options"]
        so = [o for o in opts if "48" in o["name"]][0]["id"]
        call("POST", f"/store/carts/{cid}/shipping-methods", {"option_id": so})
        call("POST", f"/store/gk/carts/{cid}/sync", {"lines": lines})
    return cid


def get(cid):
    return call("GET", f"/store/carts/{cid}?fields=+item_total,+item_subtotal,+discount_total,+shipping_total,+total,*promotions,*items.adjustments")[1]["cart"]


def complete(cid):
    pc = call("POST", "/store/payment-collections", {"cart_id": cid})[1]["payment_collection"]["id"]
    call("POST", f"/store/payment-collections/{pc}/payment-sessions", {"provider_id": "pp_system_default"})
    s, r = call("POST", f"/store/carts/{cid}/complete")
    return r.get("type") == "order", r.get("order", {}).get("total"), r.get("error") or r.get("message")


created = []


def promo(body):
    s, r = call("POST", "/admin/promotions", body, admin=True)
    if s >= 300:
        print("could not create", body["code"], r)
        return None
    created.append(r["promotion"]["id"])
    return r["promotion"]


two = [{"variant_id": V["eventus"], "quantity": 1}, {"variant_id": V["royal-oud"], "quantity": 1}]
one = [{"variant_id": V["eventus"], "quantity": 1}]

# 1. percentage code on the whole order
promo({"code": "TEST-PCT20", "type": "standard", "status": "active",
       "application_method": {"type": "percentage", "target_type": "order", "value": 20, "currency_code": "gbp"}})
c = cart(two)
call("POST", f"/store/carts/{c}/promotions", {"promo_codes": ["TEST-PCT20"]})
call("POST", f"/store/gk/carts/{c}/sync", {"lines": two + [{"variant_id": V["nomad"], "quantity": 1}]})  # change bag after code
k = get(c)
codes = [p["code"] for p in k["promotions"]]
check("20% code survives the bag changing", "TEST-PCT20" in codes, f"codes={codes} discount={k['discount_total']}")
# discount_total also counts the bundle's free delivery, so compare the items only
check("20% code takes 20% off the bundle price", abs(k["item_subtotal"] * 0.8 - k["item_total"]) < 0.02, f"before={k['item_subtotal']} after={k['item_total']}")
ok, total, err = complete(c)
check("order with a 20% code completes", ok, f"total={total} {err or ''}")

# 2. fixed amount off
promo({"code": "TEST-FIVE", "type": "standard", "status": "active",
       "application_method": {"type": "fixed", "target_type": "order", "value": 5, "currency_code": "gbp", "allocation": "across"}})
c = cart(one)
call("POST", f"/store/carts/{c}/promotions", {"promo_codes": ["TEST-FIVE"]})
k = get(c)
check("£5 off code", abs(k["discount_total"] - 5) < 0.01, f"discount={k['discount_total']}")
ok, total, err = complete(c)
check("order with £5 code completes", ok, f"total={total} {err or ''}")

# 3. automatic (no code) — 15% off one scent
promo({"code": "TEST-AUTO-OUD", "type": "standard", "status": "active", "is_automatic": True,
       "application_method": {"type": "percentage", "target_type": "items", "value": 15, "allocation": "each", "max_quantity": 10, "currency_code": "gbp",
                              "target_rules": [{"attribute": "items.product.id", "operator": "in", "values": [P["royal-oud"]]}]}})
c = cart(two)
k = get(c)
check("automatic offer applies with no code", "TEST-AUTO-OUD" in [p["code"] for p in k["promotions"]], f"discount={k['discount_total']}")
ok, total, err = complete(c)
check("order with automatic offer completes", ok, f"total={total} {err or ''}")
call("DELETE", f"/admin/promotions/{created.pop()}", admin=True)  # so it doesn't skew the later checks

# 4. free delivery code
promo({"code": "TEST-SHIPFREE", "type": "standard", "status": "active",
       "application_method": {"type": "percentage", "target_type": "shipping_methods", "value": 100, "allocation": "each", "max_quantity": 1, "currency_code": "gbp"}})
c = cart(one)
call("POST", f"/store/carts/{c}/promotions", {"promo_codes": ["TEST-SHIPFREE"]})
call("POST", f"/store/gk/carts/{c}/sync", {"lines": one})
k = get(c)
check("free delivery code", k["shipping_total"] == 0, f"shipping={k['shipping_total']}")

# 5. buy 2 get 1 free (cheapest)
promo({"code": "TEST-B2G1", "type": "buyget", "status": "active",
       "rules": [],
       "application_method": {"type": "percentage", "target_type": "items", "value": 100, "allocation": "each", "max_quantity": 1,
                              "apply_to_quantity": 1, "buy_rules_min_quantity": 2,
                              "buy_rules": [{"attribute": "items.product.id", "operator": "in", "values": [p for h, p in P.items() if h != "signature-gift-box"]}],
                              "target_rules": [{"attribute": "items.product.id", "operator": "in", "values": [p for h, p in P.items() if h != "signature-gift-box"]}]}})
three = two + [{"variant_id": V["nomad"], "quantity": 1}]
c = cart(three)
call("POST", f"/store/carts/{c}/promotions", {"promo_codes": ["TEST-B2G1"]})
k = get(c)
check("buy 2 get 1 code applies", k["discount_total"] > 10, f"discount={k['discount_total']}")

# 6. a sale price list (Admin → Price Lists) — shop shows was/now, cart charges the sale price
s, r = call("POST", "/admin/price-lists", {"title": "TEST sale", "description": "test", "type": "sale", "status": "active",
                                           "prices": [{"variant_id": V["eventus"], "amount": 14.99, "currency_code": "gbp"}]}, admin=True)
pl = r.get("price_list", {}).get("id")
p = call("GET", f"/store/products?handle=eventus&region_id={region}&fields=*variants.calculated_price")[1]["products"][0]
cp = p["variants"][0]["calculated_price"]
check("sale shows was and now prices to the shop", cp["calculated_amount"] == 14.99 and cp["original_amount"] == 17.99, f"{cp['calculated_amount']} / {cp['original_amount']}")
c = cart(one)
k = get(c)
check("cart charges the sale price", k["item_subtotal"] == 14.99, f"items={k['item_total']}")
c = cart(two)
k = get(c)
check("bundle 10% stacks on the sale price", abs(k["item_subtotal"] - round(14.99 * 0.9 + 17.99 * 0.9, 2)) < 0.02, f"items={k['item_subtotal']}")
ok, total, err = complete(c)
check("sale order completes", ok, f"total={total} {err or ''}")

# clean up
for pid in created:
    call("DELETE", f"/admin/promotions/{pid}", admin=True)
if pl:
    call("DELETE", f"/admin/price-lists/{pl}", admin=True)

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
