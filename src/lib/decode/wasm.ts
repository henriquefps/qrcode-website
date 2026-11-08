import { BarcodeDetector, setZXingModuleOverrides } from 'barcode-detector/ponyfill';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

/** WASM fallback for browsers without BarcodeDetector. The wasm binary is bundled, never fetched from a CDN. */
export async function createWasmDetector(formats: string[]) {
  setZXingModuleOverrides({
    locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path),
  });
  const supported = await BarcodeDetector.getSupportedFormats();
  return new BarcodeDetector({ formats: formats.filter((f) => (supported as string[]).includes(f)) as never });
}
