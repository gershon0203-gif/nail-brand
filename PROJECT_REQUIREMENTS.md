# Project Requirements & Implementation Map

This document maps the requested requirements to the code and clearly records placeholders and known limitations.

## Business placeholders (replace before launch)

| Item | Placeholder used | Where to change |
|---|---|---|
| Business name | Norwood & Co. | `src/lib/constants.ts`, `.env` (`VITE_STORE_NAME`) |
| Tagline | "Thoughtful goods, close to home." | `src/lib/constants.ts` |
| Contact email / phone / address | `hello@norwoodandco.example`, `+1 (555) 010-2040`, `128 Willow Lane…` | `src/lib/constants.ts` |
| Currency | USD (`en-US`) | `src/lib/constants.ts`, migration `0003` |
| Categories | 8 lifestyle categories | migration `0005_seed_optional.sql`, admin Categories page |
| Legal pages | Starter template text with warning banners | `PrivacyPage.tsx`, `TermsPage.tsx` |
| Product imagery | Local SVG placeholders in demo mode; real uploads go to Supabase Storage | `public/images/demo/`, admin Products page |
| Shipping / tax | Fixed at 0 in this phase | `create_order_from_cart` in `0003_functions.sql` |
| Free shipping threshold | Display constant only (not yet applied by server) | `src/lib/constants.ts` |

## Requirement coverage

### 1. Stack
✅ React + Vite + TypeScript + Tailwind + React Router + Lucide. ✅ Supabase Postgres/Auth/Storage/RLS/Edge Function. ✅ Vercel-ready (`vercel.json` SPA rewrites). ✅ Lightweight dependency set.

### 2. Design
✅ Premium minimal direction, warm neutral palette, forest/clay accents, serif display type, generous spacing, subtle animations, mobile-first responsive. Avoided neon/cyberpunk/heavy gradients.

### 3. Customer pages
✅ Home, All products, Category, Category index, Product detail, Search, Cart, Checkout, Login, Register, Forgot password, Reset password, Profile, Addresses, My orders, Order detail/tracking, Contact, About, Privacy, Terms, 404.
✅ Homepage: hero, search, featured categories, featured/latest/best-selling products, promotional banners, header, footer.

### 4. Catalogue
✅ ~200 products (seed + demo generator). Cards show image, name, price, original price, discount %, stock state, Add to cart, View details.
✅ 3-column desktop / 2-column mobile grid, 12 per page, database pagination + Load-more-style numbered paging.
✅ Detail page: multiple images, description, prices, stock, quantity selector, add to cart, related products.
✅ Search, category filter, price filter, featured filter, sorting (newest/price/popular/name), empty/loading states.

### 5. Authentication
✅ Register, login, logout, forgot/reset password, protected customer pages, profile management.
✅ Customers can only read/update their own profile, addresses, cart and orders (RLS). Roles cannot be changed from the profile form (column grants + trigger).

### 6. Cart
✅ DB-backed (carts, cart_items). Add/remove/increase/decrease, count badge, subtotal/total.
✅ Stock validated server-side by `add_to_cart` / `set_cart_quantity` RPCs with row locks. Quantity capped at stock and at 100. Cart persists per account.

### 7. Addresses
✅ Full CRUD + default address. All requested fields present. Single default enforced by a partial unique index and a trigger. Owner-only RLS.

### 8. Orders
✅ Login → cart → address → review → COD → atomic server-side order creation → history → admin status management → customer tracking.
✅ Statuses: pending, confirmed, processing, packed, shipped, delivered, cancelled.
✅ Unique order number, customer snapshot, address snapshot, item snapshots (name/SKU/image/price/qty), subtotal/total, status, date. Immutable financial fields.

### 9. Temporary checkout
✅ Real COD selection. Clearly labelled development-mode notice. Server-side price/total/stock calculation. No Razorpay, no Shiprocket, no fake transactions, no card fields.

### 10. Inventory
✅ Stock per product, in-stock/out-of-stock UI, purchase prevention, safe decrement inside the order function with row locks, `inventory_movements` audit log, archive-instead-of-delete for products with orders (DB trigger).

### 11. Admin
✅ Protected dashboard with totals and recent orders. Product CRUD, multi-image upload, prices/discounts/descriptions/categories/stock/featured toggle. Category CRUD + image upload. Order list/search/filter/detail/status update. Customer list + order history (no secrets). Server-side `super_admin`/`admin`/`customer` role system.

### 12. Database
✅ All 10 requested tables, PKs, FKs, indexes, unique constraints, timestamps, checks, triggers. SQL migrations provided. Atomic order + inventory operation via one SECURITY DEFINER function.

### 13. Supabase security
✅ RLS on all exposed tables, customer isolation, admin helper functions, storage policies, server-side validation, input validation, safe error messages, no service-role key in frontend, `.env.example` with placeholders only, `.env` gitignored.

### 14. Image storage
✅ Admin uploads to `product-images` / `category-images` buckets, multiple images per product, paths stored in DB, file type/size validation, public read with admin-only writes.

### 15. Future integration readiness
✅ Payment and shipping logic isolated: zero shipping/tax placeholders in the order function, `payment_method`/`payment_status` columns, separate function boundary reserved for verification/webhooks/refunds and shipment sync. **Not implemented, not called, no fake responses.**

### 16. Performance/responsiveness
✅ Mobile-first Tailwind layout, lazy images, DB-side pagination, reusable components, ErrorBoundary, skeletons, empty states, form validation, accessible labels/buttons, reduced-motion support.

### 17. Structure/docs
✅ Separated components/pages/layouts/hooks/services/context/types/lib/admin/customer. All six requested documents present.

### 18/19. Workflow & testing
✅ TypeScript check and production build pass. Backend-dependent tests cannot run without credentials and are explicitly listed in `IMPLEMENTATION_STATUS.md`. No deployment performed.

## Deliberate non-features in this phase

- No online payment, no payment verification/webhooks/refunds.
- No Shiprocket serviceability/rates/shipment/AWB/label/tracking sync.
- No product reviews, wishlists, coupons, tax engine or multi-warehouse inventory.
- No real email sending for contact form (it opens the visitor's email app instead).
- No automated test suite yet (manual verification checklist provided).
