import { describe, expect, it, vi } from 'vitest';
import { cancelPendingClear, clearIfUnchanged, copyWithAutoClear, scheduleClear, type AutoClearEnv } from './clipboard';

function fakeEnv(opts: { readable?: boolean; focused?: boolean; readThrows?: boolean; noRead?: boolean } = {}) {
  let content = '';
  let now = 0;
  let focused = opts.focused ?? true;
  const intervals = new Map<number, () => void>();
  let nextId = 1;
  const focusListeners = new Set<() => void>();
  const writes: string[] = [];
  const clipboard = {
    writeText: vi.fn(async (t: string) => {
      content = t;
      writes.push(t);
    }),
    readText: opts.noRead
      ? undefined
      : vi.fn(async () => {
          if (opts.readThrows) throw new DOMException('no', 'NotAllowedError');
          return content;
        }),
  };
  const env: AutoClearEnv = {
    clipboard,
    canRead: async () => opts.readable ?? true,
    hasFocus: () => focused,
    onFocus(cb) {
      focusListeners.add(cb);
      return () => focusListeners.delete(cb);
    },
    now: () => now,
    setInterval(cb) {
      const id = nextId++;
      intervals.set(id, cb);
      return id;
    },
    clearInterval: (id) => void intervals.delete(id as number),
  };
  return {
    env,
    clipboard,
    writes,
    get content() {
      return content;
    },
    set content(v: string) {
      content = v;
    },
    /** Advances fake time by whole seconds, firing interval callbacks each second. */
    advance(seconds: number) {
      for (let i = 0; i < seconds; i++) {
        now += 1000;
        for (const cb of [...intervals.values()]) cb();
      }
    },
    focus() {
      focused = true;
      for (const cb of [...focusListeners]) cb();
    },
    blur() {
      focused = false;
    },
    intervals,
    focusListeners,
  };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('clearIfUnchanged', () => {
  it('clears when the clipboard still holds the copied text', async () => {
    const f = fakeEnv();
    f.content = 'secret';
    expect(await clearIfUnchanged('secret', f.env)).toBe('cleared');
    expect(f.content).toBe('');
  });
  it('leaves the clipboard alone when something else was copied since', async () => {
    const f = fakeEnv();
    f.content = 'other';
    expect(await clearIfUnchanged('secret', f.env)).toBe('changed');
    expect(f.content).toBe('other');
  });
  it('clears unconditionally when reading would prompt', async () => {
    const f = fakeEnv({ readable: false });
    f.content = 'other';
    expect(await clearIfUnchanged('secret', f.env)).toBe('cleared');
    expect(f.clipboard.readText).not.toHaveBeenCalled();
    expect(f.content).toBe('');
  });
  it('clears unconditionally when readText is missing or throws', async () => {
    const a = fakeEnv({ noRead: true });
    a.content = 'x';
    expect(await clearIfUnchanged('secret', a.env)).toBe('cleared');
    const b = fakeEnv({ readThrows: true });
    b.content = 'x';
    expect(await clearIfUnchanged('secret', b.env)).toBe('cleared');
  });
  it('reports failure when writing fails or there is no clipboard', async () => {
    const f = fakeEnv();
    f.content = 's';
    f.clipboard.writeText.mockRejectedValueOnce(new Error('no focus'));
    expect(await clearIfUnchanged('s', f.env)).toBe('failed');
    expect(await clearIfUnchanged('s', { ...f.env, clipboard: undefined })).toBe('failed');
  });
});

describe('scheduleClear', () => {
  it('counts down and clears after the delay', async () => {
    const f = fakeEnv();
    f.content = 'pw';
    const ticks: number[] = [];
    const onDone = vi.fn();
    scheduleClear('pw', f.env, { onTick: (s) => ticks.push(s), onDone }, 3000);
    f.advance(2);
    await flush();
    expect(onDone).not.toHaveBeenCalled();
    f.advance(1);
    await flush();
    expect(ticks).toEqual([3, 2, 1, 0]);
    expect(onDone).toHaveBeenCalledWith('cleared');
    expect(f.content).toBe('');
    expect(f.intervals.size).toBe(0);
  });
  it('can be cancelled', async () => {
    const f = fakeEnv();
    f.content = 'pw';
    const onDone = vi.fn();
    const h = scheduleClear('pw', f.env, { onDone }, 2000);
    h.cancel();
    f.advance(5);
    await flush();
    expect(onDone).not.toHaveBeenCalled();
    expect(f.content).toBe('pw');
    expect(f.intervals.size).toBe(0);
  });
  it('waits for focus before clearing', async () => {
    const f = fakeEnv();
    f.content = 'pw';
    const onWaiting = vi.fn();
    const onDone = vi.fn();
    scheduleClear('pw', f.env, { onWaitingForFocus: onWaiting, onDone }, 2000);
    f.blur();
    f.advance(2);
    await flush();
    expect(onWaiting).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled();
    expect(f.intervals.size).toBe(0);
    f.focus();
    await flush();
    expect(onDone).toHaveBeenCalledWith('cleared');
    expect(f.focusListeners.size).toBe(0);
  });
});

describe('copyWithAutoClear', () => {
  it('copies, and a newer copy replaces the pending clear', async () => {
    const f = fakeEnv();
    const first = vi.fn();
    await copyWithAutoClear('one', { onDone: first }, f.env, 2000);
    expect(f.content).toBe('one');
    const second = vi.fn();
    await copyWithAutoClear('two', { onDone: second }, f.env, 2000);
    f.advance(2);
    await flush();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('cleared');
    expect(f.writes).toEqual(['one', 'two', '']);
  });
  it('cancelPendingClear stops the clear', async () => {
    const f = fakeEnv();
    const done = vi.fn();
    await copyWithAutoClear('one', { onDone: done }, f.env, 1000);
    cancelPendingClear();
    f.advance(3);
    await flush();
    expect(done).not.toHaveBeenCalled();
    expect(f.content).toBe('one');
  });
});
