# UniShop2 3.6.9.0 compatibility in CodeCart PRO 3.7.0

Scope: the vendor package `unishop2_v3.6.9.0.ocmod.zip` is not checked into this repository. Do not edit the vendor archive in-place. The supplemental OCMOD is `compatibility.ocmod.xml` and is packaged separately as `CodeCart_PRO_3.7.0_UniShop2_3.6.9_Compatibility_v1.0.0.ocmod.zip`.

## Verified from vendor archive

- Vendor OCMOD: code `UniShop2 template`, version `3.6.9.0`; 46 target file groups and 120 operations.
- Vendor storefront loader `catalog/controller/tool/uni_tool.php` explicitly loads its own jQuery 3.7.1 before Bootstrap 3.4.0. Never load CodeCart's jQuery 4 or Bootstrap 5 a second time on this storefront; the vendor template uses Bootstrap 3 APIs and CSS.
- CodeCart's built-in themes can continue to use Bootstrap 5.3.9 with jQuery 4.1.0/Migrate 4.0.2. This does **not** certify compatibility of other extensions when UniShop2 is selected.
- Vendor `catalog/controller/extension/module/uni_new_data.php` declares three `static` properties but accesses them as instance properties. The supplemental OCMOD converts exactly those three declarations to private instance properties, without touching the original package.
- Core `Unishop2Compatibility::normalizeOcmodAdd` now recognizes both vendor versions 3.6.6.0 and 3.6.9.0 for a strictly identified stock-sort OCMOD payload.

## Limitations

- Do not claim 120/120 OCMOD operations successfully applied. Multiple vendor anchors no longer exist verbatim in the CodeCart 3.7 core; some are covered by the existing compatibility framework, the rest need targeted verification.
- Isolated GitHub browser smoke tests do not test an installed UniShop2 theme, a live database, customer checkout, payment integrations, or third-party modules.
- This small OCMOD is **not** the complete compatibility solution or a production certification. After installing UniShop2 on a separate staging shop, apply the patch as a second extension, refresh modifications, inspect modification logs, and execute real storefront and checkout tests.
- PHP 8.2–8.5 is the target of CodeCart 3.7.0; the proprietary vendor's complete runtime is not yet certified throughout this range.
