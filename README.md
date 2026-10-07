# GK Parfum — website + admin

Luxury inspired-perfume store for the UK. Two apps in one repo:

| Folder | What it is | Runs on |
|---|---|---|
| `storefront/` | The website customers see (Next.js 15) | port 3000 |
| `backend/` | The admin panel and shop engine (Medusa 2) | port 9000, admin at `/app` |
| `deploy/` | Docker Compose + automatic HTTPS for a single server | — |

## What the owner can do in the admin

Log in at `https://admin.<your-domain>/app`.

- **Products** — change names, descriptions, prices and stock. Upload photos: the first photo becomes the product image on the site (the drawn bottle is only a stand-in until then). The scent details shown on the site (inspired by, notes, longevity, mood, colour) live in each product's **Metadata** section and can be edited there. New products appear on the site within a minute.
- **Offers** (left menu) — switch the bundle price ("Any 3 for £45") on or off and change the number of bottles or price; switch free delivery on/off and change the threshold; switch the gift box add-on on/off.
- **Promotions** — discount codes. `WELCOME10` (10% off) and `FREESHIP` are set up but off — open one and set it to Active. Create as many as you like: percentage or fixed, minimum spend, start/end dates, usage limits.
- **Orders** — every order with what each bottle was actually charged (bundle items are labelled), the address and delivery choice. Mark as fulfilled when posted.
- **Inventory** — stock per scent. Opening stock is 50 each.
- **Settings → Tax regions** — set the UK VAT rate once VAT-registered (prices are VAT-inclusive).

## How "any 3 for £45" is enforced

The bundle price is calculated **by the backend**, never trusted from the browser:

1. The site sends only *which* perfumes and *how many* (`POST /store/gk/carts/:id/sync`).
2. The backend looks up real prices, applies the bundle to every complete set (dearest bottles first) and writes the line items with the charged price.
3. Direct line-item edits through the normal store API are blocked (403).
4. Before an order is created, the price is checked again; a cart that's cheaper than the rules allow is refused.

Free delivery is a real shipping-price rule on Royal Mail Tracked 48 (free when goods total ≥ threshold), kept in sync with the Offers page.

## Run it locally

Needs Node 22, PostgreSQL 16 and Redis.

```bash
# backend
cd backend
cp apps/backend/.env.template apps/backend/.env   # set DATABASE_URL etc.
npm install
cd apps/backend
npx medusa db:migrate        # first run also seeds the GK store: 16 scents, UK region, shipping, offers
npx medusa user -e you@example.com -p a-strong-password
npx medusa develop           # http://localhost:9000/app

# storefront (new terminal)
cd storefront
cp .env.example .env.local   # paste the publishable key printed by the seed
npm install
npm run dev                  # http://localhost:3000
```

End-to-end check of the cart rules: `PK=<publishable key> backend/apps/backend/integration-tests/smoke.sh`

Without Stripe keys, checkout runs in **test mode**: orders are created in the admin and no payment is taken.

## Go live on a server

Any VPS with 2 GB RAM or more (Hetzner, DigitalOcean, etc.). Shared cPanel hosting can't run this.

1. Point two DNS A records at the server: `gkparfum.co.uk` and `admin.gkparfum.co.uk` (use your real domain).
2. Install Docker, copy this repo to the server.
3. `cd deploy && cp .env.example .env` and fill in the domains and secrets (`openssl rand -hex 32` for each).
4. Start the backend first: `docker compose up -d --build postgres redis backend`
5. Read the publishable key from the first-run log: `docker compose logs backend | grep "publishable key"` — put it in `.env` as `MEDUSA_PUBLISHABLE_KEY`.
6. Create the admin login: `docker compose exec backend npx medusa user -e you@example.com -p a-strong-password`
7. Start everything: `docker compose up -d --build`. Caddy fetches HTTPS certificates automatically.

> The Docker files are written for this setup but weren't run in the build environment (no Docker daemon there). The apps themselves are built and tested.

## Payments (Stripe)

Stripe's Payment Element handles cards, **Apple Pay, Google Pay, PayPal and Klarna** — turn each on in the Stripe Dashboard → Settings → Payment methods.

1. Put `STRIPE_API_KEY` (secret) and `STRIPE_PUBLISHABLE_KEY` in `deploy/.env`.
2. In Stripe → Developers → Webhooks, add `https://admin.<domain>/hooks/payment/stripe_stripe` and copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
3. If Stripe was added after the first boot: in the admin, Settings → Regions → United Kingdom → add the Stripe payment provider. (If the keys were there on first boot, this is already done.)
4. Rebuild: `docker compose up -d --build`.

## SEO built in

- Server-rendered pages, refreshed every 60 seconds from the admin.
- Per-product titles and descriptions ("Crimson Luxe — Baccarat Rouge 540 Inspired Perfume").
- Structured data: Product (price, stock, shipping, returns), BreadcrumbList, Organization, WebSite search, FAQPage, Article.
- `sitemap.xml` (includes product photos once uploaded) and `robots.txt`.
- Landing pages for every audience (`/shop/men`, `/shop/women`, `/shop/unisex`), a "smells like" index of every original, and guides for long-tail searches.
- Lighthouse (mobile, throttled): Accessibility 100, Best practices 100, SEO 100, Performance 84–90.

## Still to do before launch

- Real bottle/box photography (upload in the admin).
- Business email address, and a notification provider (Resend or SendGrid) so order-confirmation emails go out.
- Review delivery, returns, privacy and terms pages against the real business details.
- Confirm the "inspired by" names in the product data (see notes from the build).
