# Supabase Verification Report (Phase 2)

**Date:** 17 November 2026
**Status:** ⚠️ **LIVE SCHEMA VERIFICATION BLOCKED** — static verification only performed.

---

## 1. Access situation (honest statement)

| Item | Reality |
|---|---|
| Migration files applied (user statement) | Reported as applied by the project owner |
| Frontend `.env` Supabase URL | Placeholder — not configured |
| Frontend `.env` anon key | Placeholder — not configured |
| Supabase CLI linked to project | No |
| Read-only SQL Editor results | Requested; **not yet received** at time of writing |
| Live schema inspection | **Not performed** |

I have **not** verified that any table actually exists in the Supabase project. The section below is a **static expectation derived from reading the migration files**, not evidence of a live database.

---

## 2. What was statically verified in migration files

All five migration files are present and non-empty:

| File | Size | Purpose | Static check |
|---|---|---|---|
| `0001_initial_schema.sql` | 16,729 B | Tables, enums, indexes, integrity triggers | Present |
| `0002_rls_policies.sql` | 10,133 B | RLS, policies, grants, admin helpers | Present |
| `0003_functions.sql` | 17,069 B | Cart/order/stock/statistics functions | Present |
| `0004_storage.sql` | 2,142 B | Buckets and storage policies | Present |
| `0005_seed_optional.sql` | 3,354 B | 8 categories + 200 products (optional) | Present |

### Expected tables (10 + Supabase-managed storage)

| # | Table | Expected key constraints (from migration) |
|---|---|---|
| 1 | `profiles` | PK `id` → auth.users; unique `lower(email)`; role enum default `customer` |
| 2 | `categories` | PK `id`; unique `slug` |
| 3 | `products` | PK `id`; unique `slug`, `sku`; FK `category_id` → categories (SET NULL); checks price ≥ 0, discount 0–90, stock ≥ 0 |
| 4 | `product_images` | PK `id`; FK `product_id` → products (CASCADE); index `(product_id, sort_order)` |
| 5 | `addresses` | PK `id`; FK `user_id` → auth.users (CASCADE); partial unique one default per user |
| 6 | `carts` | PK `id`; **unique** `user_id` → auth.users (CASCADE) |
| 7 | `cart_items` | PK `id`; FK cart/products; unique `(cart_id, product_id)`; quantity 1–100 |
| 8 | `orders` | PK `id`; unique `order_number`; FK `user_id` (RESTRICT); JSON snapshots; 7 status enum |
| 9 | `order_items` | PK `id`; FK order (RESTRICT) / product (SET NULL); immutable snapshots |
| 10 | `inventory_movements` | PK `id`; FK product (RESTRICT); `change_amount`, `quantity_after`, `reason` |

Additional tables expected from Supabase itself: `storage.buckets`, `storage.objects`, `auth.users` — not part of the project migrations.

### Expected triggers (8 content + timestamp triggers)

`on_auth_user_created`, `protect_profile_privileged_fields`, `set_updated_at` (×7 tables), `addresses_single_default`, `products_record_initial_stock`, `prevent_deleting_ordered_products`, `order_items_increment_sold`, `orders_protect_immutable`.

### Expected functions

`is_admin`, `is_super_admin`, `ensure_cart`, `get_cart_count`, `add_to_cart`, `set_cart_quantity`, `remove_from_cart`, `clear_cart`, `set_default_address`, `set_stock`, `create_order_from_cart`, `admin_dashboard_stats`, plus internal trigger functions.

### Migration consistency observations (static)

| Check | Result |
|---|---|
| Ordering documented in files (0001 → 0005) | Passed |
| pg_trgm extension required by index at top of 0001 | Passed (fixed earlier) |
| `inventory_movements` table created after trigger functions that reference it | Passed — plpgsql bodies resolved at execution |
| RLS enabled on all 10 tables | Passed (in 0002) |
| No `DROP TABLE` / destructive statements in migrations | Passed |
| Seed uses `ON CONFLICT DO NOTHING` | Passed (idempotent) |

---

## 3. Checks that require live access — all **Blocked**

- Actual table/column existence and data types
- Actual PK/FK/unique constraints
- Actual indexes and their definitions
- Actual triggers and functions present
- RLS `relrowsecurity` flags
- Actual policy definitions and role grants
- Storage buckets and storage policies
- Row counts / seed data present
- Trigger behavior on a real insert

---

## 4. Exact action needed from you

I saved a ready-to-run read-only query at `reports/tools/verify_schema.sql`.

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Paste the entire file, click **Run**
3. Paste the result back to me (text is fine; **do not include any secret**)

Once received I will:
- compare expected vs actual table-by-table,
- flag any missing/renamed columns, constraints, indexes, triggers or functions,
- update this report with Passed/Failed per item,
- propose **additive, non-destructive** corrective migrations only with your approval.

---

## 5. Status summary

| Status | Items |
|---|---|
| Passed | Migration files present and statically reviewed |
| Failed | None |
| Not tested | All live database checks |
| Blocked | Entire live schema verification (no credentials, no CLI link, no query results yet) |
| Fixed | None in database (no changes made) |
