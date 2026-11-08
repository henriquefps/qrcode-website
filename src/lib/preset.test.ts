import { describe, expect, it } from 'vitest';
import { DEFAULT_STYLE, parsePreset, parsePresetText, toPreset } from './preset';

const LOGOS = { wifi: 'data:image/svg+xml;utf8,<svg/>' };

describe('preset round trip', () => {
  it('exports and imports a style unchanged', () => {
    const style = { ...DEFAULT_STYLE, dotsType: 'dots' as const, fgType: 'gradient' as const, dotsColor: '#ff0000', logoScale: 0.3 };
    const result = parsePreset(JSON.parse(JSON.stringify(toPreset(style))), LOGOS);
    expect(result).toEqual({ ok: true, style });
  });
  it('keeps an uploaded logo', () => {
    const style = { ...DEFAULT_STYLE, logoPreset: 'custom' as const, logoFile: 'data:image/png;base64,AAAA', logoFilename: 'a.png' };
    const result = parsePreset(toPreset(style), LOGOS);
    expect(result).toEqual({ ok: true, style });
  });
});

describe('parsePreset validation', () => {
  it('rejects non-objects and unrelated JSON', () => {
    expect(parsePreset(null, LOGOS).ok).toBe(false);
    expect(parsePreset([], LOGOS).ok).toBe(false);
    expect(parsePreset({ foo: 1 }, LOGOS).ok).toBe(false);
  });
  it('falls back to defaults for invalid fields and clamps numbers', () => {
    const result = parsePreset({ dotStyle: 'nope', primaryColor: 'red', margin: 999, ecLevel: 'H' }, LOGOS);
    expect(result.ok && result.style.dotsType).toBe(DEFAULT_STYLE.dotsType);
    expect(result.ok && result.style.dotsColor).toBe(DEFAULT_STYLE.dotsColor);
    expect(result.ok && result.style.margin).toBe(40);
  });
  it('accepts the legacy "solid" foreground type', () => {
    const result = parsePreset({ fgType: 'solid', dotStyle: 'square' }, LOGOS);
    expect(result.ok && result.style.fgType).toBe('single');
  });
  it('resolves built-in logos and rejects non-image custom logos', () => {
    const builtin = parsePreset({ dotStyle: 'square', activePreset: 'wifi' }, LOGOS);
    expect(builtin.ok && builtin.style.logoFile).toBe(LOGOS.wifi);
    const bad = parsePreset({ dotStyle: 'square', activePreset: 'custom', uploadedLogoDataUrl: 'javascript:alert(1)' }, LOGOS);
    expect(bad.ok && bad.style.logoPreset).toBe('none');
    expect(bad.ok && bad.style.logoFile).toBe('');
  });
  it('reports invalid JSON text', () => {
    expect(parsePresetText('{oops', LOGOS).ok).toBe(false);
    expect(parsePresetText('{"dotStyle":"square"}', LOGOS).ok).toBe(true);
  });
});
