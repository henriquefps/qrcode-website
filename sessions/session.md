# Session Context — QRGo

> Last updated: 2026-07-07

---

## About the Project

**Name:** QRGo (`qrcode-website`)
**Type:** React 19 (JSX, not TypeScript) + Vite 5, Tailwind v4, shadcn/ui (`base-sera` style, `olive` base — the shared hfps design system, generated via shadcn CLI preset `b6thjhmE4`). No state library — all state lives in `App.jsx` via `useState`. `qr-code-styling` renders the QR canvas; `html5-qrcode` powers the camera scanner (lazy-loaded).
**Key commands:**
- `bun run dev` — Vite dev server (port 5173)
- `bun run build` — production build
- `bun run preview` — serve the production build
- `bun run deploy-prod` — build + `wrangler pages deploy dist` (no project name pinned; no `wrangler.toml`)

### Relevant file structure

```
src/
  App.jsx                 owns formValues + styleConfig + scanner state; export/import style handlers
  components/
    ui/                   shadcn-generated primitives (.jsx, Base UI-based)
    inputs/               UrlInput, TextInput, WifiInput, EmailInput, SmsInput, VcardInput
    Header.jsx, Footer.jsx, ContentTypeTabs.jsx, StylingPanel.jsx,
    LivePreview.jsx, ScannerModal.jsx (lazy), MobileFABs.jsx
  hooks/useTheme.js       light/dark with localStorage ('qrgo_theme') + system fallback
  utils/qrHelper.js       getQRDataString() payload builders + PRESET_LOGOS data URLs
  index.css               Tailwind v4 imports + hfps oklch tokens + 1 scanner-video rule only
docs/adr/                 ADR 0001 (design system), ADR 0002 (English-only)
public/                   manifest.json, icons, whatsapp.png/instagram.png (QR-embeddable logos)
index.html                static EN SEO, JSON-LD, theme-flash-prevention script
```

---

## Architecture

