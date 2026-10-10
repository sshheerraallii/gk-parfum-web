# Free client preview: shop + admin panel online

This puts the whole store online for **£0** so the client can click around the real thing: shop, bag, checkout, accounts and the admin panel.

| Piece | Free host | What the client gets |
|---|---|---|
| Shop (Next.js storefront) | **Vercel** | `https://gk-parfum.vercel.app` |
| Admin panel + store API (Medusa) | **Render** | `https://gk-parfum-backend.onrender.com/app` |
| Database (+ optional photo storage) | **Supabase** | Not visible to the client |

**Time needed:** about 45 minutes the first time. After that, every `git push` updates the site on its own.

**Why not Hostinger for everything?** Hostinger web hosting can run the shop, but not the backend, which needs PostgreSQL. Only a paid Hostinger VPS can run the backend. When the client goes live, use a VPS (KVM 2 or better) with `deploy/docker-compose.yml`; see the README. For the free preview, Hostinger can still give you nice links (step 7).

**Limits of the free preview (fine for a demo, not for launch):**
- **Slow first load after sleep.** Render's free server sleeps after 15 minutes with no visitors. The first visit then takes about a minute. Step 5 stops it sleeping.
- **Server memory.** The free server has 512 MB. The backend uses about 360–410 MB (measured), so it fits, with little to spare.
- **No real payments.** Checkout shows **"Place test order"** until Stripe keys are added. Test orders still appear in the admin.
- **Not for the live shop.** Vercel's free plan is meant for non-commercial use. Move the live shop to the VPS or Vercel Pro when it launches.

---

## 1. Get the code on your PC and keep GitHub up to date

Open **Command Prompt**. You only do this once:

```cmd
D:
cd "D:\Freelance 3\GK Parfum"
git clone https://github.com/sshheerraallii/gk-parfum-web.git
cd gk-parfum-web
```

**Every time you change something** (or Claude hands you new files), run these from inside the `gk-parfum-web` folder:

```cmd
git pull
git add -A
git commit -m "Short note of what changed"
git push origin main
```

- `git pull` first fetches anything already pushed to GitHub, so you never overwrite newer work.
- `git push` triggers the redeploys automatically:
  - **Vercel** rebuilds the shop in about 2 minutes.
  - **Render** rebuilds the backend in about 10–15 minutes, but only when something inside `backend/` changed.

If `git commit` says *"Please tell me who you are"*, run these once, then commit again:

```cmd
git config --global user.name "Sher Ali Khan"
git config --global user.email "you@example.com"
```

---

## 2. Database: Supabase (free)

1. Go to **supabase.com** → sign in with GitHub → **New project**.
   - **Name:** `gk-parfum`
   - **Database password:** letters and numbers only (no `@ # / ?`, which break the link). Save it somewhere.
   - **Region:** *West EU (London)*
2. When the project is ready, click **Connect** (top bar). Choose **Session pooler** and copy the URI. It looks like:
   ```
   postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:5432/postgres
   ```
3. Replace `[YOUR-PASSWORD]` (including the brackets) with your password. This is your **DATABASE_URL**.

> **Use Session pooler, not "Direct connection".** The direct address doesn't work from Render.

---

## 3. Backend + admin panel: Render (free)

