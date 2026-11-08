import { afterEach, describe, expect, it, vi } from 'vitest';
import { startScanLoop, vibrate } from './scanLoop';
import type { DetectedCode } from './decode';

function fakeRaf() {
  const queue = new Map<number, (now: number) => void>();
  let id = 0;
  return {
    raf: (cb: (now: number) => void) => {
      queue.set(++id, cb);
      return id;
    },
    caf: (h: number) => void queue.delete(h),
    /** Runs the pending frame callbacks at time `now`. */
    frame(now: number) {
      const cbs = [...queue.values()];
      queue.clear();
      cbs.forEach((cb) => cb(now));
    },
    get pending() {
      return queue.size;
    },
  };
}

const flush = () => new Promise((r) => setTimeout(r, 0));
const code = (text: string): DetectedCode => ({ text, format: 'qr_code' });

describe('startScanLoop', () => {
  it('throttles, skips while not ready, and stops on the first result', async () => {
    const r = fakeRaf();
    let ready = false;
    const results: DetectedCode[][] = [[], [code('hi')]];
    const detect = vi.fn(async () => results.shift() ?? []);
    const onFound = vi.fn();
    const onFrame = vi.fn();
    startScanLoop({ getSource: () => (ready ? 'frame' : null), detect, onFound, onFrame, intervalMs: 100, raf: r.raf, caf: r.caf });

    r.frame(0); // not ready
    expect(detect).not.toHaveBeenCalled();
    ready = true;
    r.frame(16);
    expect(detect).toHaveBeenCalledTimes(1);
    await flush();
    r.frame(50); // throttled
    expect(detect).toHaveBeenCalledTimes(1);
    r.frame(120);
    expect(detect).toHaveBeenCalledTimes(2);
    await flush();
    expect(onFrame).toHaveBeenCalledTimes(2);
    expect(onFound).toHaveBeenCalledWith([code('hi')]);
    expect(r.pending).toBe(0);
  });

  it('keeps one detection in flight and ignores results after stop', async () => {
    const r = fakeRaf();
    let resolve: (c: DetectedCode[]) => void = () => undefined;
    const detect = vi.fn(() => new Promise<DetectedCode[]>((res) => (resolve = res)));
    const onFound = vi.fn();
    const stop = startScanLoop({ getSource: () => 'frame', detect, onFound, raf: r.raf, caf: r.caf });
    r.frame(0);
    r.frame(500);
    expect(detect).toHaveBeenCalledTimes(1);
    stop();
    resolve([code('late')]);
    await flush();
    expect(onFound).not.toHaveBeenCalled();
    expect(r.pending).toBe(0);
  });

  it('survives detector errors', async () => {
    const r = fakeRaf();
    const detect = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce([code('ok')]);
    const onFound = vi.fn();
    startScanLoop({ getSource: () => 'frame', detect, onFound, raf: r.raf, caf: r.caf });
    r.frame(0);
    await flush();
    r.frame(200);
    await flush();
    expect(onFound).toHaveBeenCalledWith([code('ok')]);
  });
});

describe('vibrate', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('calls navigator.vibrate when present', () => {
    const fn = vi.fn(() => true);
    vi.stubGlobal('navigator', { vibrate: fn });
    expect(vibrate()).toBe(true);
    expect(fn).toHaveBeenCalledWith(50);
  });
  it('is a no-op without support', () => {
    vi.stubGlobal('navigator', {});
    expect(vibrate()).toBe(false);
  });
});
