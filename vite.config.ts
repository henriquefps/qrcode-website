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
      // A deferred <script> for registerSW.js: the default classic script in <head> blocks the first paint.
      injectRegister: 'script-defer',
      // Own service worker (src/pwa/sw.ts): Workbox precache and runtime caching plus the Web Share Target POST handler.
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'sw.ts',
      // The Cloudflare plugin writes client assets into cf's Build Output, not dist/.
      outDir: '.cloudflare/output/v0/workers/default/assets',
      // public/manifest.webmanifest is served as is and linked from index.html.
      manifest: false,
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'manifest.webmanifest'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // og.png is only for link previews; the zxing WASM fallback (binary + its chunk), jszip (Batch only)
        // and Inter's non-Latin subsets are cached on first use (see the runtime routes in src/pwa/sw.ts) instead of precached.
        globIgnores: ['**/og.png', '**/wasm-*.js', '**/*.wasm', '**/jszip-*.js', '**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
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
            // Lazy (Batch dialog only); the name keeps it out of the precache (globIgnores above).
            { name: 'jszip', test: /node_modules[\\/]jszip[\\/]/, priority: 20 },
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
