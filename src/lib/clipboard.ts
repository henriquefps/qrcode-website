/**
 * Clipboard auto-clear for secrets (Wi-Fi passwords, OTP secrets, masked text).
 *
 * After a delay we overwrite the clipboard with an empty string, but only if it still holds what we
 * copied. Reading the clipboard is only attempted when the `clipboard-read` permission is already
 * granted, so the user never gets a surprise paste prompt; otherwise we clear unconditionally
 * (best effort). Browsers only allow clipboard writes while the document has focus, so when the
 * time is up in a background tab the clear waits until the page is focused again.
 * Nothing is persisted: a reload or closing the tab drops the pending clear.
 */

export interface ClipboardLike {
  writeText(text: string): Promise<void>;
  readText?(): Promise<string>;
}

export interface AutoClearEnv {
  clipboard: ClipboardLike | undefined;
  /** True when reading the clipboard will not prompt the user. */
  canRead(): Promise<boolean>;
  hasFocus(): boolean;
  /** Subscribes to the page regaining focus; returns an unsubscribe function. */
  onFocus(cb: () => void): () => void;
  now(): number;
  setInterval(cb: () => void, ms: number): unknown;
  clearInterval(id: unknown): void;
}

export type ClearOutcome = 'cleared' | 'changed' | 'failed';

/** Overwrites the clipboard with '' if it still holds `copied` (or if it cannot be read). */
export async function clearIfUnchanged(copied: string, env: Pick<AutoClearEnv, 'clipboard' | 'canRead'>): Promise<ClearOutcome> {
  const cb = env.clipboard;
  if (!cb) return 'failed';
  let readable = false;
  try {
    readable = Boolean(cb.readText) && (await env.canRead());
  } catch {
    readable = false;
  }
  if (readable) {
    try {
      const current = await cb.readText!();
      if (current !== copied) return 'changed';
    } catch {
      // Unreadable after all (e.g. not focused, non-text content): fall through to best effort.
    }
  }
  try {
    await cb.writeText('');
    return 'cleared';
  } catch {
    return 'failed';
  }
}

export interface AutoClearCallbacks {
  /** Whole seconds left, called right away and then every second. */
  onTick?(secondsLeft: number): void;
  /** Time is up but the page is not focused; the clear runs when it is. */
  onWaitingForFocus?(): void;
  onDone?(outcome: ClearOutcome): void;
}

export interface AutoClearHandle {
  cancel(): void;
}

export const AUTO_CLEAR_MS = 30_000;

export function scheduleClear(copied: string, env: AutoClearEnv, callbacks: AutoClearCallbacks = {}, delayMs = AUTO_CLEAR_MS): AutoClearHandle {
  const deadline = env.now() + delayMs;
  let done = false;
  let interval: unknown = null;
  let unsubscribeFocus: (() => void) | null = null;

  const stopTimers = () => {
    if (interval !== null) env.clearInterval(interval);
    interval = null;
    unsubscribeFocus?.();
    unsubscribeFocus = null;
  };

  const run = () => {
    stopTimers();
    void clearIfUnchanged(copied, env).then((outcome) => {
      if (done) return;
      done = true;
      callbacks.onDone?.(outcome);
    });
  };

  const tick = () => {
    if (done) return;
    const left = Math.max(0, Math.ceil((deadline - env.now()) / 1000));
    callbacks.onTick?.(left);
    if (left > 0) return;
    if (env.hasFocus()) {
      run();
    } else if (!unsubscribeFocus) {
      if (interval !== null) env.clearInterval(interval);
      interval = null;
      callbacks.onWaitingForFocus?.();
      unsubscribeFocus = env.onFocus(() => {
        if (!done) run();
      });
    }
  };

  tick();
  if (!done && !unsubscribeFocus) interval = env.setInterval(tick, 1000);

  return {
    cancel() {
      if (done) return;
      done = true;
      stopTimers();
    },
  };
}

/** The real browser environment. */
export function browserEnv(): AutoClearEnv {
  return {
    clipboard: typeof navigator !== 'undefined' ? navigator.clipboard : undefined,
    async canRead() {
      try {
        const status = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
        return status.state === 'granted';
      } catch {
        return false;
      }
    },
    hasFocus: () => document.hasFocus(),
    onFocus(cb) {
      window.addEventListener('focus', cb);
      return () => window.removeEventListener('focus', cb);
    },
    now: () => Date.now(),
    setInterval: (cb, ms) => window.setInterval(cb, ms),
    clearInterval: (id) => window.clearInterval(id as number),
  };
}

let pending: AutoClearHandle | null = null;

/**
 * Copies `text` and schedules the auto-clear. A newer copy replaces the pending clear, so only the
 * last secret is tracked. Lives at module level so leaving the Read view does not cancel it.
 */
export async function copyWithAutoClear(text: string, callbacks: AutoClearCallbacks = {}, env: AutoClearEnv = browserEnv(), delayMs = AUTO_CLEAR_MS): Promise<AutoClearHandle> {
  if (!env.clipboard) throw new Error('Clipboard unavailable');
  await env.clipboard.writeText(text);
  pending?.cancel();
  const handle = scheduleClear(text, env, {
    ...callbacks,
    onDone(outcome) {
      if (pending === handle) pending = null;
      callbacks.onDone?.(outcome);
    },
  }, delayMs);
  pending = handle;
  return handle;
}

/** Cancels the pending clear, if any (e.g. a plain copy replaced the secret). */
export function cancelPendingClear() {
  pending?.cancel();
  pending = null;
}
