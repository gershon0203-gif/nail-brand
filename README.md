# Norwood & Co. — Full-Stack E-Commerce Storefront

A production-structured e-commerce application for a small local business. Built with React + Vite + TypeScript + Tailwind on the frontend and Supabase (PostgreSQL, Auth, Storage, RLS and Edge Functions) on the backend.

> **Brand placeholder:** "Norwood & Co." is a documented placeholder for a local home & lifestyle goods shop. Replace the name, copy, contact details and imagery with your business's real details before launch.

---

## What is included

- **Customer storefront** — home, catalogue, categories, product detail, search, cart, checkout, auth, profile, addresses, orders and tracking, contact/about/legal pages.
- **Database-backed commerce** — cart, addresses, orders and inventory live in PostgreSQL. No `localStorage` is used for business data.
- **Server-side truth** — prices, discounts, stock and order totals are calculated inside an atomic PostgreSQL function. The browser never supplies a trusted total.
- **Admin dashboard** — products, multiple images, categories, stock, orders/status, customers and statistics, protected by database roles.
- **Security** — RLS on every table, customer isolation, non-escalatable roles, admin-only storage writes, least-privilege grants.
- **COD checkout** — Cash on Delivery is a real selectable method. No payment gateway, fake transactions or card storage.
- **Future-ready seams** — shipping/payment fields and separated functions reserved for later Razorpay/Shiprocket work (not implemented).

---

## Stack

| Layer | Technology |
|---|---|
| UI | React 18, Vite 5, TypeScript, Tailwind CSS 3, React Router 6, Lucide React |
| Database | Supabase PostgreSQL 15 |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage (public read, admin write) |
| Server logic | PostgreSQL SECURITY DEFINER functions + Supabase Edge Function (Deno) |
| Deployment | Vercel (static SPA) + Supabase (backend) |

Lightweight dependency set — suitable for an 8 GB RAM laptop.

---

## Quick start

```powershell
# 1. Install
npm install

# 2. Configure
copy .env.example .env
#    Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see SETUP_GUIDE.md)

# 3. Apply SQL migrations in Supabase SQL Editor, in order:
#    supabase/migrations/0001_initial_schema.sql
#    supabase/migrations/0002_rls_policies.sql
#    supabase/migrations/0003_functions.sql
#    supabase/migrations/0004_storage.sql
#    supabase/migrations/0005_seed_optional.sql   (optional demo data)

# 4. Deploy the Edge Function (see SETUP_GUIDE.md)

# 5. Run
npm run dev
```

Open http://localhost:5173.

### Demo preview mode

No Supabase credentials yet? The repository ships with a local `.env` using `VITE_DEMO_MODE=true`. That gives an **in-memory, clearly-badged catalogue preview** (200 products, filters, sorting, pagination, product pages, cart UI) so the design and flows can be reviewed. It performs **no persistence** — auth, addresses, orders and uploads require a real Supabase project. The banner at the top of the site always labels this mode.

---

## Project structure

```
src/
  components/
    layout/      Header, Footer, CustomerLayout, AdminLayout, AuthLayout
    ui/          Button, Field, Badge, Feedback, Skeleton, Pagination, Modal, ErrorBoundary
    common/      SearchBar, SectionHeading, Breadcrumbs, DemoBanner, ProtectedRoute, StatusBadge
    catalog/     CatalogFilters, CatalogToolbar
    product/     ProductCard, ProductGrid, ProductImage, QuantitySelector
  context/       AuthContext, CartContext, ToastContext
  hooks/         useDebounce, useAsync
  lib/           supabase client, constants, utils, validation, demoData
  pages/
    customer/    17 storefront pages + checkout, reset password, catalogue
    admin/       dashboard, products, product form, categories, orders, customers
  services/      products, categories, auth, addresses, cart, orders, admin
  types/         shared domain types
supabase/
  migrations/    0001–0005 SQL migrations
  functions/     create-order Edge Function + shared CORS
```

---

## Documentation

- [PROJECT_REQUIREMENTS.md](./PROJECT_REQUIREMENTS.md) — requirement-to-implementation map and placeholders
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — tables, keys, indexes, triggers, functions
- [SECURITY_RULES.md](./SECURITY_RULES.md) — RLS matrix, roles, storage and secrets
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) — Supabase, migrations, first admin, Edge Function, Vercel deployment
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) — what's done, what's untested, next steps

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run typecheck` | TypeScript only |
| `npm run build` | Type check + production build |
| `npm run preview` | Serve the production build locally |

No deployment is performed by this repository. Deploy only after your review and approval.
