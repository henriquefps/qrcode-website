# Qrcode — rebuild spec

Shared spec for the rebuild of this repo (formerly "QRGo") into **Qrcode**, a free, open,
client-side QR code app published at `https://qrcode.hfps.dev` (`qrgo.hfps.dev` redirects there).
Every worker reads this file first. Old code is archived on branch `archive/qrgo`
(reuse ideas freely: `src/utils/qrHelper.js`, `src/components/inputs/*`, `StylingPanel.jsx`, `LivePreview.jsx`).
Reference implementation of the same treatment: `/Users/henriquefps/Documents/my-apps/logo-designer`
(Designer): `src/theme/`, `cloudflare.config.ts`, `worker/`, `docs/deploy.md`, About dialog, README, LICENSE.

## Purpose

Two halves, equal weight:
- **Create**: a QR generator (all current content types + styling).
- **Read**: a scanner/reader. Main use case: moving passwords/URLs between a computer and a phone when
  the computer is not on the local network (computer shows a QR, phone reads it; or phone shows, computer's webcam reads;
  or a screenshot is pasted). Optimize that flow.

Everything runs in the browser. No account, no server, **no history stored anywhere** (no localStorage of scanned/typed content).
English only (see docs/adr/0002).

## Stack

Vite + React 19 + TypeScript (strict) + Tailwind v4 + shadcn/ui **`radix-vega`** (replace the old base-ui `base-sera` components),
Inter, Phosphor icons, `qr-code-styling`, Vitest + Testing Library where useful. Package manager **bun**.
UI follows the `hfps-app-ui` skill. **Default theme: palette `blue`, mode `light`** (NOT olive). Light / Dark / System and a
palette menu stay available; storage keys `qrcode.theme`, `qrcode.palette`. Radius 0.75rem.
Remove `html5-qrcode`, `wrangler`, `next-themes` if unused, `package-lock.json`, `jsconfig.json`.
**`node_modules/` and `dist/` are currently tracked in git: `git rm -r --cached` them** (already in .gitignore).
Rename all branding QRGo → Qrcode (package name `qrcode`, titles, manifest, README, About, localStorage keys).

## Structure (target)

```
src/
  main.tsx  App.tsx
  theme/            palettes + ThemeProvider + ThemeMenu (copy pattern from Designer)
  components/ui/    shadcn radix-vega
  components/shell/ AppShell, TopNav (Create | Read), AboutDialog
  features/create/  content types, StylingPanel, LivePreview, download, presets
  features/read/    reader (camera, image/paste, decoder, result panel, parsers)
  features/show/    Quick show
  lib/              pure helpers (qrData builders, parsers) — unit tested
worker/ cloudflare.config.ts   (deploy workstream)
docs/ public/ scripts/
```

## Navigation

Top-level segmented navigation **Create | Read** in the header on desktop AND mobile (no hidden FAB). Route by hash
(`#/create`, `#/read`) so back/forward and links work; default `#/create`. A **Quick show** button is available in the header
(both views) and opens a full-screen overlay (see below). Header also has the theme menu and About.

## Read (`features/read/`)

- **Decoder** (`lib/decode`): native `BarcodeDetector` (formats qr_code at least; also common 1D/2D if cheap) when available; otherwise a **lazy-loaded
  WASM fallback** (`barcode-detector` polyfill / `zxing-wasm`) loaded via dynamic import, **not in the PWA precache** (use runtimeCaching).
  Single interface: `detect(source: ImageBitmapSource): Promise<{ text: string; format: string }[]>`; same code path for video frames and images.
- **Camera** (desktop + mobile): permission prompt state, device picker (`enumerateDevices`; prefer environment-facing on mobile), mirror toggle
  (default mirrored for front/webcam), torch toggle when `getCapabilities().torch`, stop stream on leave/unmount/tab hidden, clear error states
  (denied, no camera, in use, insecure context). Scan loop via `requestAnimationFrame` throttled (~10 fps). Highlight the detected code.
- **From image**: file picker, drag-and-drop onto the view, and paste (Cmd/Ctrl+V of an image, while the Read view is active). Multiple codes in an
  image → list them, pick one.
