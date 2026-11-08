import { AUTO_CLEAR_MS } from '@/lib/clipboard';

/** Seconds left before the clipboard is cleared, shared by the copy helper and its toast. */
let secondsLeft = AUTO_CLEAR_MS / 1000;
const listeners = new Set<() => void>();

export const secondsStore = {
  get: () => secondsLeft,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function setSecondsLeft(s: number) {
  secondsLeft = s;
  listeners.forEach((l) => l());
}
