# Setup Guide

Follow these steps to go from a cloned repository to a working storefront backed by Supabase.

---

## 1. Prerequisites

- Node.js 18+ (Node 24 works), npm 10+
- A Supabase account and a new project (free tier is fine)
- Git (optional, for version control)
- Supabase CLI (optional, for local Edge Function development)

---

## 2. Install dependencies

```powershell
cd C:\Users\sunit\localbiz-ecommerce
npm install
```

Verify:

```powershell
npm run typecheck
npm run build
```

Both must pass. At this point the app builds in **demo preview mode** with no backend.

---

## 3. Create a Supabase project

1. Go to https://supabase.com/dashboard → **New project**.
2. Choose a name, database password and region. Wait for provisioning.
3. Open **Project Settings → API**. Note:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - Never use the `service_role` key here.
4. Open **Authentication → URL Configuration**:
   - Site URL: `http://localhost:5173` for development (your domain in production)
   - Add redirect URLs: `http://localhost:5173/**`, and in production `https://YOUR_DOMAIN/**`, plus `http://localhost:5173/reset-password` and the production equivalent.

---

## 4. Environment variables

Copy the example and edit:

```powershell
copy .env.example .env
```

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your_anon_public_key...
VITE_SUPABASE_FUNCTIONS_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1
VITE_DEMO_MODE=false
VITE_STORE_NAME=Norwood & Co.
VITE_STORE_TAGLINE=Thoughtful goods, close to home.
VITE_STORE_EMAIL=hello@norwoodandco.example
VITE_STORE_PHONE=+1 (555) 010-2040
```

`VITE_DEMO_MODE=false` switches the app to real Supabase data. If the URL/key still look like placeholders, the app automatically falls back to demo mode and shows the warning banner — it will never pretend to be connected.

Restart `npm run dev` after changing `.env`.

---

## 5. Run the SQL migrations

Open **Supabase Dashboard → SQL Editor → New query** and run each file **in order**, one at a time:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_rls_policies.sql`
3. `supabase/migrations/0003_functions.sql`
4. `supabase/migrations/0004_storage.sql`
5. `supabase/migrations/0005_seed_optional.sql` — **optional**; adds 8 categories and 200 products for testing. Skip in production.

If a migration fails, read the error before continuing. All migrations are written to be safely re-runnable where practical.

> Note: migration `0001` requires the `pgcrypto` and `pg_trgm` extensions; Supabase provides both.

---

## 6. Create the first super admin securely

Admins are **never** created through the website. Do this once, from the SQL Editor:

1. Sign up normally through the storefront at `/register` using the intended admin email (e.g. `owner@yourdomain.com`). Confirm the email if confirmation is enabled.
2. In **SQL Editor**, run:

```sql
update public.profiles
set role = 'super_admin'
where lower(email) = lower('owner@yourdomain.com');
```

3. Verify:

```sql
select id, email, role from public.profiles where role in ('admin', 'super_admin');
```

4. Sign out and back in on the website. The **Admin dashboard** link appears in the account menu, and `/admin` is accessible.

To create additional admins, repeat with `role = 'admin'`. Never expose this SQL to the client.

---

## 7. Upload product images

1. Create products in **Admin → Products**.
2. Choose JPEG/PNG/WebP/AVIF images up to 5 MB; multiple images per product are supported.
3. Images are uploaded to the `product-images` bucket and their Storage paths are saved in `product_images`. The first image appears on cards.
4. Category images work the same way in **Admin → Categories** (`category-images` bucket).

---

## 8. Deploy the Edge Function

The `create-order` function is required for live order placement.

### Option A — Supabase CLI (recommended)

```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy create-order --no-verify-jwt false
```

The function reads `SUPABASE_URL` and `SUPABASE_ANON_KEY` from the environment that Supabase provides automatically. `verify_jwt = true` is set in `supabase/config.toml`.

### Option B — Dashboard

Supabase Dashboard → **Edge Functions** → **Create a new function**, name it `create-order`, and paste the contents of `supabase/functions/create-order/index.ts`. Create the shared `_shared/cors.ts` file too (or inline the headers).

Confirm `VITE_SUPABASE_FUNCTIONS_URL` points to `https://YOUR_PROJECT_REF.supabase.co/functions/v1`.

> For production, change `Access-Control-Allow-Origin: '*'` in `_shared/cors.ts` to your storefront domain and redeploy.

---

## 9. Run locally

```powershell
npm run dev
```

Test with the checklist in `IMPLEMENTATION_STATUS.md`. Use test accounts and test data only.

---

## 10. Build for production

```powershell
npm run build
npm run preview   # optional local check of the built output
```

Output is in `dist/`.

---

## 11. Deploy to Vercel

1. Push the repository to GitHub (make sure `.env` is **not** committed; `.gitignore` excludes it).
2. In Vercel → **Add New → Project**, import the GitHub repository.
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Add the same environment variables as in step 4 under **Project Settings → Environment Variables** (Production/Preview).
5. Deploy. `vercel.json` supplies the SPA rewrite so deep links like `/products/xyz` work.
6. In Supabase **Authentication → URL Configuration**, add `https://YOUR_VERCEL_DOMAIN/**` to redirect URLs and set the Site URL.

Supabase itself is hosted separately — no separate backend deployment is needed beyond the Edge Function in step 8.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Yellow demo banner persists | Placeholder env values | Check `VITE_SUPABASE_URL` / anon key, set `VITE_DEMO_MODE=false`, restart dev server |
| "new row violates row-level security policy" | Missing profile or wrong role | Confirm the user signed up after migration 0001 and the profile exists |
| Orders fail at checkout | Edge Function not deployed or JWT rejected | Deploy function, check `verify_jwt`, check browser console |
| Images don't display | Wrong bucket/policy or path | Check Storage policies from 0004 and that `image_path` matches an object path |
| Sign-in redirect loop | Redirect URLs not configured | Add localhost/production URLs in Supabase Auth settings |
| Vercel deep link 404 | Rewrite missing | Ensure `vercel.json` is committed |
