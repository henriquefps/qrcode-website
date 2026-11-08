// Static scannability hints from the style (contrast, logo size, quiet zone) and the decode verdict.
import type { StyleConfig } from './preset';

/** `#rrggbb` -> [r, g, b] in 0..255; null when not a 6-digit hex color. */
export function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG 2 relative luminance. */
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Below this, scanners start to struggle (dim light, cheap cameras, glossy prints). */
export const MIN_CONTRAST = 4.5;
/** Logos above this share of the code width hide too many modules for comfort. */
export const MAX_LOGO_SCALE = 0.3;
/** Quiet zone in modules; the standard asks for 4, phone scanners usually cope with 1. */
export const MIN_QUIET_MODULES = 1;

export type HintId = 'contrast' | 'gradient-contrast' | 'corner-contrast' | 'inverted' | 'transparent' | 'logo-size' | 'logo-ec' | 'margin';

export interface ScanHint {
  id: HintId;
  /** `high`: likely to fail with real cameras even when a clean render decodes. */
  severity: 'high' | 'low';
  message: string;
}

/** Contrast under this is a serious problem (WCAG's large-text / UI-component floor). */
export const SEVERE_CONTRAST = 3;
const sev = (ratio: number): ScanHint['severity'] => (ratio < SEVERE_CONTRAST ? 'high' : 'low');

const fmt = (ratio: number) => `${ratio.toFixed(1)}:1`;

/**
 * Style problems that make a code harder to scan. `moduleCount` (modules per side, from the rendered
 * code) and `size` (rendered width in px) let the quiet zone be measured in modules.
 */
export function scanHints(style: StyleConfig, opts: { moduleCount?: number; size?: number } = {}): ScanHint[] {
  const hints: ScanHint[] = [];
  // A transparent code is judged on white (where it is most likely printed), and flagged.
  const bg = style.bgTransparent ? '#ffffff' : style.bgColor;
  if (style.bgTransparent) hints.push({ id: 'transparent', severity: 'low', message: 'Transparent background: it only scans on a light, plain surface.' });

  const main = contrastRatio(style.dotsColor, bg);
  if (main < MIN_CONTRAST) hints.push({ id: 'contrast', severity: sev(main), message: `Low contrast between dots and background (${fmt(main)}). Aim for ${MIN_CONTRAST}:1 or more.` });

  if (style.fgType === 'gradient') {
    const second = contrastRatio(style.dotsColorSecondary, bg);
    if (second < MIN_CONTRAST && main >= MIN_CONTRAST) hints.push({ id: 'gradient-contrast', severity: sev(second), message: `The gradient's second color has low contrast (${fmt(second)}). Darken it or the background.` });
  }

  if (style.customCorners) {
    const corners = Math.min(contrastRatio(style.cornersSquareColor, bg), contrastRatio(style.cornersDotColor, bg));
    if (corners < MIN_CONTRAST) hints.push({ id: 'corner-contrast', severity: sev(corners), message: `Corner colors have low contrast (${fmt(corners)}). Scanners find the code by its corners.` });
  }

  if (!style.bgTransparent && relativeLuminance(style.dotsColor) > relativeLuminance(bg)) {
    hints.push({ id: 'inverted', severity: 'high', message: 'Light dots on a dark background: some scanners cannot read inverted codes.' });
  }

  if (style.logoFile) {
    if (style.logoScale > MAX_LOGO_SCALE) hints.push({ id: 'logo-size', severity: 'high', message: `The logo is large (${Math.round(style.logoScale * 100)}%). Keep it at ${MAX_LOGO_SCALE * 100}% or less.` });
    if (style.ecLevel !== 'H') hints.push({ id: 'logo-ec', severity: 'low', message: 'A logo covers part of the code: set error correction to H.' });
  }

  const { moduleCount, size } = opts;
  if (moduleCount && size && size > 2 * style.margin) {
    const moduleSize = (size - 2 * style.margin) / moduleCount;
    const quiet = style.margin / moduleSize;
    if (quiet < MIN_QUIET_MODULES) hints.push({ id: 'margin', severity: quiet < 0.5 ? 'high' : 'low', message: `The quiet zone is small (${quiet.toFixed(1)} modules). Raise the margin to ${Math.ceil(2 * moduleSize)}px or more.` });
  } else if (style.margin === 0) {
    hints.push({ id: 'margin', severity: 'high', message: 'No quiet zone: add a margin around the code.' });
  }
  return hints;
}

export type ScanVerdict = 'scannable' | 'risky' | 'small' | 'unscannable';

/** Normalizes line endings: decoders differ on whether they keep CR. */
const same = (a: string | null, b: string) => a !== null && a.replace(/\r\n?/g, '\n') === b.replace(/\r\n?/g, '\n');

/** Verdict from what the decoder read at the full and the reduced size (null = nothing decoded). */
export function scanVerdict(expected: string, large: string | null, small: string | null): ScanVerdict {
  if (!same(large, expected)) return 'unscannable';
  return same(small, expected) ? 'scannable' : 'small';
}

/** A clean digital render decodes far more easily than a print seen by a camera: serious hints downgrade it. */
export function overallVerdict(verdict: ScanVerdict, hints: ScanHint[]): ScanVerdict {
  return verdict === 'scannable' && hints.some((h) => h.severity === 'high') ? 'risky' : verdict;
}