1. Go to **render.com** → sign in with GitHub → **New +** → **Blueprint**.
2. Pick the **gk-parfum-web** repo. Render reads `render.yaml` and shows a service called **gk-parfum-backend**.
3. Fill in the boxes it asks for:

   | Box | Value |
   |---|---|
   | `DATABASE_URL` | The Supabase link from step 2 |
   | `STORE_CORS` | `https://gk-parfum.vercel.app` (you'll create this exact name in step 4) |
   | `ADMIN_CORS` | `https://gk-parfum-backend.onrender.com` |
   | `AUTH_CORS` | `https://gk-parfum.vercel.app,https://gk-parfum-backend.onrender.com` |
   | `ADMIN_EMAIL` | The client's admin login email |
   | `ADMIN_PASSWORD` | A strong password for that login |

   The secrets (`JWT_SECRET` and the rest) are generated for you.
4. Click **Apply**. The first build takes **10–15 minutes**.
5. When it says **Live**, check the address at the top of the service page.
   - If Render added a suffix (for example `gk-parfum-backend-x7k2.onrender.com`), go to **Environment** and put that real address into `ADMIN_CORS` and `AUTH_CORS`, then save. Render redeploys by itself.
6. Open **Logs** and search for `publishable key`. Copy the value that starts with `pk_`; you need it in step 4.
7. Open `https://<your-backend>.onrender.com/app` and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. You should see **Products** (16 scents + gift box), **Offers**, **Reviews**, **Messages**, **Newsletter** and **Searches**.

---

## 4. Shop: Vercel (free)

1. Go to **vercel.com** → sign in with GitHub → **Add New… → Project** → import **gk-parfum-web**.
2. **Project Name:** `gk-parfum`
3. **Root Directory:** click **Edit** → choose **`storefront`**. *(This is the step people miss.)*
4. Open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://<your-backend>.onrender.com` (no slash at the end) |
   | `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | The `pk_…` from step 3 |
   | `NEXT_PUBLIC_SITE_URL` | `https://gk-parfum.vercel.app` |

5. Click **Deploy** and wait about 2 minutes.
   - If Vercel gave a different address than `gk-parfum.vercel.app`, put the real one into `NEXT_PUBLIC_SITE_URL` (Vercel → Settings → Environment Variables, then **Redeploy**).
   - Also put it into `STORE_CORS` and `AUTH_CORS` on Render.

**Check it works:** add 3 bottles in **Build your bundle**, go to checkout, enter a UK address. You should see **Tracked 48 = Free** and the free gift box. Place a test order, then find it in the admin under **Orders**.

---

## 5. Stop the backend falling asleep (free)

1. Go to **cron-job.org** → free account → **Create cronjob**.
2. **URL:** `https://<your-backend>.onrender.com/gk/ping`
3. **Schedule:** every **10 minutes** → Save.

This keeps the shop instant for the client. It also stops Supabase pausing a "quiet" free database, which happens after a week with no activity. Render's 750 free hours a month cover one server running all month.

---

## 6. Optional: keep uploaded product photos

On Render's free plan, files saved on the server **disappear on every redeploy**. That includes photos the client uploads in the admin. To keep them, store photos in Supabase (1 GB free):

1. In **Supabase**, go to **Storage → New bucket** → name it `products`, tick **Public bucket**.
2. Go to **Storage → Settings** (S3 connection). Copy the **Endpoint** and **Region**, then click **New access key**.
3. In **Render**, go to **Environment** and add:

   | Name | Value |
   |---|---|
   | `S3_BUCKET` | `products` |
   | `S3_ENDPOINT` | `https://<project-ref>.storage.supabase.co/storage/v1/s3` |
   | `S3_REGION` | The region shown, e.g. `eu-west-2` |
   | `S3_ACCESS_KEY_ID` | From the access key |
   | `S3_SECRET_ACCESS_KEY` | From the access key |
   | `S3_FILE_URL` | `https://<project-ref>.supabase.co/storage/v1/object/public/products` |

4. Save; Render redeploys. Upload one photo in the admin and check it shows on the shop.

> This is wired in `medusa-config.ts` but hasn't been tried against a real Supabase account yet. If uploads fail, delete these six variables and photos go back to the server's own disk.

---

## 7. Optional: nicer links with your Hostinger domain

In **hPanel → Domains → DNS / Nameservers** for your domain, add two **CNAME** records:

| Name | Points to |
|---|---|
| `demo` | `cname.vercel-dns.com` |
| `admin` | `<your-backend>.onrender.com` |

Then tell each host about its new address:

- **Vercel:** Project → Settings → **Domains** → add `demo.yourdomain.com`. Change `NEXT_PUBLIC_SITE_URL` to that address and redeploy.
- **Render:** Service → Settings → **Custom Domains** → add `admin.yourdomain.com`. Update the CORS settings:
  - `STORE_CORS`: `https://demo.yourdomain.com`
  - `ADMIN_CORS`: `https://admin.yourdomain.com`
  - `AUTH_CORS`: both addresses, comma-separated
- Change `NEXT_PUBLIC_MEDUSA_BACKEND_URL` on Vercel to `https://admin.yourdomain.com` and redeploy.

Both hosts add HTTPS on their own within a few minutes.

---

## 8. What to send the client

```
Shop:   https://gk-parfum.vercel.app
Admin:  https://gk-parfum-backend.onrender.com/app
Login:  <ADMIN_EMAIL> / <ADMIN_PASSWORD>

This is a private preview. Checkout runs in test mode: no card is
charged, but every test order appears in Admin → Orders.
Try: Admin → Offers (switch deals on/off, pick best sellers),
Products (edit text, prices, photos), Reviews (approve), Messages.
```

---

## If something goes wrong

| What you see | Fix |
|---|---|
| Shop works but the bag or checkout says it can't reach the store, or the browser console says **CORS** | `STORE_CORS` and `AUTH_CORS` on Render must match the shop address exactly: `https://`, no slash at the end. |
| Admin login page just reloads | `ADMIN_CORS` must be the backend's own address. Open the admin through `https://`. |
| Render log says `password authentication failed` or `ENOTFOUND` | Re-copy the **Session pooler** link from Supabase and check the password has no symbols. |
| Render build fails with `JavaScript heap out of memory` | Click **Manual Deploy → Clear build cache & deploy** once. |
| Shop shows the scents but prices or edits don't update | Pages refresh every 60 seconds. Wait a minute and reload. |
| First click after a long break is slow | The pinger in step 5 isn't running. Check it on cron-job.org. |
