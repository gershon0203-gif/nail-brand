# Responsive Test Report (Phase 7)

**Date:** 17 November 2026

## Method and honesty note

- **Real device:** OPPO CPH2823, Chrome 157, physical viewport **391 × 757 CSS px**, DPR 2. Results in `MOBILE_TEST_REPORT.md`.
- **Width sweep:** headless desktop Chrome with `Emulation.setDeviceMetricsOverride`, `mobile: false` so `innerWidth` exactly equals the requested width (verified with a calibration run — `mobile: true` forces a 391 px minimum and produced invalid results, which were discarded).
- Emulation is **not** real-device testing; it is used only for the additional viewport widths.

## Results after fixes

| Width | Pages rendered | Product grid columns | Horizontal overflow | Off-screen elements |
|---|---|---|---|---|
| 360 px | 6/6 | 2 | 0 pages | 0 |
| 375 px | 6/6 | 2 | 0 pages | 0 |
| 390 px | 6/6 | 2 | 0 pages | 0 |
| 430 px | 6/6 | 2 | 0 pages | 0 |
| 768 px (tablet) | 6/6 | 2 | 0 pages | 0 |
| 1024 px (laptop) | 6/6 | 3 | 0 pages | 0 |
| 1440 px (desktop) | 6/6 | 3 | 0 pages | 0 |

Pages tested per width: `/`, `/products`, `/products/classic-stoneware-mug-sand-1`, `/cart`, `/login`, `/checkout` (checkout redirects to `/login` when signed out — expected and recorded).

**Before the fix:** widths 360 and 375 showed overflow on all 6 pages caused by the header icon group extending to x=391. Fixed by tightening header paddings/gaps, allowing the store name to truncate, and keeping icon buttons non-shrinking. Retested: zero overflow at all widths.

## Additional checks

| Check | Result |
|---|---|
| Navigation usable at mobile widths | Passed — hamburger menu present (`lg:hidden`) |
| Product grid exactly 2 columns on mobile / 3 on desktop | Passed (measured card positions) |
| Image scaling | Passed (all images `object-cover` within aspect-ratio containers) |
| Readable text / spacing | Passed (visual screenshot review at 391 px) |
| Modal positioning | Passed on device — filter dialog opens as bottom sheet on mobile |
| Touch targets | Fixed — icon buttons enlarged; text links remain intentionally small (inline links) |
| Reduced-motion support | Present in `index.css` |

## Screenshots

- Device: `reports/screenshots/01_home_real_device.png` … `05_login_real_device.png`
- Emulated widths: `reports/screenshots/responsive-desktop/` (360/390/768/1440 for home, products, checkout)

## Status summary

| Status | Items |
|---|---|
| Passed | 7 widths × 6 pages after fix |
| Failed (unfixed) | 0 |
| Fixed | 1 (header overflow at 360/375 px) |
| Blocked | 0 |
| Not tested | Tablet/desktop physical devices (emulation only) |
