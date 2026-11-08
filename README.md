# Qrcode

Create and read QR codes in the browser. Free, open source, no account, nothing leaves your device.
Formerly QRGo. Live at <https://qrcode.hfps.dev>.

- **Create**: URL, text, Wi-Fi, email, SMS and vCard codes; dot, corner, color, gradient and logo styling;
  style presets (JSON export/import); PNG (256/512/1024 px) and SVG download.
- **Read** and **Quick show**: being added (see `docs/rebuild-spec.md`).

## Stack

Vite, React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui (`radix-vega`), Inter, Phosphor icons,
`qr-code-styling`, Vitest. Package manager: [bun](https://bun.sh).

## Scripts

```sh
bun install
bun run dev        # dev server
bun run build      # production build
bun run lint       # eslint
bunx tsc -b        # type check
bun run test       # vitest
```

## License

AGPL-3.0-or-later. See [LICENSE](LICENSE). Third-party notices are listed in the About dialog.