- **Result panel**: large selectable text; **Copy** (with feedback); **Open link** for http(s) URLs (`rel=noopener noreferrer`, never auto-open);
  **Hide/Show** (mask) toggle, plus automatic masking for Wi-Fi passwords and `otpauth://` secrets; **Scan again**.
  Parsed views (pure parsers in `lib/parse`, unit tested): Wi-Fi (`WIFI:T:;S:;P:;H:;;` with escapes) with copy-password, vCard / MeCard, `mailto:`, `smsto:`/`sms:`,
  `tel:`, `geo:`, `otpauth://` (issuer, account, secret masked), URL, plain text. Always keep a "raw text" view.
- Nothing is persisted. Clipboard writes only on user action.

## Quick show (`features/show/`)

Header button opens a full-screen overlay: a textarea (paste a password/URL, autofocus, mask toggle for the input) → live **huge high-contrast QR**
(black on white, error correction M, quiet zone, sized to the viewport minimum side, no styling), **Esc** or a close button closes and clears the text.
Shortcut: `Q` when not typing. Nothing saved. Works offline.

## Create (`features/create/`)

Keep everything the old app does: content types URL / Text / Wi-Fi / Email / SMS / vCard; styling (dots, corner squares/dots, colors, gradients, logos with presets and
upload, margin, error correction); style preset export/import (JSON); download PNG (256/512/1024 selector) and SVG; live preview. Migrate to TS with typed content-type definitions,
tidy structure, and unit tests for `getQRDataString`-style builders (escaping of Wi-Fi/vCard fields) and preset validation. Layout: controls + sticky preview on desktop; stacked with the preview first on mobile.

## Brand & PWA

New Qrcode icon (`hfps-repo-assets` skill): icon.svg, icon-light.svg, icon.png, favicon.ico, apple-touch-icon, 192/512 + maskable, 2560x1280 social image, `og.png` for OG/Twitter.
`index.html` with full SEO/OG/Twitter/JSON-LD for `https://qrcode.hfps.dev/`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`.
PWA via `vite-plugin-pwa` (generateSW, autoUpdate), offline works; precache small (the WASM fallback and big chunks are runtime-cached). The old custom `public/sw.js` is removed.
About dialog: version, description, privacy statement ("nothing leaves your device"), source link, AGPL notice, third-party notices.

## Deploy (Cloudflare Worker, `cf` CLI — no Wrangler config)

Same as Designer: `cloudflare.config.ts` (worker name `qrcode`, `runWorkerFirst: true`, SPA fallback, domains `qrcode.hfps.dev` and `qrgo.hfps.dev`),
`worker/index.ts` (**only `export default`**) + `worker/routing.ts` with tests: `qrgo.hfps.dev/sw.js` → self-unregistering service worker (clears caches, redirects windows),
any other path on qrgo → 301 to `https://qrcode.hfps.dev<path+query>`, everything else → `env.ASSETS`. `@cloudflare/vite-plugin`; scripts `deploy` / `deploy:dry` call `node node_modules/cf/bin/cf`
(Node ≥ 22.18, never Bun). `public/_headers` (no-cache for sw/index/manifest, immutable for `/assets/*`). Document in `docs/deploy.md`. Workers only prepare + dry-run; the real deploy
and domain move are done by the coordinator.

## License

AGPL-3.0-or-later: verbatim `LICENSE` from gnu.org, `package.json` `"license"`, README License + third-party notices, About source link (https://github.com/henriquefps/qrcode-website).

## Quality bar

`bun run build`, `bun run lint`, `bunx tsc -b`, `bun run test` pass. Check widths 390/1024/1440, light and dark. No text below 12px. No raw Tailwind colors in UI chrome. Accessible names on icon buttons;
keyboard reachable; visible focus. After merges run `bun install` before building. Gotchas: workerd rejects non-function named exports from the Worker entry; Chromium reports `PointerEvent.detail=0`.
Each worker finishes with a PR to `main` (`gh pr create`), with a summary and how it was verified.
