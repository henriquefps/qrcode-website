interface Sentinel {
  released: boolean;
  release(): Promise<void>;
  addEventListener?(type: 'release', listener: () => void): void;
}

interface WakeLockApi {
  request(type: 'screen'): Promise<Sentinel>;
}

interface WakeLockEnv {
  navigator: { wakeLock?: WakeLockApi };
  document: Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>;
}

/**
 * Keeps the screen on with the Screen Wake Lock API. The browser drops the lock whenever the tab is hidden,
 * so it is requested again when the page becomes visible. Unsupported or refused: does nothing.
 * Returns a cleanup that releases the lock.
 */
export function keepScreenAwake(env: WakeLockEnv = { navigator, document }, onChange?: (held: boolean) => void): () => void {
  const api = env.navigator.wakeLock;
  if (!api) return () => {};
  let sentinel: Sentinel | null = null;
  let stopped = false;
  let pending = false;

  const acquire = async () => {
    if (stopped || pending || env.document.visibilityState !== 'visible' || (sentinel && !sentinel.released)) return;
    pending = true;
    try {
      const lock = await api.request('screen');
      if (stopped) {
        void lock.release().catch(() => {});
        return;
      }
      sentinel = lock;
      onChange?.(true);
      lock.addEventListener?.('release', () => {
        if (sentinel === lock) onChange?.(false);
      });
    } catch {
      // Refused (battery saver, not allowed by policy, not a user-activated page): keep going without it.
      onChange?.(false);
    } finally {
      pending = false;
    }
  };

  const onVisibility = () => void acquire();
  env.document.addEventListener('visibilitychange', onVisibility);
  void acquire();

  return () => {
    stopped = true;
    env.document.removeEventListener('visibilitychange', onVisibility);
    if (sentinel && !sentinel.released) void sentinel.release().catch(() => {});
    sentinel = null;
  };
}
