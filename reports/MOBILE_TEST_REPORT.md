# Mobile Test Report (Phase 6)

**Date:** 17 November 2026
**Backend state:** ⚠️ Demo mode (no Supabase credentials in `.env`) — all backend-dependent tests are **Blocked** and clearly marked.

---

## 1. Device and connection details (evidence)

| Item | Evidence |
|---|---|
| Device connected | `adb devices` → `V4CI99INLVBQOJVW  device` |
| USB debugging authorized | Yes (state `device`, not `unauthorized`) |
| Device model | OPPO CPH2823 (`CPH2823IN`), Android 16 (SDK 36) |
| Screen | 720 × 1570 px @ 320 dpi |
| Browser | Google Chrome `157.0.8103.51` on device (`com.android.chrome`) |
| Remote debugging | `adb forward tcp:9222 localabstract:chrome_devtools_remote` → CDP reachable at `127.0.0.1:9222` |
| Target tab | Exactly `http://localhost:5173/` — all other browser tabs were ignored |
| URL reachability | `adb reverse tcp:5173 tcp:5173` → phone loads laptop dev server via `localhost:5173` |
| Browser viewport | **391 × 757 CSS px**, DPR 2 (measured via CDP, not assumed) |
| Language / network | `en-IN`, `navigator.onLine = true` |

This is **real physical-device testing**, not emulation. Screenshots were captured from the device via `Page.captureScreenshot`.

---

## 2. Screenshots (captured from the device)

| File | Page |
|---|---|
| `reports/screenshots/01_home_real_device.png` | Home |
| `reports/screenshots/02_products_real_device.png` | All products (2-column grid visible) |
| `reports/screenshots/03_product_detail_real_device.png` | Product detail |
| `reports/screenshots/04_cart_real_device.png` | Cart (empty state) |
| `reports/screenshots/05_login_real_device.png` | Login with demo panel |

---

## 3. Results

| # | Test | Method | Result |
|---|---|---|---|
| 1 | Device detection & USB authorization | `adb devices` | **Passed** |
| 2 | Chrome remote debugging | CDP `/json/version` | **Passed** |
| 3 | Homepage loads on device | CDP navigate + DOM text | **Passed** |
| 4 | Homepage layout / hero / search / sections | DOM text + screenshot | **Passed** |
| 5 | **Product grid exactly 2 columns** | Measured card left positions: `[16, 186]`, 12 cards | **Passed** |
| 6 | Product images load | 12/12 loaded, `broken: []` | **Passed** |
| 7 | Product image quality | Visual screenshot review | **Passed** (demo SVG placeholders) |
| 8 | Product detail opens via card tap | Click + URL check | **Passed** |
| 9 | Detail: quantity selector + Add to cart present | DOM query | **Passed** |
| 10 | Detail images load | 8/8 loaded, `broken: []` | **Passed** |
| 11 | Search bar / filters visible | DOM text `Filters` present | **Passed** |
| 12 | Filter modal opens on tap | Role=dialog contains "Price range" | **Passed** (after retest) |
| 13 | Mobile search form has `role=search` | CDP attribute check | **Passed** (fixed during this phase) |
| 14 | Sorting changes result order | `select` change, before/after cards differ | **Passed** |
| 15 | Add to cart (demo) | Badge 0 → 1, toast shown | **Passed (demo UI only)** |
| 16 | Increase/decrease quantity | Badge 1 → 2 → 1 | **Passed (demo UI only)** |
| 17 | Remove from cart | Badge → 0, empty state shown | **Passed (demo UI only)** |
| 18 | Cart subtotal/total | Demo in-memory calculation | **Passed (demo UI only)** |
| 19 | Cart persistence after logout/login | In-memory demo session resets | **Blocked** (needs backend) |
| 20 | Demo customer sign-in | `Preview customer` → account menu present | **Passed (demo only)** |
| 21 | Protected route `/admin` while signed out | Redirected to `/login` on device | **Passed** |
| 22 | Demo admin sign-in → `/admin` dashboard loads | CDP URL + body text | **Passed (demo only)** |
| 23 | Addresses page demo notice + disabled Add button | DOM checks | **Passed (demo correctly blocks action)** |
| 24 | Checkout demo notice + disabled Place order | DOM checks | **Passed (demo correctly blocks action)** |
| 25 | Customer registration / login / forgot password | Real Supabase Auth | **Blocked** (no credentials) |
| 26 | Address CRUD on device | Real DB | **Blocked** |
| 27 | COD order placement on device | Real DB + Edge Function | **Blocked** |
| 28 | Order history / tracking on device | Real DB | **Blocked** |
| 29 | Admin real product/category/order management on device | Real DB | **Blocked** |
| 30 | API / Supabase network requests | Only Vite asset requests observed | **Blocked** (no backend configured) |
| 31 | Horizontal overflow at physical 391 px | `scrollWidth == innerWidth` on all tested pages | **Passed** |
| 32 | Console errors | 1× favicon 404 initially → fixed | **Fixed** |
| 33 | Network failures | `Network.loadingFailed`: 0 | **Passed** |
| 34 | Session persistence after full page refresh | Demo session resets (by design) | **Blocked** (needs backend) |
| 35 | Mobile keyboard behaviour | Inputs focus correctly; real keyboard automation not executed | **Not tested** |
| 36 | Slow network behaviour | Not simulated on the real device | **Not tested** |

---

## 4. Bugs found on the device and fixed

| Bug | Evidence | Fix | Retest |
|---|---|---|---|
| `favicon.ico` 404 console error | Console log on device | Added `public/favicon.svg` and `<link rel="icon">` in `index.html` | Retested with `find_404_all.py`: **0 bad responses, 0 console logs** |
| Mobile search form missing `role="search"` | CDP DOM inspection | Added `role="search"` to mobile form in `Header.tsx` | Retest: `search_form_role = "search"` |
| Two icon buttons below comfortable touch size (14–16 px) | CDP touch-target audit | Enlarged demo-banner close button (28×28) and password toggle (36×36) | **Fixed** (not re-measured numerically) |
| Header overflow at 360/375 px (emulated) | Responsive sweep | Reduced header paddings/gaps, allowed store name to truncate, kept icon buttons `shrink-0` | Emulated sweep: **0 overflow pages** at all 7 widths |

> Note: the device viewport is 391 px so the 360/375 px overflow was found via emulation and fixed proactively; physical-device 391 px passed before and after.

---

## 5. Remaining issues

- Backend-dependent mobile flows cannot be tested until `.env` is configured.
- Real keyboard/slow-network tests not executed.

---

## 6. Status summary

| Status | Count |
|---|---|
| Passed | 19 |
| Passed (demo UI only) | 6 |
| Failed (unfixed) | 0 |
| Fixed | 4 |
| Blocked | 9 |
| Not tested | 2 |
