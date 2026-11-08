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
/** Set once the native detector hung or threw: from then on this page only uses WASM. */
let nativeBroken = false;
let activeEngine: DecoderEngine | null = null;
/** Whether a native detect() has ever finished; the first call may include loading the platform's model. */
let nativeWarm = false;

/**
 * Native detect() deadlines. Some Chromium builds on macOS never settle the promise; a timeout turns that into a
 * switch to WASM. A healthy native frame takes tens of milliseconds, so these never fire in the camera loop.
 */
export const NATIVE_FIRST_TIMEOUT_MS = 2000;
export const NATIVE_TIMEOUT_MS = 4000;

/** Test hook: forces the WASM fallback even when BarcodeDetector exists. */
export function setForceWasm(value: boolean) {
  forceWasm = value;
  decoderPromise = null;
}

/** Test hook: forgets the engine choice (and a native failure). */
export function resetDecoder() {
  decoderPromise = null;
  forceWasm = false;
  nativeBroken = false;
  nativeWarm = false;
  activeEngine = null;
}

/** The engine in use, or null before the first decode. */
export function getActiveEngine(): DecoderEngine | null {
  return activeEngine;
}

class NativeTimeout extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new NativeTimeout(`native detector did not answer in ${ms} ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

async function createNative(): Promise<Decoder | null> {
  const Native = (globalThis as { BarcodeDetector?: { new (o?: { formats?: string[] }): DetectorLike; getSupportedFormats?: () => Promise<string[]> } }).BarcodeDetector;
  if (!Native) return null;
  try {
    const supported = (await withTimeout(Native.getSupportedFormats?.() ?? Promise.resolve([]), NATIVE_FIRST_TIMEOUT_MS)) ?? [];
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
  decoderPromise ??= (async () => {
    const decoder = (forceWasm || nativeBroken ? null : await createNative()) ?? (await createWasm());
    activeEngine = decoder.engine;
    return decoder;
  })().catch((error) => {
    decoderPromise = null;
    throw error;
  });
  return decoderPromise;
}

/** Native detect() that hung or threw: switch this page to WASM for good. */
function abandonNative() {
  if (nativeBroken) return;
  nativeBroken = true;
  decoderPromise = null;
}

type RawCode = Awaited<ReturnType<DetectorLike['detect']>>[number];

async function rawDetect(source: ImageBitmapSource): Promise<RawCode[]> {
  const decoder = await getDecoder();
  if (decoder.engine !== 'native') return decoder.detector.detect(source);
  try {
    const found = await withTimeout(decoder.detector.detect(source), nativeWarm ? NATIVE_TIMEOUT_MS : NATIVE_FIRST_TIMEOUT_MS);
    nativeWarm = true;
    return found;
  } catch {
    // Hung or threw (e.g. a broken platform service): retry this same source with WASM, and keep using it.
    abandonNative();
    return (await getDecoder()).detector.detect(source);
  }
}

/** Same code path for video frames, images and canvases. */
export async function detect(source: ImageBitmapSource): Promise<DetectedCode[]> {
  const found = await rawDetect(source);
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
