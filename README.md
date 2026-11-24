# CodeCart PRO 3.0.7.0

CodeCart PRO 3.0.7.0 — self-hosted e-commerce system based on OpenCart/ocStore 3.x, with Ukrainian as the default storefront language and Russian / English translations.

The primary development branch is `main` in this repository. Earlier CodeCart 3.0.6 and experimental modernization repositories are legacy sources, not active development targets.

## Stack and compatibility

- PHP 8.2–8.5; MySQL / MariaDB with InnoDB and utf8mb4.
- Bootstrap 5.3.9, jQuery 4.1.0 and jQuery Migrate 4.0.2 by default; isolated Bootstrap 3.4.1 / jQuery 3.8.0 fallback for older extensions.
- Font Awesome Free 7.3.1, AUTO/Core/Full icon modes and FA4 class compatibility.
- Composer-locked Twig 3.31.1, Guzzle 8.5.2 and Symfony Filesystem 7.4.23.
- CodeMirror 6 on migrated editors; CodeMirror 5 remains for legacy integrations.
- Hybrid DateTimePicker; Air Datepicker 3.6.0 + Day.js 1.11.23 available as opt-in integration.

## Development and testing

The `upload/` directory contains the application. Release workflows, compatibility adapters, CI tests and migration documentation are included in this repository.

The administrative section `Ядро / Сумісність → Про систему` reports component versions. The modern Bootstrap and jQuery configurations require full OCMOD, UniShop2, mobile UI, installation, checkout and payment regression before production deployment.

Superseded workflows are archived under `documentation/migrated-workflows/` instead of being enabled automatically. The release is not production-certified until its integration checks pass.
