import { describe, expect, it } from 'vitest';
import { AUTO_CLOSE_MS, MAX_MS, expired, extend, formatSeconds, isPaused, pause, refresh, remaining, resume, startCountdown } from './countdown';

describe('countdown', () => {
  it('runs down from 60 s and expires', () => {
    const c = startCountdown(1000);
    expect(remaining(c, 1000)).toBe(AUTO_CLOSE_MS);
    expect(remaining(c, 31_000)).toBe(30_000);
    expect(expired(c, 60_999)).toBe(false);
    expect(expired(c, 61_000)).toBe(true);
    expect(remaining(c, 99_000)).toBe(0);
  });

  it('freezes while paused and continues on resume', () => {
    const paused = pause(startCountdown(0), 20_000);
    expect(isPaused(paused)).toBe(true);
    expect(remaining(paused, 500_000)).toBe(40_000);
    expect(expired(paused, 500_000)).toBe(false);
    const running = resume(paused, 500_000);
    expect(remaining(running, 510_000)).toBe(30_000);
    expect(pause(paused, 1)).toBe(paused);
    expect(resume(running, 1)).toBe(running);
  });

  it('adds 60 s and caps the total', () => {
    const c = extend(startCountdown(0), 10_000);
    expect(remaining(c, 10_000)).toBe(110_000);
    let big = c;
    for (let i = 0; i < 20; i++) big = extend(big, 10_000);
    expect(remaining(big, 10_000)).toBe(MAX_MS);
  });

  it('extends a paused countdown without resuming it', () => {
    const c = extend(pause(startCountdown(0), 50_000), 70_000);
    expect(isPaused(c)).toBe(true);
    expect(remaining(c, 999_999)).toBe(70_000);
  });

  it('refresh restarts at 60 s but never shortens', () => {
    expect(remaining(refresh(startCountdown(0), 45_000), 45_000)).toBe(AUTO_CLOSE_MS);
    const long = extend(startCountdown(0), 0);
    expect(remaining(refresh(long, 0), 0)).toBe(120_000);
    expect(isPaused(refresh(pause(startCountdown(0), 1), 2))).toBe(true);
  });

  it('formats seconds rounding up', () => {
    expect(formatSeconds(60_000)).toBe('1:00');
    expect(formatSeconds(59_001)).toBe('1:00');
    expect(formatSeconds(59_000)).toBe('0:59');
    expect(formatSeconds(1)).toBe('0:01');
    expect(formatSeconds(0)).toBe('0:00');
    expect(formatSeconds(-5)).toBe('0:00');
    expect(formatSeconds(MAX_MS)).toBe('10:00');
  });
});
