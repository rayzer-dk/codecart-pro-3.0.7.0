# Compatibility
[Українська](COMPATIBILITY.uk.md) · [All guides](README.md) · [Community](https://t.me/codecartpro)

CodeCart preserves OpenCart/ocStore 3.x MVC-L routes, Events and OCMOD integration. The supported CodeCart PHP runtime range is 8.1–8.5 inclusive. PHP 7.4 and PHP 8.0 are not supported. Core CI covers PHP 8.1 through 8.5; modules, commercial themes and ionCube distributions may impose additional restrictions.

Upgrade runtime coverage exists for ocStore 3.0.4.1, OpenCart 3.0.5.1 and ocStore 3.0.5.0-Beta. Test the exact store on staging before deployment; framework tests and migration coverage do not certify all extensions, live payment APIs or third-party storefront UI. Back up website files and database before changing the system.

Clean installation activates CodeCart Theme only. Upgrade preserves every existing store's active theme, configuration, merchant images and persistent storage. Review Modifications diagnostics after any update.

- [Compatibility Framework for developers](COMPATIBILITY_FRAMEWORK.md)
- [Upgrade and repair](UPGRADE.md)
- [nginx hosting configuration](NGINX.md)

Support: [support@codecartpro.com](mailto:support@codecartpro.com) · [CodeCart PRO community](https://t.me/codecartpro)
