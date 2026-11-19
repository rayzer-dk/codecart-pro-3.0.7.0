# CodeCart PRO 3.0.7.0 — repository consolidation and outstanding work

Primary repository: `rayzer-dk/codecart-pro-3.0.7.0` (branch `main`).
Legacy repository: `rayzer-dk/CodeCart-3-0-6` (read-only reference; do not push fixes there).

## Imported branch history

The new repository contains the source paths of the old `main`, `experiment/bootstrap5-compat-fa7` and `feature/codecart-3.7.0-modernization`. Older workflow definitions are intentionally archived under `documentation/migrated-workflows/` instead of activated.

Only `experiment/bootstrap5-compat-fa7` and `feature/codecart-3.7.0-modernization` are unambiguously confirmed as assistant-edited experimental branches in the modernization conversations. The assistant also modified old `main`, before moving to this repository.

The remaining old feature branches should not be attributed solely by Git author name:

- `feature/installable-pwa-docs-release`: installable PWA, Workbox and release documentation; the new repository already includes identical `common/pwa.php`, `codecart-app-sw.js`, and `codecart-sw.js` blobs.
- `feature/pwa-install-finalization`: PWA and registration refinements.
- `feature/workbox-hybrid-opt-in`: optional Workbox caching and per-store flags.
- `fix/pwa-phpstan-array-shapes`: additional static analysis and PWA adjustments.
- `feature/order-list-photo-column`: no commits ahead of the legacy `main` at inspection.

All seven old feature branches remain in the old repository; they have NOT been deleted.

## Current CodeCart 3.0.7.0 integration evidence

- `Modernization QA` and `Playwright E2E` both passed on 2026-11-19 for commit `141bd98c84`.
- The CodeCart `3.0.7.0` source has its own PHP 8.2–8.5 and Composer lock matrix.
- The staging/real-world UniShop2 integration, payment providers, multistore install/upgrade paths and cross-browser PWA installation are not independently certified by these fixtures.
- A separate PWA `beforeinstallprompt` race was corrected; `tools/qa_pwa_install_prompt.cjs` now tests it in CI.
- All further code changes must be committed to this repository's `main`; do not merge an obsolete branch wholesale over current source.

## Retiring old branches

GitHub branch deletion is not supported by the current connected write actions. Do not delete the old `main` or a feature branch until remaining distinct patches have been reviewed and historical reference is no longer needed. Preserve old release/workflow history independently.
