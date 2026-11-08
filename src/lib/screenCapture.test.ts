import { describe, expect, it } from 'vitest';
import { isScreenCaptureSupported } from './screenCapture';

const DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const nav = (o: Record<string, unknown>) => ({ userAgent: DESKTOP, maxTouchPoints: 0, mediaDevices: { getDisplayMedia: () => undefined }, ...o }) as unknown as Navigator;

describe('isScreenCaptureSupported', () => {
  it('is true on desktop with getDisplayMedia', () => expect(isScreenCaptureSupported(nav({}))).toBe(true));
  it('is false without getDisplayMedia or mediaDevices', () => {
    expect(isScreenCaptureSupported(nav({ mediaDevices: {} }))).toBe(false);
    expect(isScreenCaptureSupported(nav({ mediaDevices: undefined }))).toBe(false);
    expect(isScreenCaptureSupported(undefined)).toBe(false);
  });
  it('is false on phones and tablets', () => {
    expect(isScreenCaptureSupported(nav({ userAgentData: { mobile: true } }))).toBe(false);
    expect(isScreenCaptureSupported(nav({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile Safari/537.36' }))).toBe(false);
    expect(isScreenCaptureSupported(nav({ maxTouchPoints: 5 }))).toBe(false); // iPadOS
  });
});
