# CodeCart PRO 3.0.7.0 — storefront responsive audit

Date: 2026-11-20. Branch: `main`.

## Scope and evidence

Based on user-supplied rendered HTML snapshots of the `/desktops` category and Apple Cinema 30" product page, the current CodeCart theme, the Bootstrap 5 compatibility adapter and Playwright Chromium layout measurement. Inline CSS was loaded from the same distribution snapshot, including the replacement `codecart-ui-370.css`. Tests were repeated at viewports 390, 768, 1024, 1440 and 1920 px.

The isolated browser cannot navigate to the live public demo (network policy returns `ERR_BLOCKED_BY_ADMINISTRATOR`), so measurements below are **snapshot layout checks**, not proof that the production server is updated or that every interactive function passes.

## Findings and fixes committed to main

- Bootstrap 3 compatibility styles and Bootstrap 5 preview conflicted over grid item widths, leaving product and subcategory cards at approximately half the intended width. Scoped grid-track item overrides have been applied.
- Mobile search controls previously wrapped to two rows (88px total); restored a one-row 44px search layout in Bootstrap 5 preview.
- The page-specific selector `:is(#product-product,#product-category,...).container` forced `max-width:100%`, overriding the generic desktop 1500px cap. Added page-scoped desktop width guards.
- Product gallery and summary alignment/height were normalized; desktop gallery capped, option-heavy product summaries sized to content.
- Cache-busting revision in `header.twig` updated to `3.0.7.0-layout4`.
- Added `tests/E2E/storefront-responsive.spec.js` for cross-browser geometry and basic interaction checks. This test belongs to existing Playwright workflow, not a new workflow.

## Isolated Chromium measurements (category / product)

| Viewport | Document overflow | Category page width | Subcategory tile width | Product grid card width | Product gallery height |
| --- | --- | --- | --- | --- | --- |
| 390 | none | 390 | 178 | 178 | 275 |
| 768 | none | 768 | 176 | 174 | 273 |
| 1024 | none | 1024 | 139 | 238 | 369 |
| 1440 | none | 1408 | 162 | 333 | 510 |
| 1920 | none | 1500 | 173 | 356 | 530 |

Product page also respects the 1500px maximum at 1920px.

Images, remote fonts and scripts were blocked in this isolated reconstruction; natural image rendering, dropdown functionality, checkout logic, and browser/OS-specific behavior cannot be inferred from these snapshots. The Playwright CI suite tests actual rendering and some interactions against its disposable local PHP server when run.

## Required release gate

The Playwright E2E workflow must finish successfully in Chromium desktop/mobile, Firefox desktop, and WebKit mobile, and a staging-site smoke test should verify navigation, category sorting/filtering, product variants, cart/checkout, menus, accessibility, dark theme, and cache refresh before declaring the whole storefront production-ready. No passing CI run is asserted in this report.
