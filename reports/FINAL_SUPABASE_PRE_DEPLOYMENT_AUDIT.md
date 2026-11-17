# FINAL Supabase Pre-Deployment Audit — Master Verification

**Date:** 17 November 2026
**Project:** `ecommerce-store` · ref `vmdmniiynbcysbbrhbqo` · org `pdpfkbmdufgtovpqkisj`
**Directory:** `C:\Users\sunit\localbiz-ecommerce`

**Statuses used:** PASS · FAIL · BLOCKED · NOT VERIFIED

**Rules honoured:** No deploy. No migrations. No production data changes. No orders/payments/shipments. No RLS/policy changes. No secrets printed. No invented domain. No Docker install.

---

## A. Project Status

| Check | Status | Evidence |
|---|---|---|
| CLI installed & authenticated | **PASS** | `supabase --version` → 3.0.0; `supabase projects list --output-format json` returned the account's projects (authentication required for this) |
| Hosted project exists | **PASS** | projects list → `ref=vmdmniiynbcysbbrhbqo`, `name=ecommerce-store`, `status=ACTIVE_HEALTHY`, region ap-southeast-2 |
| **Hosted project linked** | **PASS** | projects list → `"linked": true` for this ref; local `supabase/.temp/project-ref` = `vmdmniiynbcysbbrhbqo`; `linked-project.json` → `ref`, `name=ecommerce-store`, `organization_id=pdpfkbmdufgtovpqkisj` |
| Organization ID matches | **PASS** | `pdpfkbmdufgtovpqkisj` in both CLI list and local link metadata |
| `config.toml` `project_id` | **PASS (cosmetic only)** | value `norwood-co-ecommerce` is a local label, not the ref; hosted deploy uses the link metadata, so this does not block deployment |
| Docker/Podman absent | **PASS (limitation recorded)** | `supabase status` fails on local container health only. This does **not** indicate remote linking failure — verified independently above. No local services were started |

**Correction to the previous audit:** the earlier report marked linking as FAIL because it ran before the link metadata was created. It is now verified PASS with fresh evidence.

---

## B. Database Status (live, remote, read-only)

Method: `supabase db query --remote=vmdmniiynbcysbbrhbqo --read-only` (read-only transaction on hosted project).

| Check | Status | Evidence |
|---|---|---|
| Exact intended query from the project | **PASS** | Found in `reports/EDGE_FUNCTION_DEPLOYMENT_REPORT.md`; re-executed → **exactly 5 rows** (list below) |
| Tables exist | **PASS** | `tables_count = 10`: addresses, cart_items, carts, categories, inventory_movements, order_items, orders, product_images, products, profiles |
| Columns / PK / FK / unique / indexes | **PASS** | `information_schema.columns` and `pg_constraint` checks in prior audit: all 10 tables have PKs, expected FKs, unique constraints and 35 indexes total |
| RLS enabled | **PASS** | `rls_enabled_tables = 10` (all exposed tables); none forced |
| Policies | **PASS** | `policies_count = 28`; critical ones: `orders_owner_or_admin_select`, `orders_admin_update`, `order_items_owner_or_admin_select`, `products_public_read` + 3 admin writes, `profiles_select_own_or_admin` / `insert_own` / `update_own` |
| No direct order INSERT | **PASS** | `pg_policies` on `orders` contains only SELECT and UPDATE — browser cannot insert orders |
| Triggers | **PASS** | `triggers_count = 13`, including `protect_profile_privileged_fields`, `orders_protect_immutable`, `products_prevent_delete_ordered`, `on_auth_user_created`, `addresses_single_default`, `order_items_increment_sold`, `products_record_initial_stock` |
| Storage | **PASS** | 2 buckets (`product-images`, `category-images`, both public) + 4 policies (public read, admin write for each) |
| Column grants on `profiles.role` | **NOT VERIFIED** | Grant query returned no rows via hosted SQL API; compensating trigger `protect_profile_privileged_fields` verified present |

### 5-row function verification result (fresh)

| Function | Arguments | Returns | SECURITY DEFINER |
|---|---|---|---|
| `add_to_cart` | `p_product_id uuid, p_quantity integer` | `jsonb` | true |
| `admin_dashboard_stats` | *(none)* | `jsonb` | true |
| **`create_order_from_cart`** | **`p_address_id uuid, p_payment_method text, p_notes text`** | **`jsonb`** | **true** |
| `set_cart_quantity` | `p_product_id uuid, p_quantity integer` | `jsonb` | true |
| `set_stock` | `p_product_id uuid, p_quantity integer, p_reason text` | `void` | true |

### `create_order_from_cart` body markers (read-only `pg_get_functiondef` analysis)

All true: `checks_auth_uid`, `checks_address_owner`, `locks_stock_rows` (`FOR UPDATE`), `guarded_stock_update` (`stock_quantity >= qty`), `writes_order_items`, `writes_inventory_movement`, `server_price_calc` (`discount_percent`), `clears_cart`.

