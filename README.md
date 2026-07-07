# QRGo — Free Custom QR Code Generator

**An elegant custom QR Code generator that runs 100% client-side. Free, no login, and your data never leaves the browser.**

Built with React 19, Vite, Tailwind CSS v4, and shadcn/ui on the shared hfps design system (`base-sera` style, `olive` base, Phosphor icons) — the same system used by [hfps.dev](https://hfps.dev), AppShot, and LogoGo.

## Features

- **Content types**: URL, plain text, Wi-Fi credentials, Email, SMS, and vCard.
- **Custom shapes**: dot patterns, outer corner frames, inner corner cores, adjustable quiet-zone margin, and error-correction level.
- **Colors & gradients**: solid or linear/radial gradient foreground, separate corner colors, solid or transparent background (with checkerboard preview).
- **Logo overlays**: one-click presets (Wi-Fi, Globe, WhatsApp, Email, GitHub, Instagram) or drag-and-drop your own PNG/JPG/SVG (max 2MB), with scale control and protective margin. Error correction is bumped to H automatically when a logo is added.
- **Style presets**: export the current style as a `.json` config and import it back later.
- **Camera scanner**: scan an existing QR code with the device camera and load its content into the editor (lazy-loaded chunk, only fetched when opened).
- **Downloads**: PNG at 256/512/1024 px or vector SVG.
- **Light & dark mode** with system-preference detection and a manual toggle.
- **PWA-ready** manifest and installable icons.

## Development

```bash
bun install
bun run dev        # Vite dev server on :5173
bun run build      # production build to dist/
bun run preview    # preview the production build
bun run deploy-prod  # build + wrangler pages deploy
```

## Structure

```
src/
  App.jsx                  state owner: content form values, style config, scanner
  components/
    ui/                    shadcn/ui primitives (generated via shadcn CLI, hfps preset)
    inputs/                one form per content type (Url, Text, Wifi, Email, Sms, Vcard)
    Header.jsx             wordmark, tagline, theme toggle
    ContentTypeTabs.jsx    content-type tab bar
    StylingPanel.jsx       shapes/colors/logo accordions + style export/import
    LivePreview.jsx        qr-code-styling canvas, resolution picker, download actions
    ScannerModal.jsx       html5-qrcode camera dialog (lazy-loaded)
    MobileFABs.jsx         floating scan / scroll-to-preview buttons (< lg)
  hooks/useTheme.js        light/dark theme with localStorage persistence
  utils/qrHelper.js        QR payload builders + preset logo assets
  index.css                Tailwind v4 + hfps design tokens only (no hand-rolled CSS)
```

QR rendering by [qr-code-styling](https://github.com/kozakdenys/qr-code-styling); scanning by [html5-qrcode](https://github.com/mebjas/html5-qrcode).

---

Developed by [Henrique Silva](https://hfps.dev).
