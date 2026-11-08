/** Screen capture support check. getDisplayMedia is desktop only; phones and tablets get no Screen source. */
export function isScreenCaptureSupported(nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined): boolean {
  if (!nav?.mediaDevices || typeof nav.mediaDevices.getDisplayMedia !== 'function') return false;
  const uaData = (nav as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  if (uaData?.mobile) return false;
  // iPadOS reports a Mac user agent; touch points give it away.
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent) || (/Macintosh/.test(nav.userAgent) && nav.maxTouchPoints > 1)) return false;
  return true;
}

/**
 * A frame scheduler that keeps running when this tab is covered by the shared window
 * (requestAnimationFrame pauses in hidden tabs; timers only slow down).
 */
export const timerFrames = {
  raf: (cb: (now: number) => void) => window.setTimeout(() => cb(performance.now()), 100),
  caf: (id: number) => window.clearTimeout(id),
};
