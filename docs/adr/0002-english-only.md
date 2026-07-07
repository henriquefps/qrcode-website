# ADR 0002: Drop multilanguage support (English-only)

* **Date**: 2026-07-07
* **Status**: Accepted

## Context
The app shipped with a 3-locale translation layer (`src/utils/translations.js`, 422 lines: EN/PT-BR/ES) with browser-locale detection, a persistent language selector, and dynamic SEO meta rewriting on language change. Every component took `lang`/`translations` props. Henrique decided the audience does not justify the maintenance cost ("não é necessário ter a app em multilanguagem — pode ser apenas em inglês").

## Decision
Deleted `translations.js` and the language selector; all strings are hardcoded English at the point of use. SEO meta tags are static in `index.html` (no more runtime rewriting). `getQRDataString()` and every component lost their `lang`/`translations` parameters.

## Consequences
- Components are self-contained and copy is greppable; no translation-key indirection.
- SEO head is fully static and crawlable without JS execution.
- Re-adding a locale later means reintroducing an i18n layer — acceptable, as none is planned.
