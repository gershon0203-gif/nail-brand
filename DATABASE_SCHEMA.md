# Database Schema

PostgreSQL 15 (Supabase). Migrations live in `supabase/migrations/` and must be applied in numeric order.

## Entity overview

```
auth.users ──1:1── profiles ──1:N── addresses
                      │
                      ├──1:1── carts ──1:N── cart_items ──N:1── products
                      │
                      └──1:N── orders ──1:N── order_items ──N:1── products (nullable)

categories ──1:N── products ──1:N── product_images
products ──1:N── inventory_movements
```

## Tables

### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK → `auth.users(id)` | One profile per auth user |
| `email` | text not null | Unique case-insensitively |
| `full_name`, `phone`, `avatar_url` | text | Editable by the owner |
| `role` | enum `user_role` | `customer` (default), `admin`, `super_admin`. **Not client-editable** |
| `created_at`, `updated_at` | timestamptz | Auto-managed |

### `categories`
`id` uuid PK, `name`, `slug` (unique), `description`, `image_path` (Storage path), `is_active`, `sort_order`, timestamps. Index on `(is_active, sort_order)`.

### `products`
`id` uuid PK, `name`, `slug` (unique), `short_description`, `description`, `sku` (unique), `category_id` FK → categories (SET NULL), `price numeric(12,2) >= 0`, `discount_percent` 0–90, `stock_quantity >= 0`, `is_featured`, `is_archived`, `is_active`, `sold_count`, timestamps.
Indexes: category, visibility, featured (partial), created_at, sold_count, price, trigram on name.

### `product_images`
`id` uuid PK, `product_id` FK → products (CASCADE), `path` (Storage path), `alt_text`, `sort_order`, `created_at`. Index on `(product_id, sort_order)`.

### `addresses`
`id` uuid PK, `user_id` FK → auth.users (CASCADE), `label`, `full_name`, `phone`, `house_flat`, `street`, `area`, `city`, `state`, `pin_code`, `landmark`, `is_default`, timestamps.
Unique index `addresses_one_default_per_user` on `(user_id) WHERE is_default` — guarantees one default address.

### `carts`
`id` uuid PK, `user_id` uuid **unique** FK → auth.users (CASCADE), timestamps. One cart per customer.

### `cart_items`
`id` uuid PK, `cart_id` FK → carts (CASCADE), `product_id` FK → products (RESTRICT), `quantity` 1–100, timestamps. Unique `(cart_id, product_id)`.

### `orders`
`id` uuid PK, `order_number` unique, `user_id` FK → auth.users (RESTRICT), `status order_status`, `payment_method payment_method` (`cod`), `payment_status payment_status`, `subtotal`, `shipping_amount`, `tax_amount`, `discount_amount`, `total`, `currency`, `address_snapshot jsonb`, `customer_snapshot jsonb`, `notes`, `placed_at`, timestamps.
Indexes on `(user_id, created_at desc)`, `status`, `created_at desc`.

### `order_items`
`id` uuid PK, `order_id` FK → orders (RESTRICT), `product_id` FK → products (**SET NULL**), `product_name`, `product_sku`, `product_image_path`, `quantity > 0`, `unit_price`, `line_total`, `created_at`.
Snapshots preserve historical details even if the product later changes or is archived.

### `inventory_movements`
`id` uuid PK, `product_id` FK → products (RESTRICT), `change_amount` (+/-), `quantity_after >= 0`, `reason`, `reference_id` (order id), `created_by` FK → auth.users (SET NULL), `created_at`. Append-only audit log; no client write access.

## Enums

- `user_role`: `customer`, `admin`, `super_admin`
- `order_status`: `pending`, `confirmed`, `processing`, `packed`, `shipped`, `delivered`, `cancelled`
- `payment_method`: `cod`
- `payment_status`: `pending`, `paid`, `refunded`, `not_applicable`

## Triggers

| Trigger | Purpose |
|---|---|
| `on_auth_user_created` | Creates a `profiles` row on signup using user metadata |
| `protect_profile_privileged_fields` | Blocks role/email changes from any JWT-authenticated client |
| `set_updated_at` (profiles, categories, products, addresses, carts, cart_items, orders) | Maintains `updated_at` |
| `addresses_single_default` | Clears other defaults when one address becomes default |
| `products_record_initial_stock` | Writes an inventory movement for opening stock |
| `prevent_deleting_ordered_products` | Raises if a product with order history is hard-deleted |
| `order_items_increment_sold` | Maintains `products.sold_count` for popularity sorting |
| `orders_protect_immutable` | Allows only status changes after an order is created |

## Functions (all `SECURITY DEFINER`, pinned `search_path = public`)

| Function | Access | Purpose |
|---|---|---|
| `is_admin()` / `is_super_admin()` | anon/auth/service | Role checks without recursive RLS |
| `ensure_cart()` | authenticated | Lazily creates the caller's cart |
| `get_cart_count()` | authenticated | Header badge count |
| `add_to_cart(product, qty)` | authenticated | Stock-validated add with row lock |
| `set_cart_quantity(product, qty)` | authenticated | Stock-validated set/remove |
| `remove_from_cart` / `clear_cart` | authenticated | Cart mutations |
| `set_default_address(user, address)` | authenticated | Owner-verified default switch |
| `set_stock(product, qty, reason)` | admin only | Absolute stock set + audit movement |
| `create_order_from_cart(address, method, notes)` | authenticated | **Atomic order creation** (see below) |
| `admin_dashboard_stats()` | admin only | Aggregated dashboard numbers |

### `create_order_from_cart` — atomicity and safety

1. Verifies `auth.uid()` and that the method is `cod`.
2. Verifies the address belongs to the caller; snapshots address + profile.
3. Locks cart product rows (`FOR UPDATE OF p, ci`, ordered by product id) and validates stock.
4. Recalculates every line price from `products.price` and `products.discount_percent` — browser values are never used.
5. Inserts the order with explicit 0 shipping/tax/discount placeholders.
6. Inserts `order_items` snapshots, decrements stock with a guarded `UPDATE … WHERE stock_quantity >= qty`, and writes `inventory_movements`.
7. Clears the caller's cart.
8. Returns `{ orderId, orderNumber }`.

Because PostgreSQL functions execute in a single transaction, any failure rolls back the entire order — no partial stock loss or orphaned rows. Row locks plus the guarded update prevent overselling when two customers order simultaneously.

## Migrations

| File | Contents |
|---|---|
| `0001_initial_schema.sql` | Extensions, enums, tables, indexes, integrity triggers |
| `0002_rls_policies.sql` | RLS enablement, all policies, least-privilege grants |
| `0003_functions.sql` | Cart/order/stock/statistics functions and permissions |
| `0004_storage.sql` | Buckets and storage access policies |
| `0005_seed_optional.sql` | Optional 8 categories + 200 products for testing |
