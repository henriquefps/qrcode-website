/**
 * Auto-close countdown as plain data. Running: `deadline` is an absolute time (ms) and `left` is ignored.
 * Paused: `deadline` is null and `left` holds the remaining time.
 */
export interface Countdown {
  deadline: number | null;
  left: number;
}

export const AUTO_CLOSE_MS = 60_000;
export const EXTEND_MS = 60_000;
/** The countdown never grows past this, however often "+60 s" is pressed. */
export const MAX_MS = 10 * 60_000;

export function startCountdown(now: number, duration = AUTO_CLOSE_MS): Countdown {
  return { deadline: now + duration, left: duration };
}

export function remaining(c: Countdown, now: number): number {
  return Math.max(0, c.deadline === null ? c.left : c.deadline - now);
}

export function isPaused(c: Countdown): boolean {
  return c.deadline === null;
}

export function pause(c: Countdown, now: number): Countdown {
  return isPaused(c) ? c : { deadline: null, left: remaining(c, now) };
}

export function resume(c: Countdown, now: number): Countdown {
  return isPaused(c) ? { deadline: now + c.left, left: c.left } : c;
}

/** Adds time (default 60 s), capped at MAX_MS; keeps the paused state. */
export function extend(c: Countdown, now: number, by = EXTEND_MS): Countdown {
  const left = Math.min(MAX_MS, remaining(c, now) + by);
  return isPaused(c) ? { deadline: null, left } : { deadline: now + left, left };
}

/** Restarts at the full duration when less is left (used when the text changes); keeps the paused state. */
export function refresh(c: Countdown, now: number, duration = AUTO_CLOSE_MS): Countdown {
  const left = Math.max(remaining(c, now), duration);
  return isPaused(c) ? { deadline: null, left } : { deadline: now + left, left };
}

export function expired(c: Countdown, now: number): boolean {
  return !isPaused(c) && remaining(c, now) === 0;
}

/** "0:59", "1:00", "10:00"; rounds up so the label reads 0:01 until it really ends. */
export function formatSeconds(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