| Property | Status | Note |
|---|---|---|
| Exists / signature / return type / security mode | **PASS** | matches application caller exactly |
| Authorization checks | **PASS** | `auth.uid()` null check + address ownership |
| Stock validation & concurrent protection | **PASS** (code verified) | row locks + guarded decrement; live race test not executed |
| Server-side price calculation | **PASS** | derives from DB `price`/`discount_percent` |
| Atomicity / rollback | **PASS** (design) | single PostgreSQL function = one transaction |
| Duplicate order prevention | **NOT VERIFIED** | no idempotency key; client disables button while placing (recommended future hardening) |
| Migration 0003 vs live DB | **PASS** | every checkable object present; no mismatch |

---

## C. Edge Function Status

| Check | Status | Evidence |
|---|---|---|
| Source & shared file present | **PASS** | `create-order/index.ts` (85 lines), `_shared/cors.ts` |
| JWT verification enabled | **PASS** | `verify_jwt = true` in `config.toml`; `supabase.auth.getUser()` in code |
| Identity from verified token | **PASS** | caller JWT forwarded as global `Authorization` header so `auth.uid()` resolves in RPC |
| No orders for another account | **PASS** | DB RPC checks address ownership against `auth.uid()` |
| Method validation | **PASS** | OPTIONS → 200; non-POST → 405 |
| Body validation | **PASS** | JSON parse → 400; requires `address_id`; `payment_method` whitelist `cod` |
| Invalid cart / empty cart / out-of-stock / insufficient stock | **PASS (delegated)** | all handled inside `create_order_from_cart` with explicit exceptions; no client trust |
| Server-side pricing | **PASS** | function accepts no price/quantity/total fields |
| No DB authorization bypass | **PASS** | anon key + caller JWT only; no service-role key anywhere |
| Error handling | **PASS** | safe 400/401/405/500 JSON, generic 500 message, no stack traces/secrets |
| Imports / dependencies | **PASS (static)** | `npm:@supabase/supabase-js@2` valid Deno specifier; relative `_shared/cors.ts` sibling bundled by CLI — **runtime NOT VERIFIED** (not deployed, Deno absent locally) |
| Invocation URL matches caller | **PASS** | frontend uses `supabase.functions.invoke('create-order')`, URL derived from project URL |
| No unsafe logging / secrets | **PASS** | no token/body logging, no credentials in source |

---

## D. CORS Status

| Check | Status | Evidence |
|---|---|---|
| Wildcard `*` removed | **PASS** | current file uses an explicit allowlist |
| Local dev origins | **PASS** | `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:4173`, `http://127.0.0.1:4173` (Vite port = 5173 verified in `vite.config.ts`) |
| Fail-closed behaviour | **PASS** | unknown origins receive no `Access-Control-Allow-Origin`; `Vary: Origin` set |
| **Production origin identified from project evidence** | **BLOCKED** | only `vercel.json` (SPA rewrite) exists; no Netlify config, no `.vercel` metadata, no domain in docs/env. The only URLs are placeholder examples inside `cors.ts` comments — **not** reliable evidence |
| Production origin configured | **BLOCKED** | still `https://YOUR_PRODUCTION_DOMAIN.example` |

**No code changed.** I will not guess a Vercel/Netlify URL. Production browser requests would be blocked by CORS until you provide the exact origin and approve the change. Localhost development is correctly configured and restricted.

---

## E. Frontend Status

| Check | Status | Evidence |
|---|---|---|
| Env variable names | **PASS** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_FUNCTIONS_URL`, `VITE_DEMO_MODE`, store settings |
| Supabase URL | **PASS** | valid `https://<ref>.supabase.co`; live REST probes returned 200 |
| Publishable key | **PASS** | `sb_publishable_*` present, correct format (not JWT-shaped — correctly accepted by the fixed guard in `src/lib/supabase.ts`); live REST worked |
| `VITE_DEMO_MODE` | **PASS** | `false` |
| Function endpoint | **PASS** (caller) / cosmetic placeholder | `functions.invoke('create-order')` derives URL from client; `VITE_SUPABASE_FUNCTIONS_URL` placeholder is unused |
| `service_role` / `sb_secret_` / real JWT / `sk_live` / `rzp_` in frontend | **PASS** | 0 matches |
| `razorpay` / `shiprocket` text | **PASS** | 2 matches each — UI text explicitly stating they are NOT integrated (no API calls, no SDK) |
| Git credential history | **NOT VERIFIED** | no `.git` repo exists; `.gitignore` correctly excludes `.env`, `.env.local`, `.env.*.local` |
| Backend-unavailable handling | **PASS** | config guard falls back to clearly-labelled demo mode; ErrorBoundary + error states present |
| Secret values printed | **PASS** | none |

---

## F. Security Findings

