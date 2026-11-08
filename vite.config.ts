import path from 'path';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    tailwindcss(),
    cloudflare(),
    VitePWA({
      registerType: 'autoUpdate',
      // The Cloudflare plugin writes client assets into cf's Build Output, not dist/.
      outDir: '.cloudflare/output/v0/workers/default/assets',
      // public/manifest.webmanifest is served as is and linked from index.html.
      manifest: false,
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'manifest.webmanifest'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // og.png is only for link previews; the zxing WASM fallback (binary + its chunk) and Inter's
        // non-Latin subsets are cached on first use instead of precached.
        globIgnores: ['**/og.png', '**/wasm-*.js', '**/*.wasm', '**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
        navigateFallbackDenylist: [/^\/sw\.js$/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/assets\/(wasm-.*\.js|.*\.wasm)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'zxing-wasm', expiration: { maxEntries: 6 }, cacheableResponse: { statuses: [200] } },
          },
          {
            urlPattern: ({ url }) => /\/assets\/.*\.woff2$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20 }, cacheableResponse: { statuses: [200] } },
          },
        ],
      },
    }),
  ],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Stable vendor chunks: they change rarely, so returning visitors re-download only app code.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 30 },
            { name: 'radix', test: /node_modules[\\/](radix-ui|@radix-ui|@floating-ui|aria-hidden|react-remove-scroll[^\\/]*)[\\/]/, priority: 20 },
            { name: 'qr-styling', test: /node_modules[\\/]qr-code-styling[\\/]/, priority: 20 },
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
