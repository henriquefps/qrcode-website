import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

interface NativeDetector {
  getSupportedFormats?: () => Promise<string[]>;
}

/** True when this browser has no usable native QR detector (Safari, Firefox, Chrome on Linux...). */
export async function needsWasmFallback(Native: NativeDetector | undefined): Promise<boolean> {
  if (!Native) return true;
  try {
    const formats = (await Native.getSupportedFormats?.()) ?? [];
    return !formats.includes('qr_code');
  } catch {
    return true;
  }
}

export interface PrefetchDeps {
  /** The page's BarcodeDetector constructor, if any. */
  native: NativeDetector | undefined;
  isOnline: () => boolean;
  /** Data Saver is on: do not download anything that was not asked for. */
  saveData: boolean;
  /** Runs `fn` when the main thread is idle. */
  whenIdle: (fn: () => void) => void;
  /** Runs `fn` once, the next time the browser goes online. */
  whenOnline: (fn: () => void) => void;
  /** Resolves when a service worker controls the page (so the requests land in its runtime cache), or false if none will. */
  controlled: () => Promise<boolean>;
  /** Downloads the WASM chunk and binary. */
  fetchAssets: () => Promise<void>;
}

/**
 * Warms the zxing WASM fallback (its JS chunk and the .wasm binary) into the service worker's runtime cache once the app
 * is idle and online, so the first read also works offline. Skipped where the native detector reads QR codes.
 * Resolves to whether the assets were fetched.
 */
export async function prefetchWasmFallback(deps: PrefetchDeps): Promise<boolean> {
  if (deps.saveData || !(await needsWasmFallback(deps.native))) return false;
  await new Promise<void>((resolve) => deps.whenIdle(resolve));
  if (!deps.isOnline()) await new Promise<void>((resolve) => deps.whenOnline(resolve));
  if (!(await deps.controlled())) return false;
  try {
    await deps.fetchAssets();
    return true;
  } catch {
    // Offline again or a failed download: the decoder still loads on first use.
    return false;
  }
}

/** Waits up to `timeout` ms for a service worker to take control of this page. */
function waitForController(timeout = 30_000): Promise<boolean> {
  const sw = navigator.serviceWorker;
  if (!sw) return Promise.resolve(false);
  if (sw.controller) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(false), timeout);
    sw.addEventListener(
      'controllerchange',
      () => {
        window.clearTimeout(timer);
        resolve(true);
      },
      { once: true },
    );
  });
}

/** Browser wiring for prefetchWasmFallback. Call once after the first render. */
export function scheduleWasmPrefetch(): void {
  if (import.meta.env.DEV) return;
  const connection = (navigator as { connection?: { saveData?: boolean } }).connection;
  void prefetchWasmFallback({
    native: (globalThis as { BarcodeDetector?: NativeDetector }).BarcodeDetector,
    isOnline: () => navigator.onLine,
    saveData: connection?.saveData === true,
    whenIdle: (fn) => (typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(() => fn(), { timeout: 10_000 }) : setTimeout(fn, 3_000)),
    whenOnline: (fn) => window.addEventListener('online', () => fn(), { once: true }),
    controlled: () => waitForController(),
    fetchAssets: async () => {
      // The same requests the decoder makes; the service worker's CacheFirst route stores both.
      await Promise.all([import('./wasm'), fetch(wasmUrl).then((res) => res.arrayBuffer())]);
    },
  });
}
