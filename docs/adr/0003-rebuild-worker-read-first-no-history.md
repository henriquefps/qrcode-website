# ADR 0003: Rebuild as Qrcode (Worker deploy, Read-first, no history)

* **Date**: 2026-11-08
* **Status**: Accepted

## Context
QRGo was a Create-only generator on Cloudflare Pages, written in JS with base-ui components and a hand-written service worker. The most common real use turned out to be moving a password or URL between a computer and a phone that share no network: one device shows a code, the other reads it. A generator alone does not cover that.

## Decision
- **Rebuild as Qrcode** (`qrcode.hfps.dev`, repo `qrcode-website`), TypeScript strict, shadcn `radix-vega`, default blue palette. The old code lives on branch `archive/qrgo`.
- **Read is equal to Create.** Camera, image, drop and paste, with a result panel that parses Wi-Fi, vCard, otpauth and friends and masks secrets. **Quick show** (key `Q`) turns pasted text into a huge black-on-white code.
- **Detection**: native `BarcodeDetector` when present, otherwise a lazy `barcode-detector`/`zxing-wasm` fallback that is runtime-cached by the PWA, not precached.
- **No history.** Nothing typed, scanned or pasted is stored or sent anywhere; only theme and palette live in `localStorage`. Secrets are masked by default.
- **Deploy as a Cloudflare Worker** (`cf` CLI, no Wrangler config) serving static assets, so `qrgo.hfps.dev` can be answered by the same Worker: a self-unregistering `/sw.js` plus 301 redirects to the new domain. See `docs/deploy.md`.
- **License AGPL-3.0-or-later**, verbatim `LICENSE`.

## Consequences
- Camera needs a secure context (HTTPS or localhost); the UI explains the failure states.
- The PWA precache stays under 1 MiB; the first use of the fallback decoder downloads about 0.4 MB (gzip) once.
- Without history there is nothing to recover after a reload; this is intended.
- The Worker adds a host check on every request (`runWorkerFirst`) in exchange for one deployment owning both domains.
