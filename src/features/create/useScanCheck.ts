import { useEffect, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { buildQrOptions } from '@/lib/qrOptions';
import { overallVerdict, scanHints, scanVerdict, type ScanHint, type ScanVerdict } from '@/lib/scanCheck';
import type { StyleConfig } from '@/lib/preset';

export type ScanStatus = 'checking' | ScanVerdict | 'unavailable';

/** Sizes the rendered code is decoded at: about the preview, and a small print / far-away scan. */
const CHECK_SIZES = [400, 200] as const;
const DEBOUNCE_MS = 400;
/** A logo that never loads leaves qr-code-styling waiting forever; give up and say "Not checked". */
const TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS);
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

/** Renders the code exactly as styled (logo, colors, gradient), flattens it on white, and decodes it. */
async function decodeAt(data: string, style: StyleConfig, size: number, previewSize: number): Promise<{ text: string | null; moduleCount?: number }> {
  // The margin is in preview pixels; keep its share of the code the same at each check size.
  const scaled = { ...style, margin: Math.round((style.margin * size) / previewSize) };
  const qr = new QRCodeStyling(buildQrOptions(data, scaled, size));
  const blob = await qr.getRawData('png');
  if (!(blob instanceof Blob)) return { text: null };
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { text: null };
  // Transparent pixels would read as black; a transparent code is judged on white.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const { detect } = await import('@/lib/decode');
  const codes = await detect(canvas);
  const qrCode = codes.find((c) => c.format === 'qr_code') ?? codes[0];
  return { text: qrCode?.text ?? null, moduleCount: qr._qr?.getModuleCount() };
}

interface ScanResult {
  key: string;
  status: ScanStatus;
  hints: ScanHint[];
}

/** Debounced decode check of the current code, plus static style hints. Nothing leaves the device. */
export function useScanCheck(data: string, style: StyleConfig, previewSize: number): { status: ScanStatus; hints: ScanHint[] } {
  const key = JSON.stringify([data, style]);
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const large = await withTimeout(decodeAt(data, style, CHECK_SIZES[0], previewSize));
        if (cancelled) return;
        const small = large.text === null ? { text: null } : await withTimeout(decodeAt(data, style, CHECK_SIZES[1], previewSize));
        if (cancelled) return;
        const hints = scanHints(style, { moduleCount: large.moduleCount, size: previewSize });
        setResult({ key, status: overallVerdict(scanVerdict(data, large.text, small.text), hints), hints });
      } catch {
        // Decoder could not load (e.g. offline before the WASM fallback was cached) or render failed.
        if (!cancelled) setResult({ key, status: 'unavailable', hints: scanHints(style, { size: previewSize }) });
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `key` covers data and style by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, previewSize]);

  if (!result || result.key !== key) return { status: 'checking', hints: result?.hints ?? [] };
  return { status: result.status, hints: result.hints };
}
