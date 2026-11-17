# Security Audit Report (Phase 3 + Phase 9 static portion)

**Date:** 17 November 2026
**Scope:** Static source/migration audit + real-device client-side checks. Live Supabase authorization tests are **blocked** by missing credentials.

---

## 1. Audit method

- Read-only inspection of all 5 migrations, all service/context files and every page that touches Supabase.
- Pattern scan across `src/`, `dist/`, `supabase/`, `index.html`, `.env.example` for secret material and dangerous APIs.
- Real-device browser checks for client-side route guarding (reported separately).
- **No live database requests were made** — no anon key configured.

---

## 2. Static findings

| # | Check | Evidence | Status |
|---|---|---|---|
| 1 | RLS enabled on all exposed tables | `0002_rls_policies.sql` issues `alter table … enable row level security` for all 10 tables | Passed (static) |
| 2 | Customer can only read own profile | Policy `profiles_select_own_or_admin`: `id = auth.uid() or is_admin()` | Passed (static) |
| 3 | Customer can only manage own addresses | 4 policies on `addresses` keyed on `user_id = auth.uid()` | Passed (static) |
| 4 | Customer can only access own cart | `carts` policy `user_id = auth.uid()`; `cart_items` policies resolve through owner's cart | Passed (static) |
| 5 | Customer can only read own orders | `orders_owner_or_admin_select`; `order_items` policy resolves via order owner | Passed (static) |
| 6 | Cross-customer isolation | All private-table policies are keyed on `auth.uid()`; no broad `using (true)` on private tables | Passed (static) |
| 7 | Customer cannot self-promote to admin | Three layers: (a) column grants exclude `role`/`email`, (b) trigger `protect_profile_privileged_fields`, (c) RLS update limited to own row | Passed (static) |
| 8 | Only admins manage products | 4 product policies + 4 category policies + 4 image policies require `is_admin()` | Passed (static) |
| 9 | Only admins update inventory | `set_stock` checks `is_admin()`; `inventory_movements` has admin-only SELECT and no client write grants | Passed (static) |
| 10 | Only admins manage orders | No INSERT policy on `orders`; UPDATE policy is admin-only; `orders_protect_immutable` trigger limits fields to status | Passed (static) |
| 11 | Storage write protection | Bucket policies require `is_admin()` + correct folder prefix; 5 MB / MIME limits in bucket config and client | Passed (static) |
| 12 | No service-role key in frontend | 0 matches in `src/` and `dist/`; `supabase.ts` uses only anon key | Passed |
| 13 | No secrets in source | 0 JWT-like tokens, 0 `sk_live`, 0 `rzp_live` in source/dist. `service_role` appears only in SQL privilege grants (not a key). | Passed |
| 14 | Server-side validation | Functions validate auth, ownership, method whitelist, quantity bounds and stock; client validation also present | Passed (static) |
| 15 | No XSS sinks | `dangerouslySetInnerHTML`, `eval`, `new Function`: 0 matches | Passed |
| 16 | No localStorage business data | `localStorage` / `sessionStorage`: 0 matches | Passed |
| 17 | Git secret history | No git repository initialized — cannot audit history. `.env` is correctly gitignored. | Not tested |
| 18 | RLS behavior under real requests | Requires anon key and two test users | **Blocked** |
| 19 | Storage upload authorization under real requests | Requires anon key + test users | **Blocked** |
| 20 | Price/quantity tampering against live RPC | Requires live order flow | **Blocked** |

## 3. Notable design strengths confirmed

- Money is recalculated in `create_order_from_cart` from database rows; no browser total is accepted.
- `FOR UPDATE OF p, ci` row locks plus guarded `UPDATE … WHERE stock_quantity >= quantity` address overselling.
- Order snapshots and immutable-field trigger preserve history.
- Archive-instead-of-delete trigger on ordered products.
- `is_admin()` is `SECURITY DEFINER` with pinned `search_path`, avoiding recursive RLS.

## 4. Issues found and fixed in this phase

| Issue | Affected file | Fix | Status |
|---|---|---|---|
| Missing favicon produced a 404 console error on the real device | `index.html`, `public/favicon.svg` | Added local SVG favicon and `<link rel="icon">` | Fixed; retest pending |

## 5. Recommendations (not implemented — need approval)

- Restrict Edge Function CORS from `*` to your production domain before launch (`supabase/functions/_shared/cors.ts`).
- Add a `CHECK` that `total = subtotal - discount_amount + shipping_amount + tax_amount` for defence in depth (requires a new migration).
- Consider an idempotency key on order creation to eliminate double-submit duplicates (new migration + client change).

## 6. Status summary

| Status | Count |
|---|---|
| Passed (static) | 16 |
| Failed | 0 |
| Not tested | 2 (git history, lint — no tooling/repo) |
| Blocked | 4 (all live authorization/DB tests) |
| Fixed | 1 (favicon 404) |
