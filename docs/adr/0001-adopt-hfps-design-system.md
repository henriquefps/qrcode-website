# ADR 0001: Adopt the hfps design system via shadcn CLI preset

* **Date**: 2026-07-07
* **Status**: Accepted

## Context
The app's UI was styled with ~1,700 lines of hand-rolled CSS (`src/index.css`) using a custom "indigo/slate" palette, custom accordion/tab/toggle/slider widgets, and Google Fonts loaded from a CDN. Henrique's other products (hfps.dev, AppShot, LogoGo) share one visual identity produced by the shadcn CLI applying a preset — not by copying CSS. QRGo looked and behaved like a different brand, and every widget had to be maintained by hand.

## Decision
Re-scaffolded the styling with `shadcn init --preset b6thjhmE4` (resolves to `base-sera` style, `olive` base color, Phosphor icons, Tailwind CSS v4, Inter Variable via `@fontsource-variable/inter`). All UI is now composed from generated `src/components/ui/*` primitives (Button, Tabs, Accordion, Select, Slider, Switch, Dialog, Card, Sonner, …) built on **Base UI** (`@base-ui/react`), not Radix — note the API differences (`onValueChange`, `onCheckedChange`, `Select` needs an `items` prop for `SelectValue` to render labels). `src/index.css` keeps only the preset tokens plus one rule for the html5-qrcode video element. The project stays JavaScript (`tsx: false` in `components.json`); the CLI generates `.jsx` primitives. Light `--background` was set to hfps.dev's off-white (`oklch(0.966 0.005 106.5)`) since light mode is actually exercised here. Added light/dark theming (`src/hooks/useTheme.js` + pre-paint script in `index.html`).

## Consequences
- Visual/behavioral parity with the rest of the hfps portfolio; future components come from `bunx shadcn add <component>` instead of hand-written CSS.
- Bundle now includes Base UI + Phosphor; the camera scanner (`html5-qrcode`) was split into a lazy chunk to compensate (main chunk 608 KB → scanner 351 KB on demand).
- Inter is self-hosted (no Google Fonts request); fonts must be imported from JS (`main.jsx`), not CSS `@import`, or Vite leaves the woff2 URLs unresolved.
- The preset code is not sacred — re-theming is `shadcn apply --preset <code>` away, per the design-system doc.
