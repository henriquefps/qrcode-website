/**
 * Frame scan loop shared by the camera and screen sources: requestAnimationFrame, throttled,
 * one detection in flight at a time, stops itself on the first frame with codes.
 */
import type { DetectedCode } from './decode';

export interface ScanLoopOptions<S> {
  /** The current frame source, or null while it is not ready (no video size yet). */
  getSource(): S | null;
  detect(source: S): Promise<DetectedCode[]>;
  /** Every finished detection (for drawing highlights). */
  onFrame?(codes: DetectedCode[]): void;
  /** First detection with at least one code; the loop has already stopped. */
  onFound(codes: DetectedCode[]): void;
  intervalMs?: number;
  raf?: (cb: (now: number) => void) => number;
  caf?: (id: number) => void;
}

export const SCAN_INTERVAL_MS = 100;

/** Starts the loop; returns a stop function (safe to call more than once). */
export function startScanLoop<S>({
  getSource,
  detect,
  onFrame,
  onFound,
  intervalMs = SCAN_INTERVAL_MS,
  raf = (cb) => requestAnimationFrame(cb),
  caf = (id) => cancelAnimationFrame(id),
}: ScanLoopOptions<S>): () => void {
  let handle = 0;
  let last = -Infinity;
  let busy = false;
  let stopped = false;

  const tick = (now: number) => {
    if (stopped) return;
    handle = raf(tick);
    if (busy || now - last < intervalMs) return;
    const source = getSource();
    if (!source) return;
    last = now;
    busy = true;
    detect(source)
      .then((codes) => {
        if (stopped) return;
        onFrame?.(codes);
        if (codes.length > 0) {
          stop();
          onFound(codes);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        busy = false;
      });
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    caf(handle);
  };

  handle = raf(tick);
  return stop;
}

/** A short haptic tick when a code is found, where supported (Android Chrome; a no-op elsewhere). */
export function vibrate(ms = 50): boolean {
  try {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function' ? navigator.vibrate(ms) : false;
  } catch {
    return false;
  }
}
