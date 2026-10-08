# GK Parfum — website + admin

Luxury inspired-perfume store for the UK. Two apps in one repo:

| Folder | What it is | Runs on |
|---|---|---|
| `storefront/` | The website customers see (Next.js 15) | port 3000 |
| `backend/` | The admin panel and shop engine (Medusa 2) | port 9000, admin at `/app` |
| `deploy/` | Docker Compose + automatic HTTPS for a single server | — |

## What the owner can do in the admin

Log in at `https://admin.<your-domain>/app`.

- **Products** — names, descriptions, prices, stock and photos (the first photo becomes the product image on the site; the drawn bottle is only a stand-in until then). **Tags**: add as many as you like per product (e.g. Woody, Winter, Night out) — they show on the site and power the filters and the scent finder. The scent details (inspired by, notes, longevity, mood, colour) live in each product's **Metadata**.
- **Offers** (left menu) — bundle tiers (2 bottles = 10% off, 3 bottles = 10% off + free delivery; change the numbers or switch off), free delivery over a spend (£65), subscribe & save (10% off, every 4 weeks), the free signature gift box, and **Best sellers**: tick the scents to feature. If none are ticked, the best-stocked scents are shown.
- **Searches** — what shoppers type into "Which perfume do you love?" and the search page: most-searched words, searches that found nothing (ideas for new scents) and recent searches.
- **Newsletter** — sign-ups from the "win a free bottle" pop-up, with phone numbers when given. Download as CSV for Mailchimp, Klaviyo etc.
- **Reviews** — customer reviews wait here until you approve them; nothing appears on the site before that. "Verified buyer" is added automatically when the email has ordered that scent.
- **Messages** — everything sent from the Contact us page. Reply from your email, then mark as replied.
- **Promotions** — discount codes. `WELCOME10` (10% off) and `FREESHIP` are set up but off. Leave `GK-BUNDLE-DELIVERY` alone — the cart switches it on and off for 3-bottle bundles.
- **Orders** — each order shows a **Packing notes** box: which bottles are repeat deliveries ("every 4 weeks"), which got bundle discounts, and the free gift box.
- **Customers** — everyone who created an account (they can see their orders, wishlist, saved bag and addresses on the site).
- **Inventory** — stock per scent.

### Subscriptions (deliver every 4 weeks)

Shoppers can choose "Deliver every 4 weeks" for 10% off. The first order is charged and flagged in the order's Packing notes. **Repeat orders are not charged automatically yet** — for now, re-send from the customer's details each 4 weeks (or we add Stripe recurring billing once Stripe is live).

## How the discounts are enforced

All prices are calculated **by the backend**, never trusted from the browser:

1. The site sends only *which* perfumes, *how many*, and whether each is a subscription (`POST /store/gk/carts/:id/sync`).
2. The backend applies the tier or subscription discount (never both on one bottle), adds the free gift box at £0, and switches the bundle free-delivery code on or off. Bundle free delivery covers Tracked 48 only; express is still charged.
3. Direct line-item edits through the normal store API are blocked (403).
4. Before an order is created, the prices and the free-delivery code are checked again; a cart cheaper than the rules allow is refused.

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
- Landing pages for every audience (`/shop/men`, `/shop/women`, `/shop/unisex`), an "inspired by" index of every original, a bundle page, real-review schema (only when approved reviews exist), and guides for long-tail searches.
- Lighthouse (mobile, throttled): Accessibility 100, Best practices 100, SEO 100, Performance 84–90 (measured before the October revisions).

## Still to do before launch

- Real bottle/box photography (upload in the admin).
- Business email address, and a notification provider (Resend or SendGrid) so order-confirmation emails go out.
- Review delivery, returns, privacy and terms pages against the real business details.
- Confirm the "inspired by" names in the product data (see notes from the build).
