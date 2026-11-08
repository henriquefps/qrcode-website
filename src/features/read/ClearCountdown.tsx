import { useSyncExternalStore } from 'react';
import { AUTO_CLEAR_MS } from '@/lib/clipboard';
import { secondsStore } from './secondsStore';

const SECONDS = AUTO_CLEAR_MS / 1000;


/** Body of the clipboard countdown toast. It re-renders itself, so the toast is created only once. */
export function ClearCountdown() {
  const s = useSyncExternalStore(secondsStore.subscribe, secondsStore.get);
  return (
    <span>
      {/* Screen readers hear one stable sentence instead of a number every second. */}
      <span className="sr-only">Copied. The clipboard will be cleared in {SECONDS} seconds.</span>
      <span aria-hidden="true">
        Copied. Clipboard clears in <span className="tabular-nums">{s}</span> s
      </span>
    </span>
  );
}
