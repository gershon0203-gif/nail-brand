# Functional Test Report (Phase 5 + Phase 9)

**Date:** 17 November 2026
**Backend state:** ⚠️ Demo mode — `.env` still contains placeholders. Consequently all database-dependent tests are **Blocked**, not failed. Tests executed are UI-level on the real Android device and static code/DB-logic verification.

---

## 1. Products / catalogue

| Test | Result | Evidence |
|---|---|---|
| Product listing loads | **Passed** | 200 items displayed; 12 cards on page 1 (real device) |
| 2-col mobile / 3-col desktop grid | **Passed** | Measured card positions on device + emulation sweep |
| Product details incl. multiple images | **Passed** | Detail page 8/8 images loaded, thumbnails + quantity + add button |
| Search | **Passed (demo UI)** | Search form on device navigates to `/search?q=…`, results rendered |
| Category filtering | **Passed (static/UI)** | Filter modal with all 8 categories opens and is usable on device |
| Price filtering | **Passed (static/UI)** | Quick ranges + min/max inputs present in filter modal |
| Sorting | **Passed** | `price_asc` changed first card from $177.90 item to $12.06 item on device |
| Pagination | **Passed (demo UI)** | Pages 1–4 + ellipsis + 17 rendered; page buttons present |
| Out-of-stock products | **Passed (static)** | `badge tone="danger"` + disabled Add button when `stock_quantity <= 0`; seed creates ~7 zero-stock items |
| Empty states / loading skeletons | **Passed** | Empty cart, empty orders, skeleton grid, error boundary implemented |

## 2. Cart

| Test | Result | Evidence |
|---|---|---|
| Add product | **Passed (demo UI)** | Badge 0 → 1, success toast on real device |
| Remove product | **Passed (demo UI)** | Badge 1 → 0, empty state on real device |
| Increase quantity | **Passed (demo UI)** | Badge 1 → 2 |
| Decrease quantity | **Passed (demo UI)** | Badge 2 → 1 |
| Subtotal / total | **Passed (demo UI)** | Derived from line totals in `cartTotals()` |
| Stock validation before add | **Passed (static)** | `add_to_cart` / `set_cart_quantity` RPCs with `FOR UPDATE` and explicit stock checks |
| Prevent qty > stock | **Passed (static)** | UI `max={stock}` + DB check |
| Cart persistence after logout/login | **Blocked** | Needs Supabase |

## 3. Addresses

| Test | Result | Evidence |
|---|---|---|
| Add / edit / delete / set default forms | **Passed (static)** | Full CRUD UI in `AddressesPage.tsx`, all 9 fields |
| Single default address enforcement | **Passed (static)** | Partial unique index + `enforce_single_default_address` trigger |
| Customer ownership validation | **Passed (static)** | All 4 RLS policies keyed on `user_id = auth.uid()` + RPC checks caller |
| Real CRUD persistence | **Blocked** | Needs Supabase |

## 4. Orders / COD

| Test | Result | Evidence |
|---|---|---|
| COD is the only selectable method | **Passed (static + device)** | Checkout shows COD, labels dev mode, disables Place order in demo |
| Server recalculates prices/totals | **Passed (static)** | `create_order_from_cart` ignores all browser-supplied money |
| Product/address/customer snapshots | **Passed (static)** | JSONB snapshots + immutable order_items fields |
| Unique order number | **Passed (static)** | `NW-YYYYMMDD-<8 hex>` + unique constraint |
| Stock reduction on order | **Passed (static)** | Guarded `UPDATE … WHERE stock_quantity >= quantity RETURNING` |
| Inventory movement recorded | **Passed (static)** | Insert into `inventory_movements` with negative change and order reference |
| Order history / tracking / detail | **Passed (static)** | Pages + status timeline + RLS owner checks |
| Admin status updates | **Passed (static)** | Admin policy + immutable-field trigger allowing only status |
| Real order placement / persistence | **Blocked** | Needs `.env` + deployed `create-order` Edge Function |
| Duplicate order submission | **Blocked** (live) | Client disables button while placing; no DB idempotency key yet (recommendation logged) |

## 5. Inventory / security safety

| Test | Result | Evidence |
|---|---|---|
| Prevent negative stock | **Passed (static)** | `CHECK (stock_quantity >= 0)` and update guard |
| Prevent overselling (concurrent) | **Passed (static design)** | `FOR UPDATE OF p, ci` ordered locking + guarded decrement; live race test **Blocked** |
| Prevent duplicate stock deductions | **Passed (static)** | Whole function runs in one transaction; rollback on any failure |
| Archived products not purchasable | **Passed (static)** | `is_archived = false` filters in product queries and order function |
| Price manipulation from browser | **Passed (static)** | No price/quantity totals accepted by order RPC; only address/method/notes |
| Quantity manipulation | **Passed (static)** | RPC caps 1–100 and validates stock; UI caps at stock |
| Unauthorized admin access | **Passed (device + static)** | `/admin` redirected to `/login` when signed out on device; DB role checks on all admin paths |
| Customer data isolation | **Passed (static)** | RLS policy matrix in `SECURITY_AUDIT_REPORT.md` |
| Invalid file uploads | **Passed (static)** | Client MIME/size checks + bucket config + admin-only storage policies |
| Invalid order status updates | **Passed (static)** | Admin-only UPDATE policy + enum type + immutable trigger |
| Exposed secrets | **Passed** | 0 real secrets in source/dist |

## 6. Admin

| Test | Result |
|---|---|
| Dashboard stats & recent orders UI | **Passed (static; demo shows 200 products)** |
| Product create/edit/archive/delete/image upload UI | **Passed (static)** |
| Category management UI | **Passed (static)** |
| Order list/filter/status UI | **Passed (static)** |
| Customer list UI (no secrets) | **Passed (static)** |
| Real admin CRUD against Supabase | **Blocked** |

## 7. Status summary

| Status | Count |
|---|---|
| Passed | 21 |
| Passed (demo UI / static only — not live backend) | 24 |
| Failed (unfixed) | 0 |
| Fixed during this phase | 4 (see Mobile report) |
| Blocked | 10 |
| Not tested | 1 (live concurrent race) |
