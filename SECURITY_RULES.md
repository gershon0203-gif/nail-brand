# Security Rules

## Roles

| Role | Capabilities |
|---|---|
| `customer` (default) | Browse catalogue; manage own profile, addresses, cart and orders |
| `admin` | All customer capabilities + product/category/order/customer management |
| `super_admin` | Same as admin; reserved for the store owner |

Roles are stored in `profiles.role`. **A customer can never become an admin through the application.**

Three independent controls prevent escalation:
1. Column-level grants: `authenticated` may only `UPDATE (full_name, phone, avatar_url)` on `profiles` — `role` and `email` are not granted.
2. Trigger `protect_profile_privileged_fields` raises an error if a JWT-authenticated update changes `role` or `email`.
3. RLS update policy on `profiles` restricts the row to `id = auth.uid()`.

To create an admin, run SQL in the Supabase SQL Editor (service role, `auth.uid()` is null) as described in `SETUP_GUIDE.md`.

## RLS matrix

All exposed tables have RLS enabled. Tables without an explicit policy deny all.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | own row or admin | own row (`id = auth.uid()`) | own row, allowed columns only | none |
| `categories` | active rows or admin | admin | admin | admin |
| `products` | active, non-archived or admin | admin | admin | admin |
| `product_images` | image of a visible product or admin | admin | admin | admin |
| `addresses` | owner or admin | owner | owner | owner |
| `carts` | owner | owner | owner | owner |
| `cart_items` | via owner's cart | via owner's cart | via owner's cart | via owner's cart |
| `orders` | owner or admin | **none** (function only) | admin (status only, by trigger) | none |
| `order_items` | via owner's/admin's order | none | none | none |
| `inventory_movements` | admin | none | none | none |

Authorization helper functions `is_admin()` / `is_super_admin()` are `SECURITY DEFINER` with a pinned `search_path` so they cannot be tricked into reading the wrong schema and do not recurse through profile RLS.

## Order security

- Orders are created only by `create_order_from_cart` (and the `create-order` Edge Function). A browser cannot `INSERT` an order: there is no insert policy and table grants were revoked.
- Every monetary value comes from the database at order time. `line_total`, `subtotal` and `total` are derived from stored product rows.
- Immutable order fields are protected by a trigger. Even an admin can only change `status`.
- Customers cannot read another customer's orders or order items — enforced by RLS subqueries on `user_id`.
- Historical snapshots (`address_snapshot`, `customer_snapshot`, `order_items` fields) remain correct even after profile edits or product archival.

## Stock security

- `add_to_cart` and `set_cart_quantity` lock the product row (`FOR UPDATE`) before comparing requested quantity with stock.
- `create_order_from_cart` locks cart/product rows in deterministic order and uses `UPDATE … WHERE stock_quantity >= quantity RETURNING …` as a second guard. A failed guard raises and the whole transaction rolls back.
- Stock changes outside ordering go through `set_stock`, which checks `is_admin()` and always writes an `inventory_movements` record.
- Products referenced by `order_items` cannot be hard-deleted (trigger) — they must be archived.

## Storage security

- Buckets `product-images` and `category-images` are public for **read** (storefront needs to display images).
- All write operations require `is_admin()` **and** the object path must begin with the matching folder (`products/…` or `categories/…`).
- Bucket configuration limits uploads to 5 MB and to `image/jpeg`, `image/png`, `image/webp`, `image/avif`. The frontend repeats these checks before upload.
- Image URLs are constructed from Storage paths in `src/lib/supabase.ts`. Do not store third-party URLs as permanent product images.

## Secrets & environment

- Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and public store settings are exposed to the browser (the `VITE_` prefix makes them public by design; the anon key is safe when RLS is correct).
- **The `service_role` key is never placed in frontend code.** The Edge Function uses the caller's JWT and an anon client; no service-role key is needed.
- `.env.example` contains placeholder names only. `.env` is gitignored.
- No API keys, passwords or tokens are hardcoded in source.
- Recommended rotation: if a real key is ever committed, rotate it in Supabase immediately.

## Input handling & errors

- Client-side validation in `src/lib/validation.ts` for emails, passwords, phone, PIN and addresses.
- Server-side validation in every SECURITY DEFINER function (auth, ownership, quantity ranges, method whitelist, stock).
- Error messages returned to the UI are intentionally generic where details could leak information (e.g. password reset always reports success).
- An ErrorBoundary catches unexpected UI failures; data-error states show a safe message plus retry.

## Pre-launch checklist

- [ ] Confirm RLS is enabled on all ten tables.
- [ ] Confirm no `service_role` key exists in client code or Vercel env vars for the frontend build.
- [ ] Restrict Edge Function CORS `Access-Control-Allow-Origin` from `*` to your production domain.
- [ ] Verify the only admin accounts are intended ones.
- [ ] Review the template privacy/terms text with a professional.
- [ ] Enable Supabase email confirmation and configure redirect URLs for your domain.
- [ ] Consider rate limiting / CAPTCHA on signup and password reset.
