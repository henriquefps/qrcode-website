import { describe, expect, it, vi } from 'vitest';
import { needsWasmFallback, prefetchWasmFallback, type PrefetchDeps } from './prefetch';

vi.mock('zxing-wasm/reader/zxing_reader.wasm?url', () => ({ default: '/assets/zxing_reader.wasm' }));

function deps(overrides: Partial<PrefetchDeps> = {}): PrefetchDeps {
  return {
    native: undefined,
    isOnline: () => true,
    saveData: false,
    whenIdle: (fn) => fn(),
    whenOnline: (fn) => fn(),
    controlled: async () => true,
    fetchAssets: vi.fn(async () => {}),
    ...overrides,
  };
}

describe('needsWasmFallback', () => {
  it('needs the fallback without BarcodeDetector or without qr_code', async () => {
    expect(await needsWasmFallback(undefined)).toBe(true);
    expect(await needsWasmFallback({ getSupportedFormats: async () => ['ean_13'] })).toBe(true);
    expect(await needsWasmFallback({})).toBe(true);
    expect(await needsWasmFallback({ getSupportedFormats: () => Promise.reject(new Error('x')) })).toBe(true);
  });
  it('does not need it with native QR support', async () => {
    expect(await needsWasmFallback({ getSupportedFormats: async () => ['qr_code', 'ean_13'] })).toBe(false);
  });
});

describe('prefetchWasmFallback', () => {
  it('fetches when the native detector is missing', async () => {
    const d = deps();
    expect(await prefetchWasmFallback(d)).toBe(true);
    expect(d.fetchAssets).toHaveBeenCalledOnce();
  });

  it('skips browsers with native QR support', async () => {
    const d = deps({ native: { getSupportedFormats: async () => ['qr_code'] } });
    expect(await prefetchWasmFallback(d)).toBe(false);
    expect(d.fetchAssets).not.toHaveBeenCalled();
  });

  it('respects Data Saver', async () => {
    const d = deps({ saveData: true });
    expect(await prefetchWasmFallback(d)).toBe(false);
    expect(d.fetchAssets).not.toHaveBeenCalled();
  });

  it('waits for idle, then for the network', async () => {
    const order: string[] = [];
    let goOnline: () => void = () => {};
    let online = false;
    const d = deps({
      isOnline: () => online,
      whenIdle: (fn) => {
        order.push('idle');
        fn();
      },
      whenOnline: (fn) => {
        order.push('wait-online');
        goOnline = () => {
          online = true;
          fn();
        };
      },
      fetchAssets: vi.fn(async () => void order.push('fetch')),
    });
    const done = prefetchWasmFallback(d);
    await new Promise((r) => setTimeout(r, 0));
    expect(order).toEqual(['idle', 'wait-online']);
    goOnline();
    expect(await done).toBe(true);
    expect(order).toEqual(['idle', 'wait-online', 'fetch']);
  });

  it('skips when no service worker controls the page', async () => {
    const d = deps({ controlled: async () => false });
    expect(await prefetchWasmFallback(d)).toBe(false);
    expect(d.fetchAssets).not.toHaveBeenCalled();
  });

  it('swallows download errors', async () => {
    expect(await prefetchWasmFallback(deps({ fetchAssets: () => Promise.reject(new Error('offline')) }))).toBe(false);
  });
});
