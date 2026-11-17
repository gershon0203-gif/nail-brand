# Final Pre-Deployment Readiness Report

**Date:** 17 November 2026
**Scope:** Read-only live checks + static review. **Nothing deployed. No DB writes. No secret values printed.**

---

## 1. Migration 0003 applied in live database — verification

### Live read-only REST probes (anonymous publishable key, no function executed with side effects)

| Probe | HTTP | Interpretation |
|---|---|---|
| `GET /rest/v1/products?select=id&limit=1` | 200 | products table exists and is readable |
| `GET /rest/v1/categories?select=id&limit=1` | 200 | categories table exists and is readable |
| `GET /rest/v1/profiles?select=id&limit=1` | 401 | Expected — RLS blocks anonymous profile reads |
| `GET /auth/v1/settings` | 200 | Supabase Auth project reachable |
| `GET /rest/v1/rpc/get_cart_count` | 200 (`0`) | Migration 0003 function exists and executes read-only |
| `GET /rest/v1/rpc/is_admin` | 200 (`false`) | Migration 0002 helper exists |
| `GET /rest/v1/rpc/is_super_admin` | 200 (`false`) | Migration 0002 helper exists |
| `GET /rest/v1/rpc/admin_dashboard_stats` | 401 | Migration 0003 function exists; admin guard raised |
| `GET /rest/v1/rpc/ensure_cart` | 401 | Migration 0003 function exists; auth guard raised |
| `GET /rest/v1/rpc/clear_cart` | 401 | Migration 0003 function exists; auth guard raised |
| `GET /rest/v1/rpc/set_stock` | 404 | Required parameters missing on GET (same for create_order_from_cart) — inconclusive |
| `GET /rest/v1/rpc/create_order_from_cart` | 404 | Required parameters missing on GET — inconclusive |
| `GET /rest/v1/rpc/<fake_name>` | 404 | Control case |

**Conclusion:** Strong evidence that migrations **0001–0003 were applied** (multiple named functions from 0002/0003 resolve with their guards). `create_order_from_cart` specifically cannot be confirmed via GET because PostgREST requires its parameters; calling it via POST would mutate state, so I did **not** do that.

**Definitive read-only confirmation you can paste in SQL Editor (one line, no writes):**

```sql
select p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in
('create_order_from_cart','add_to_cart','set_cart_quantity','set_stock','admin_dashboard_stats')
order by p.proname;
```

Expected: 5 rows, with `create_order_from_cart` args = `p_address_id uuid, p_payment_method text, p_notes text`.

| Status | |
|---|---|
| Passed (live evidence) | 9 probes |
| Inconclusive (needs SQL above) | 1 (`create_order_from_cart` specifically) |

---

## 2. Frontend publishable key — confirmed correct (bug found and fixed)

