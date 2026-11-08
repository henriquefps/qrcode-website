import { describe, expect, it } from 'vitest';
import { DEFAULT_STYLE } from './preset';
import { contrastRatio, overallVerdict, parseHex, scanHints, scanVerdict } from './scanCheck';

const ids = (h: ReturnType<typeof scanHints>) => h.map((x) => x.id);

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    expect(contrastRatio('#ffffff', '#777777')).toBeCloseTo(contrastRatio('#777777', '#ffffff'), 10);
  });
  it('parses hex', () => {
    expect(parseHex('#ff8000')).toEqual([255, 128, 0]);
    expect(parseHex('red')).toBeNull();
  });
});

describe('scanHints', () => {
  it('is quiet for the default style', () => {
    expect(scanHints(DEFAULT_STYLE, { moduleCount: 25, size: 280 })).toEqual([]);
  });
  it('flags low contrast and inverted colors', () => {
    expect(ids(scanHints({ ...DEFAULT_STYLE, dotsColor: '#cccccc' }))).toContain('contrast');
    expect(ids(scanHints({ ...DEFAULT_STYLE, dotsColor: '#ffffff', bgColor: '#000000' }))).toEqual(['inverted']);
  });
  it('flags a weak gradient stop', () => {
    expect(ids(scanHints({ ...DEFAULT_STYLE, fgType: 'gradient', dotsColorSecondary: '#dddddd' }))).toContain('gradient-contrast');
    expect(ids(scanHints({ ...DEFAULT_STYLE, fgType: 'single', dotsColorSecondary: '#dddddd' }))).not.toContain('gradient-contrast');
  });
  it('flags custom corner colors', () => {
    expect(ids(scanHints({ ...DEFAULT_STYLE, customCorners: true, cornersDotColor: '#eeeeee' }))).toContain('corner-contrast');
  });
  it('flags large logos and low error correction with a logo', () => {
    const h = ids(scanHints({ ...DEFAULT_STYLE, logoFile: 'data:image/png;base64,x', logoScale: 0.45, ecLevel: 'M' }));
    expect(h).toEqual(expect.arrayContaining(['logo-size', 'logo-ec']));
  });
  it('measures the quiet zone in modules', () => {
    // 280 px, 25 modules, margin 5 -> module ≈ 10.8 px -> 0.46 modules (default 15 -> 1.5)
    expect(ids(scanHints({ ...DEFAULT_STYLE, margin: 5 }, { moduleCount: 25, size: 280 }))).toContain('margin');
    expect(ids(scanHints({ ...DEFAULT_STYLE, margin: 25 }, { moduleCount: 25, size: 280 }))).not.toContain('margin');
    expect(ids(scanHints({ ...DEFAULT_STYLE, margin: 0 }))).toContain('margin');
  });
  it('judges transparent backgrounds on white', () => {
    expect(ids(scanHints({ ...DEFAULT_STYLE, bgTransparent: true, bgColor: '#000000' }))).toEqual(['transparent']);
  });
});

describe('scanVerdict', () => {
  it('compares decoded text, ignoring line-ending differences', () => {
    expect(scanVerdict('a\r\nb', 'a\nb', 'a\r\nb')).toBe('scannable');
    expect(scanVerdict('x', 'x', null)).toBe('small');
    expect(scanVerdict('x', null, null)).toBe('unscannable');
    expect(scanVerdict('x', 'y', 'x')).toBe('unscannable');
  });
});

describe('overallVerdict', () => {
  it('downgrades a decoded code with a serious hint', () => {
    const low = scanHints({ ...DEFAULT_STYLE, dotsColor: '#d0d0d0' });
    expect(low[0].severity).toBe('high');
    expect(overallVerdict('scannable', low)).toBe('risky');
    const mild = scanHints({ ...DEFAULT_STYLE, dotsColor: '#808080' }); // 3.9:1
    expect(mild.map((h) => h.severity)).toEqual(['low']);
    expect(overallVerdict('scannable', mild)).toBe('scannable');
    expect(overallVerdict('small', low)).toBe('small');
  });
});
