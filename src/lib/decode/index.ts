/** One decoded code. `corners` are in source pixel coordinates when the engine reports them. */
export interface DetectedCode {
  text: string;
  format: string;
  corners?: { x: number; y: number }[];
}

export type DecoderEngine = 'native' | 'wasm';

interface DetectorLike {
  detect(source: ImageBitmapSource): Promise<{ rawValue: string; format: string; cornerPoints?: { x: number; y: number }[] }[]>;
}

interface Decoder {
  engine: DecoderEngine;
  detector: DetectorLike;
}

/** Formats we ask for: QR plus the common 1D/2D codes (cheap for both engines). */
const FORMATS = ['qr_code', 'micro_qr_code', 'data_matrix', 'aztec', 'pdf417', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf', 'codabar'];

let decoderPromise: Promise<Decoder> | null = null;
let forceWasm = false;

/** Test hook: forces the WASM fallback even when BarcodeDetector exists. */
export function setForceWasm(value: boolean) {
  forceWasm = value;
  decoderPromise = null;
}

async function createNative(): Promise<Decoder | null> {
  const Native = (globalThis as { BarcodeDetector?: { new (o?: { formats?: string[] }): DetectorLike; getSupportedFormats?: () => Promise<string[]> } }).BarcodeDetector;
  if (!Native) return null;
  try {
    const supported = (await Native.getSupportedFormats?.()) ?? [];
    if (!supported.includes('qr_code')) return null;
    return { engine: 'native', detector: new Native({ formats: FORMATS.filter((f) => supported.includes(f)) }) };
  } catch {
    return null;
  }
}

async function createWasm(): Promise<Decoder> {
  // Separate lazy chunk; the .wasm file is emitted by Vite and served from our own origin.
  const { createWasmDetector } = await import('./wasm');
  return { engine: 'wasm', detector: await createWasmDetector(FORMATS) };
}

export function getDecoder(): Promise<Decoder> {
  decoderPromise ??= (async () => (forceWasm ? null : await createNative()) ?? (await createWasm()))().catch((error) => {
    decoderPromise = null;
    throw error;
  });
  return decoderPromise;
}

/** Same code path for video frames, images and canvases. */
export async function detect(source: ImageBitmapSource): Promise<DetectedCode[]> {
  const { detector } = await getDecoder();
  const found = await detector.detect(source);
  const seen = new Set<string>();
  const out: DetectedCode[] = [];
  for (const code of found) {
    if (!code.rawValue || seen.has(code.rawValue)) continue;
    seen.add(code.rawValue);
    out.push({ text: code.rawValue, format: code.format, corners: code.cornerPoints?.map((p) => ({ x: p.x, y: p.y })) });
  }
  return out;
}

/** Decodes an image file or blob. Large images are tried at full size, then a downscaled copy. */
export async function detectFromBlob(blob: Blob): Promise<DetectedCode[]> {
  const bitmap = await createImageBitmap(blob);
  try {
    const codes = await detect(bitmap);
    if (codes.length > 0) return codes;
    const max = 1600;
    if (Math.max(bitmap.width, bitmap.height) <= max) return codes;
    const scale = max / Math.max(bitmap.width, bitmap.height);
    const small = await createImageBitmap(bitmap, { resizeWidth: Math.round(bitmap.width * scale), resizeHeight: Math.round(bitmap.height * scale), resizeQuality: 'high' });
    try {
      return await detect(small);
    } finally {
      small.close();
    }
  } finally {
    bitmap.close();
  }
}
