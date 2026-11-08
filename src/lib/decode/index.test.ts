import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const wasmDetect = vi.fn(async () => [{ rawValue: 'from-wasm', format: 'qr_code' }]);
vi.mock('./wasm', () => ({ createWasmDetector: vi.fn(async () => ({ detect: wasmDetect })) }));

import { detect, getActiveEngine, NATIVE_FIRST_TIMEOUT_MS, NATIVE_TIMEOUT_MS, resetDecoder } from './index';

const source = {} as ImageBitmapSource;

function installNative(detectImpl: () => Promise<unknown>) {
  const nativeDetect = vi.fn(detectImpl);
  class FakeDetector {
    static getSupportedFormats = async () => ['qr_code', 'ean_13'];
    detect = nativeDetect;
  }
  (globalThis as { BarcodeDetector?: unknown }).BarcodeDetector = FakeDetector;
  return nativeDetect;
}

beforeEach(() => {
  resetDecoder();
  wasmDetect.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as { BarcodeDetector?: unknown }).BarcodeDetector;
});

describe('decode engine selection', () => {
  it('uses the native detector when it answers', async () => {
    const native = installNative(async () => [{ rawValue: 'native', format: 'qr_code' }]);
    expect(await detect(source)).toEqual([{ text: 'native', format: 'qr_code', corners: undefined }]);
    expect(getActiveEngine()).toBe('native');
    expect(native).toHaveBeenCalledOnce();
    expect(wasmDetect).not.toHaveBeenCalled();
  });

  it('uses WASM when there is no native detector', async () => {
    expect(await detect(source)).toEqual([{ text: 'from-wasm', format: 'qr_code', corners: undefined }]);
    expect(getActiveEngine()).toBe('wasm');
  });

  it('falls back to WASM for good when native detect() never settles', async () => {
    vi.useFakeTimers();
    const native = installNative(() => new Promise(() => {}));
    const result = detect(source);
    await vi.advanceTimersByTimeAsync(NATIVE_FIRST_TIMEOUT_MS + 1);
    expect(await result).toEqual([{ text: 'from-wasm', format: 'qr_code', corners: undefined }]);
    expect(wasmDetect).toHaveBeenCalledWith(source);
    expect(getActiveEngine()).toBe('wasm');
    // Later calls go straight to WASM.
    await detect(source);
    expect(native).toHaveBeenCalledOnce();
    expect(wasmDetect).toHaveBeenCalledTimes(2);
  });

  it('falls back to WASM for good when native detect() throws', async () => {
    const native = installNative(async () => {
      throw new DOMException('Barcode detection service unavailable', 'NotSupportedError');
    });
    expect(await detect(source)).toEqual([{ text: 'from-wasm', format: 'qr_code', corners: undefined }]);
    expect(getActiveEngine()).toBe('wasm');
    await detect(source);
    expect(native).toHaveBeenCalledOnce();
  });

  it('gives a warm native detector a longer deadline', async () => {
    vi.useFakeTimers();
    let call = 0;
    installNative(() => (call++ === 0 ? Promise.resolve([]) : new Promise((r) => setTimeout(() => r([{ rawValue: 'slow', format: 'qr_code' }]), NATIVE_FIRST_TIMEOUT_MS + 500))));
    await detect(source);
    const slow = detect(source);
    await vi.advanceTimersByTimeAsync(NATIVE_FIRST_TIMEOUT_MS + 600);
    expect(await slow).toEqual([{ text: 'slow', format: 'qr_code', corners: undefined }]);
    expect(getActiveEngine()).toBe('native');
    expect(NATIVE_TIMEOUT_MS).toBeGreaterThan(NATIVE_FIRST_TIMEOUT_MS);
  });
});