| Severity | Finding | Status |
|---|---|---|
| Critical | None found | — |
| High | None found | — |
| Medium | **Production CORS placeholder** — production browser calls will fail until the real origin is set | **BLOCKED** (needs your domain + approval) |
| Medium | No DB idempotency key on order creation — duplicate submissions are mitigated client-side only; recommend adding later | **NOT VERIFIED** live / recommended |
| Low | `config.toml` `project_id` is a local label, not the ref — cosmetic, no deployment impact | **PASS** with note |
| Low | Git history cannot be audited (no repo) — `.gitignore` is correct | **NOT VERIFIED** |
| Low | `profiles.role` column-level grant not directly verifiable — compensating trigger verified | **NOT VERIFIED** / mitigated |

No security policy was weakened or disabled during this audit.

---

## G. Testing Status

**Executed in this audit (read-only):** CLI auth/link checks; 5-row function query; function-body safety markers; table/RLS/policy/trigger/index/storage counts; Edge Function static code audit; frontend config and secret scans; CORS/config review.

| Test | Status | Reason |
|---|---|---|
| Unauthenticated request rejection | **PASS (static)** | JWT checks in code + `verify_jwt = true`; live 401 probe not run against deployed function |
| Invalid input rejection | **PASS (static)** | code validation present; not executed live |
| Empty cart / out-of-stock / insufficient stock rejection | **PASS (code + DB)** | exceptions exist in RPC body markers; not executed live |
| Price manipulation prevention | **PASS (code)** | no money fields accepted; server derives prices |
| Customer data isolation | **PASS (policies)** | owner-scoped RLS policies present; multi-user live test not executed |
| Admin access restrictions | **PASS (policies + trigger)** | admin-only write policies; no live cross-role test |
| Duplicate request protection | **NOT VERIFIED** | client-side button disable only |
| Concurrent stock updates | **NOT VERIFIED** | row-lock design verified; no live race test (would create orders) |
| COD order creation E2E | **BLOCKED** | requires deployment + test account + cart; explicitly not performed |
| Transaction rollback | **NOT VERIFIED** (design verified) | would require forcing a failure with test data |

### Safe test plan for after approval (isolated test data only)

1. Create a dedicated test user via `/register` with a throwaway email; confirm email.
2. Add a test address; add a low-stock test product to cart.
3. Place COD order via browser; verify order row, `order_items` snapshots, stock decrement and one `inventory_movements` row.
4. Repeat submit rapidly to check duplicate behaviour; verify RLS by signing in as a second test user and confirming the first order is invisible.
5. Sign in as a test admin; change order status; confirm customer sees the update.
6. Delete/deactivate test data with owner approval afterwards.

**No production customer accounts or real data were used.**

---

## H. Deployment Readiness

| Item | Status |
|---|---|
| Hosted project linked & authenticated | **PASS** |
| Database schema / functions / RLS / storage | **PASS** |
| Edge Function code, JWT, validation, dependencies | **PASS** (runtime unverified) |
| Frontend config & publishable key | **PASS** |
| CORS for production | **BLOCKED** — exact domain required |
| Your explicit approval | **BLOCKED** — required |

### Deployment blockers (plain language)

1. **Production domain unknown** — I need the exact origin (e.g. `https://your-store.vercel.app`). Without it, production browser calls will be blocked by CORS.
2. **Your approval** — required even if all checks pass.

Everything else is technically ready.

### Exact deployment command (do not run until blockers cleared)

```powershell
cd C:\Users\sunit\localbiz-ecommerce
supabase functions deploy create-order
```

No `supabase link` needed (verified linked). No migrations. No `supabase secrets set` — `SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected automatically; no service-role key is needed.

### Post-deployment verification commands (read-only)

```powershell
supabase functions list --project-ref vmdmniiynbcysbbrhbqo
supabase functions logs create-order --project-ref vmdmniiynbcysbbrhbqo

# Preflight probe (no order created): expect 200 + Access-Control-Allow-Origin for an allowed origin
$body = @{ Origin = 'http://localhost:5173'; 'Access-Control-Request-Method' = 'POST' }
Invoke-WebRequest -Uri 'https://vmdmniiynbcysbbrhbqo.supabase.co/functions/v1/create-order' -Method Options -Headers $body -UseBasicParsing
```

Then execute the safe test plan in section G with test data only.

### Rollback considerations

- Rollback = remove the deployed function in Dashboard → Edge Functions (or re-deploy a previous version from Git history once a repo exists).
- Removing the function affects only future order placement; existing orders, stock and inventory history are untouched and remain in the database.
- No database changes were made, so there is nothing to roll back in Postgres.

---

## FINAL STATUS

**Hosted deployment is technically ready except for the production CORS domain and your approval.**

**STOPPED. Nothing deployed. No database modifications. No orders, payments or shipments. No CORS file changed.**

What I still need from you:
1. Your exact production frontend origin (scheme + host, no trailing slash) — or explicit instruction to keep the placeholder for now.
2. Explicit approval to run `supabase functions deploy create-order`.