| Check | Result |
|---|---|
| Key class | `sb_publishable_*` (Supabase's current publishable key format) — **correct**, not a secret key |
| Key length / whitespace | 46 chars, no whitespace — valid for this format |
| Live REST request with key | HTTP 200 for products/categories/auth settings — **key works** |
| ⚠️ **Bug found** | `src/lib/supabase.ts` `isSupabaseConfigured` required `rawKey.length > 60`, which rejected valid 46-char publishable keys → app would silently stay in **demo mode** despite `VITE_DEMO_MODE=false` |
| **Fix applied** | Accept `sb_publishable_*` (>20 chars) OR legacy JWT `eyJ…` (>60 chars) |
| Retest | `npm run typecheck` + `npm run build` passed after fix |

`VITE_SUPABASE_FUNCTIONS_URL` is still a placeholder but **non-blocking**: `supabase.functions.invoke()` derives the URL from the Supabase client. (Optional to set for clarity.)

---

## 3. CORS restricted (fail-closed)

`supabase/functions/_shared/cors.ts` rewritten:

- ✅ Allowed: `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:4173`, `http://127.0.0.1:4173`
- ⚠️ Production origin: `https://YOUR_PRODUCTION_DOMAIN.example` placeholder — **you chose to keep the placeholder**, so you must replace it before deploying or production browser calls will be blocked (fail-closed by design)
- ✅ Any other origin receives **no** `Access-Control-Allow-Origin` header; `Vary: Origin` included
- ✅ `index.ts` now calls `corsHeadersFor(req)` for OPTIONS and every JSON response

---

## 4. JWT authentication & server-side authorization — verified

| Control | Evidence | Status |
|---|---|---|
| `verify_jwt = true` | `supabase/config.toml` `[functions.create-order]` | Ready |
| Caller JWT read | `req.headers.get('Authorization')` | Ready |
| JWT validated | `supabase.auth.getUser()` → 401 on invalid | Ready |
| JWT forwarded to RPC | Client created with `global.headers.Authorization` so `auth.uid()` resolves | Ready |
| Server-side auth in DB | `create_order_from_cart` starts with `auth.uid()` null check and address ownership check (`user_id = v_user`) | Ready |
| No browser-supplied money | Only `address_id`, `payment_method`, `notes` accepted; totals computed from DB rows | Ready |
| Payment method whitelist | `cod` only | Ready |

---

## 5. Secret exposure scan — clean

| Pattern | Matches in `src/` + `dist/` | Notes |
|---|---|---|
| `service_role` | 0 | — |
| `SUPABASE_SERVICE_ROLE` | 0 | — |
| Real JWT-like keys | 0 | — |
| `sk_live`, `rzp_`, payment secrets | 0 | — |
| `sb_secret_` | 1 | **False positive** — minified `@supabase/supabase-js` vendor code checking `key.startsWith("sb_secret_")`; not a credential |

Frontend exposes only `VITE_*` public variables (names previously listed). `.env` gitignored. No secrets printed in this report.

---

## 6. Final deployment checklist

- [x] `create-order` function source exists and is the only COD function needed
- [x] Dependencies (`npm:@supabase/supabase-js@2`, `_shared/cors.ts`) present
- [x] `verify_jwt = true`, JWT validation, server-side `auth.uid()` checks
- [x] CORS restricted + fail-closed (localhost done; **production origin placeholder pending**)
- [x] No service-role/secret keys in frontend
- [x] Publishable key format verified live; client guard bug fixed; build passes
- [x] Strong live evidence migrations 0001–0003 applied (definitive one-line SQL provided above)
- [ ] **Replace `https://YOUR_PRODUCTION_DOMAIN.example` with your real origin** in `supabase/functions/_shared/cors.ts`
- [ ] **Run the one-line SQL check** above and confirm 5 rows
- [ ] `supabase login` and `supabase link --project-ref <YOUR_PROJECT_REF>`
- [ ] Deploy function (commands below) — **awaiting your approval**
- [ ] Set Vercel env vars and verify Supabase Auth redirect URLs include your domain
- [ ] Test: register test user → add address → add to cart → place COD order → verify order + stock in Dashboard

---

## 7. Exact commands (DO NOT RUN UNTIL YOU APPROVE)

```powershell
# 1. Authenticate and link (run from C:\Users\sunit\localbiz-ecommerce)
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>

# 2. Verify link (read-only)
supabase db remote commit --dry-run   # optional; or simply check `supabase status`

# 3. Deploy the single COD function
supabase functions deploy create-order

# 4. (After deployment) invoke from the browser and verify an order is created
```

No secrets need to be created via `supabase secrets set` — `SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected automatically.

---

## 8. Status summary

| Status | Count |
|---|---|
| Passed / Ready | 18 |
| Fixed in this phase | 2 (publishable-key guard, CORS wildcard) |
| Pending user action | 3 (production origin, SQL confirmation, CLI login/link) |
| Blocked | 0 (nothing blocks deployment except the 3 pending actions + your approval) |
| Deployed | 0 |
