# CodeCart PRO 3.0.7.0 UI modernization

Repository: `rayzer-dk/codecart-pro-3.0.7.0`; active development branch: `main`. This document records UI work migrated from the previous experimental branch. The old repository is not used for new changes.

## Stage 1: reusable UI foundation (implemented in this branch)

- Scoped custom properties for spacing, radii, surfaces, borders, focus and dark backgrounds.
- Compact admin forms, buttons, tables, tabs, modal chrome, panel spacing and responsive layouts.
- Storefront forms, cards, product tiles, tabs, tables and mobile spacing.
- Styles are loaded only when `codecart_preview_bs5` is enabled in the admin and the two bundled stock themes (CodeCart/default). Fallback Bootstrap 3 pages are untouched.
- No global overrides against the original UniShop2 3.6.9.0 storefront. Its vendor CSS/JS and OCMOD compatibility must be handled independently.
- Browser smoke: 375/768/1280px, light/dark, admin/store. Static import and style-scope assertions are part of the preview QA.

## Stages still to implement

2. **Admin modernization (in progress):** catalog product form, product list and order list now use opt-in scoped responsive classes. Product editor tabs scroll horizontally on mobile; page-header action controls use wrapping flex layout; list tables have refined borders. Added static and browser regression assertions. Settings and order-detail pages now have scoped flex action headers, scrollable settings tabs and resilient order-detail tables, with static and Chromium fixture regressions added. The mobile header retains its existing original-node overflow mechanism, with targeted focus styling. Still pending: native Bootstrap 5 Twig markup conversion, full mobile-header integration, real store and OCMOD/runtime regression.

3. **Storefront modernization:** catalog cards, responsive search and navigation, filters, product details, account, cart and checkout; test feature toggles and payment side effects on a real staging database.

4. **Native component cleanup:** replace `data-toggle`, `data-target`, Bootstrap 3-specific grid/utility classes and jQuery Bootstrap calls in reviewed templates only. Keep the compatibility bridge for unported modules, without loading two Bootstrap versions on the same page.

5. **Legacy cleanup / release gate:** inventory all old widgets, verify extension compatibility and reduce unused assets. Execute real GitHub Actions, broad E2E, OCMOD refresh, payments and installed UniShop2 regression before production release.

## Stage 2–3 bulk delivery (2026-11-19)

- Admin: 5 additional pages — category editor/list, manufacturer editor, customer list and coupon list — now have isolated Bootstrap 5 responsive layout hooks and UI styling. This joins the prior product editor/list, order list/info and system settings (10 reviewed admin templates total).
- Stock CodeCart storefront: product, category, cart, checkout and customer login templates now have scoped layout hooks and targeted responsive CSS. No checkout submission or payment processing logic is changed; all vendor UniShop2 files remain outside this batch.
- Admin tab helper in `view/javascript/codecart-ui-370.js` runs only under the Bootstrap 5 header and uses native DOM APIs for horizontal tab navigation, without hijacking jQuery/OpenCart tab state.
- Mobile header overflow gets initial keyboard focus on opening while retaining original extension DOM nodes.
- QA: static scope tests, CSS/component browser smoke across 375px/768px/1280px, a 15-screen layout fixture matrix and a focused mobile header overflow/keyboard behavior fixture; tests run from the isolated GitHub Actions workflow.

**Not yet certified:** these smoke fixtures cannot replace authenticated E2E against an installed CodeCart store. The complete native Bootstrap 5 Twig conversion, checkout payment flows, UniShop2 OCMOD integration and PHP 8.2–8.5 application runtime remain release blockers.


## Browser QA and release gating

The workflow `.github/workflows/modernization-pilot-qa.yml` runs static/UI fixture checks on pushes to the experimental branch, without touching `main`. A separate real-store job is now explicitly opt-in and **skipped unless both** repository Actions variables are configured: `CODECART_ENABLE_E2E=true` and `CODECART_E2E_BASE_URL` pointing to a test store. Optional credentials can be supplied as GitHub secrets `CODECART_E2E_ADMIN_USER` and `CODECART_E2E_ADMIN_PASSWORD` when the selected E2E tests use them. This job runs the existing Playwright desktop/mobile projects in Chromium, Firefox and WebKit and retains HTML/JUnit/artifacts for inspection.

Do not point E2E_BASE_URL at production: test flows may manipulate cart/account/order data. The new job has not been certified as successful and does not substitute for PHP 8.2–8.5, database/OCMOD and payment integration checks.

The UI fixture regressions now load the actual Bootstrap 5.3.9 stylesheet before CodeCart's UI layer, rather than judging isolated CSS without the framework baseline. JavaScript syntax has also been checked for the modified UI/browser-test scripts.\n\nThe UI tab helper was corrected to adjust only `nav.scrollLeft` rather than calling `scrollIntoView`, preventing unexpected whole-page jumps. Browser checks now dispatch the tab event directly so Playwright auto-scroll cannot mask a broken helper.

The stock CodeCart storefront (not UniShop2) has scoped responsive search/cart/top-link styles, including minimum touch sizes on mobile. These changes are tested on 360, 375, 768 and 1280px light/dark browser fixtures.


## Stage 4: Bootstrap 5 component parity and color-mode fixes

- Admin and catalog Bootstrap 3-to-5 adapters have the same source. The jQuery tab compatibility bridge preserves explicit tab activation while deferring to native Bootstrap 5 data attributes; the numeric carousel API remains supported.
- Bootstrap 5 theme colors now follow CodeCart light/dark state. Early boot scripts set `data-bs-theme` before CSS paint for both admin and stock storefront, and runtime theme changes synchronize it.
- Stock storefront color-mode updates are observed by a small native JavaScript component loaded **only** in Bootstrap 5 mode; UniShop2 and the Bootstrap 3 fallback are unchanged.
- The CI suite now includes a browser fixture that toggles light/dark/light and verifies the native Bootstrap variables, plus static checks for initial theme synchronization.

The GitHub checks must still pass on an actual runner, and the installed-shop checkout and third-party OCMOD routes are not yet certified.


## Stage 5: three-level admin navigation

The existing sidebar navigation now gives all three collapse levels stable `aria-controls` and initial `aria-expanded="false"` attributes while retaining their Bootstrap 3-compatible `data-toggle` hooks. The Bootstrap 5 bridge maps these hooks at runtime. Mobile tap targets and keyboard focus indicators are improved only in the BS5 preview.

A dedicated browser fixture opens all three nested levels, verifies Bootstrap 5 collapse state and accessible expansion state, then closes the deepest section. The static QA also checks that the admin/catalog BS5 compatibility adapters are identical.

These are source changes plus CI test definitions, not evidence that GitHub Actions or a complete live-store regression has passed.

## Current limits

The GitHub CI workflow is configured for the new tests, but a successful run has not been verified through the connector. Static/browser fixture smoke is not a certification of an installed store. Treat this branch as preview-only.
