import { describe, expect, it, vi } from 'vitest';
import { keepScreenAwake } from './wakeLock';

function fakeEnv() {
  const listeners = new Set<() => void>();
  const sentinels: { released: boolean; release: () => Promise<void> }[] = [];
  const doc = {
    visibilityState: 'visible' as DocumentVisibilityState,
    addEventListener: (_: string, l: () => void) => listeners.add(l),
    removeEventListener: (_: string, l: () => void) => listeners.delete(l),
  };
  const request = vi.fn(async () => {
    const s = {
      released: false,
      release: vi.fn(async () => {
        s.released = true;
      }),
    };
    sentinels.push(s);
    return s;
  });
  const env = { navigator: { wakeLock: { request } }, document: doc as unknown as Document };
  const fire = () => listeners.forEach((l) => l());
  return { env, request, sentinels, doc, listeners, fire };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('keepScreenAwake', () => {
  it('does nothing when the API is missing', () => {
    const stop = keepScreenAwake({ navigator: {}, document: fakeEnv().env.document });
    expect(() => stop()).not.toThrow();
  });

  it('requests a screen lock and releases it on cleanup', async () => {
    const { env, request, sentinels, listeners } = fakeEnv();
    const onChange = vi.fn();
    const stop = keepScreenAwake(env, onChange);
    await flush();
    expect(request).toHaveBeenCalledWith('screen');
    expect(onChange).toHaveBeenLastCalledWith(true);
    stop();
    expect(sentinels[0].released).toBe(true);
    expect(listeners.size).toBe(0);
  });

  it('re-acquires when the page becomes visible again', async () => {
    const { env, request, sentinels, doc, fire } = fakeEnv();
    const stop = keepScreenAwake(env);
    await flush();
    // The browser releases the lock when the tab is hidden.
    doc.visibilityState = 'hidden';
    sentinels[0].released = true;
    fire();
    await flush();
    expect(request).toHaveBeenCalledTimes(1);
    doc.visibilityState = 'visible';
    fire();
    await flush();
    expect(request).toHaveBeenCalledTimes(2);
    // Still held: no duplicate request.
    fire();
    await flush();
    expect(request).toHaveBeenCalledTimes(2);
    stop();
  });

  it('survives a refused request', async () => {
    const { env } = fakeEnv();
    env.navigator.wakeLock.request.mockRejectedValueOnce(new Error('NotAllowedError'));
    const onChange = vi.fn();
    const stop = keepScreenAwake(env, onChange);
    await flush();
    expect(onChange).toHaveBeenCalledWith(false);
    stop();
  });

  it('releases a lock granted after cleanup', async () => {
    const { env, sentinels } = fakeEnv();
    const stop = keepScreenAwake(env);
    stop();
    await flush();
    expect(sentinels[0].released).toBe(true);
  });
});
