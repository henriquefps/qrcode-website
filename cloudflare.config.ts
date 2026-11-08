import { bindings, defineConfig } from 'cf/config';
import * as entrypoint from './worker/index.ts' with { type: 'cf-worker' };

export default defineConfig({
  worker: {
    name: 'qrcode',
    compatibilityDate: '2026-11-01',
    entrypoint,
    assets: {
      notFoundHandling: 'single-page-application',
      // Host filtering can't be expressed as patterns, so the Worker sees every request
      // and passes non-qrgo hosts straight to the assets binding.
      runWorkerFirst: true,
    },
    env: { ASSETS: bindings.assets() },
    domains: ['qrcode.hfps.dev', 'qrgo.hfps.dev'],
  },
});