- **Single state owner:** `App.jsx` holds `formValues` (all content types' fields in one flat object), `styleConfig` (QR appearance), and scanner-modal open state. Children are controlled components receiving values + change callbacks.
- **UI primitives are Base UI, not Radix.** The `base-sera` shadcn style wraps `@base-ui/react`. API differences that matter: `onValueChange`/`onCheckedChange` callbacks, `Slider` takes/returns arrays, `Dialog` uses `open`/`onOpenChange`, and `Select` must receive an `items` prop (array of `{value, label}`) or `SelectValue` renders the raw value string instead of the label.
- **QR rendering:** `LivePreview` instantiates one `QRCodeStyling` (canvas, 280×280) on mount and calls `.update()` on every `qrData`/`styleConfig` change. PNG export temporarily re-renders at 256/512/1024 then restores preview size.
- **Scanner:** `ScannerModal` is `React.lazy` — the 351 KB `html5-qrcode` chunk only loads when the user opens the scanner. Scan results route to the URL tab (if URL-shaped) or Text tab.
- **No backend, no accounts** — same product constraint as LogoGo. Only persistence is `localStorage` for theme; style presets round-trip via exported `.json` files.

---

## Work Log

#### 1. Rebuild onto the hfps design system (shadcn CLI preset) + drop multilanguage

User request following the LogoGo v2 rebuild (see `logo-designer/code_review/session.md`): standardize QRGo with the hfps design system and make it English-only; the LogoGo-style freeform canvas explicitly **not** wanted here.

- **Design system:** ran `bunx shadcn init --preset b6thjhmE4` + `shadcn add` for 14 primitives. The CLI detected the JS project and generated `.jsx` components (`tsx: false` in `components.json`) — the app stays JavaScript, unlike LogoGo's TS rewrite. Deleted ~1,700 lines of hand-rolled CSS from `index.css`, keeping only preset tokens (light `--background` set to hfps.dev's `oklch(0.966 0.005 106.5)` off-white since light mode is exercised here, per the design-system doc's guidance) plus one rule for the html5-qrcode `<video>`. All components rewritten on the primitives; inline lucide-style SVGs replaced with Phosphor icons. Added `@` path alias (jsconfig.json + vite.config).
- **i18n removal:** deleted `src/utils/translations.js` (422 lines, EN/PT/ES), the header language selector, and the `lang`/`translations` props threaded through every component; the dynamic SEO-meta-rewriting effect in App is gone (static EN head in `index.html`). Recorded as ADR 0002.
- **Improvements shipped in the same pass:**
  - Light/dark mode (`useTheme` hook + pre-paint script in `index.html`) — new capability, the old app was light-only.
  - `alert()` calls → sonner toasts (copy, invalid image, file too large, invalid style JSON).
  - Fixed a real pre-existing UX bug: the hex color text inputs were controlled by the committed value and only accepted a full valid `#rrggbb`, so they were effectively untypeable — `ColorField` now keeps a local draft, committing on valid hex.
  - Checkerboard backdrop behind the QR preview when "transparent background" is on, so transparency is visible.
  - Bundle: scanner lazy-loaded (main chunk 961 KB → 608 KB + 351 KB on demand); Inter self-hosted via `@fontsource-variable/inter` replacing the Google Fonts CDN (must be imported from `main.jsx`, not CSS `@import` — Vite leaves the woff2 URLs unresolved otherwise; the first build proved this).
  - `index.html` head: removed `user-scalable=no` (a11y), added JSON-LD `WebApplication`, `robots` meta, dual `theme-color` (light/dark); manifest colors updated from the old indigo `#6366f1` to the olive palette.
  - Removed the wrong-domain `canonical`/`og:url` (they pointed at `https://hfps.dev`, same reference-template leftover LogoGo had). **Open item:** no canonical/og:url/absolute og:image is set because the deployment domain is unknown (deploy script has no Pages project name). Set these once the domain exists — LogoGo's §7 is the playbook.
- **Bugs fixed that verification surfaced:**
  - `html5-qrcode`'s `stop()` **throws synchronously** when the camera never started (e.g. permission denied) — `.catch()` doesn't cover it; wrapped in a `stopScanner()` try/catch helper in `ScannerModal.jsx`.
  - Base UI `SelectValue` rendered raw values (`extra-rounded`) instead of labels until `items` was passed to `Select` roots (StylingPanel's `SelectField` + WifiInput).
  - Content-tab labels truncated at desktop width (`TE…`, `WI…`) — the sera `TabsTrigger` `px-4` + icon + uppercase tracking didn't fit 6 columns; fixed with `gap-1.5 px-1`.
- **Verified:** `bun run build` clean. Playwright (Chromium, scratchpad install) against `vite preview`: desktop 1440×900 and mobile 375×667 — one `<h1>`, QR canvas renders, all 6 content tabs switch, select opens and changes dot pattern, gradient toggle, GitHub logo preset embeds in the QR, copy → toast appears, dark-mode toggle flips `html.dark` (screenshots of both themes), scanner dialog opens (camera unavailable headless → error banner path exercised), Escape closes it, no horizontal scroll at either viewport, both mobile FABs present, `CONSOLE_ERRORS: []`.
- **Also:** README rewritten (was bilingual and still described the pre-React vanilla-JS architecture); `.gitignore` now covers `.DS_Store`/`.profile`.

**Known repo issue (not touched):** `node_modules/` (2,034 files) and `dist/` (4 files) are committed to git — `.gitignore` lists them but they were tracked before it existed. Untracking (`git rm -r --cached`) would be a large but mechanical commit; left for the user to decide.

#### 2. Light mode by default + Terms & Privacy popup

User feedback after reviewing §1 ("gostei bastante"): default the app to light mode (keep the toggle where it is) and add a small terms/privacy popup — free app, runs on-device, no tracking.

- **Theme default:** `getInitialTheme()` in `useTheme.js` and the pre-paint script in `index.html` no longer consult `prefers-color-scheme`; the app opens light unless `localStorage.qrgo_theme === 'dark'` (an explicit user choice). The toggle is unchanged.
- **Legal popup:** new `src/components/LegalDialog.jsx` (shadcn Dialog) with two short sections — Terms of Use (free for personal/commercial use, provided as-is, user responsible for encoded content) and Privacy Policy (everything local, no accounts/cookies/analytics/tracking, only theme preference in localStorage). Triggered by a "Terms & Privacy" underlined button appended to the footer credit line; `Footer.jsx` owns the open state.
- **Verified:** `bun run build` clean; Playwright against `vite preview` with a fresh context forced to `colorScheme: 'dark'` — page still loads light (`html.dark` absent), toggling dark then reloading persists dark, footer link opens the dialog containing both "Terms of Use" and "Privacy Policy" sections (screenshot), Escape closes it, `CONSOLE_ERRORS: []`.

#### 3. Session log relocated to `sessions/`

Per user request, the global `log-session` skill (`~/.claude/skills/log-session/SKILL.md`) was updated to write session logs to `sessions/session.md` instead of `code_review/session.md` — `code_review/` remains the home of the audit-codebase skill's `tasks.md`/`code_review.md` only. This file was moved accordingly (this project's `code_review/` folder held nothing else and was removed). The skill now includes a migration step so other projects' legacy `code_review/session.md` files get moved on their next log run. No app code changed in this entry.

---

## Key Technical Notes

- **Base UI ≠ Radix.** Every shadcn primitive here wraps `@base-ui/react`. `Select` silently shows raw values unless the Root gets `items={[{value, label}, …]}`. `Slider` `onValueChange` may pass an array. Check the generated `ui/*.jsx` before assuming Radix behavior.
- **Fonts must be imported from JS.** `@import "@fontsource-variable/inter"` inside `index.css` builds, but Vite can't resolve the package-relative woff2 `url()`s and they 404 in production. `import '@fontsource-variable/inter'` in `main.jsx` bundles them correctly.
- **`html5-qrcode.stop()` throws synchronously** if scanning never started. Always guard with try/catch, not just `.catch()` — see `stopScanner()` in `ScannerModal.jsx`.
- **The sera style is uppercase/rounded-none by design.** Buttons, tabs, labels come out uppercase tracked; don't "fix" that, it's the system.
- **Deployment domain unknown.** `deploy-prod` runs bare `wrangler pages deploy dist`; no canonical URL/og:image can be set until the Pages project + domain are confirmed.
- **Smart logo-preset suggestion** (App.jsx effect): switching to the wifi tab auto-applies the wifi logo *only if* no logo is set; email/url tabs only replace a previously auto-suggested preset, never a user choice. Preserve that asymmetry if touching it.
