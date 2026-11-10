import { describe, expect, it } from 'vitest';
import { DEFAULT_STYLE, parsePreset, parsePresetText, toPreset } from './preset';

describe('preset round trip', () => {
  it('exports and imports a style unchanged', () => {
    const style = { ...DEFAULT_STYLE, dotsType: 'dots' as const, fgType: 'gradient' as const, dotsColor: '#ff0000', logoScale: 0.3 };
    const result = parsePreset(JSON.parse(JSON.stringify(toPreset(style))));
    expect(result).toEqual({ ok: true, style });
  });
  it('keeps an uploaded logo', () => {
    const style = { ...DEFAULT_STYLE, logoPreset: 'custom' as const, logoFile: 'data:image/png;base64,AAAA', logoFilename: 'a.png' };
    const result = parsePreset(toPreset(style));
    expect(result).toEqual({ ok: true, style });
  });
});

describe('icon logos', () => {
  const uri = 'data:image/svg+xml;base64,PHN2Zy8+';
  it('round-trips an icon with its color and embedded image', () => {
    const style = { ...DEFAULT_STYLE, logoPreset: 'icon' as const, logoIcon: 'lucide:wifi', logoIconColor: '#ff0000', logoFile: uri, logoFilename: 'lucide-wifi' };
    const json = JSON.parse(JSON.stringify(toPreset(style)));
    expect(json.activePreset).toBe('icon');
    expect(json.logoIcon).toBe('lucide:wifi');
    expect(parsePreset(json)).toEqual({ ok: true, style });
  });
  it('leaves the image empty when the file does not embed it (the app fetches it)', () => {
    const r = parsePreset({ dotStyle: 'square', activePreset: 'icon', logoIcon: 'mdi:home' });
    expect(r.ok && [r.style.logoPreset, r.style.logoIcon, r.style.logoFile]).toEqual(['icon', 'mdi:home', '']);
  });
  it('maps the ids of old presets to curated icons', () => {
    const expected = { wifi: 'lucide:wifi', web: 'lucide:globe', whatsapp: 'simple-icons:whatsapp', email: 'lucide:mail', github: 'simple-icons:github', instagram: 'simple-icons:instagram' };
    for (const [old, icon] of Object.entries(expected)) {
      const r = parsePreset({ dotStyle: 'square', activePreset: old });
      expect(r.ok && [r.style.logoPreset, r.style.logoIcon, r.style.logoFile]).toEqual(['icon', icon, '']);
    }
  });
  it('ignores a data URL embedded in an old-style id and unsafe icon ids', () => {
    const old = parsePreset({ dotStyle: 'square', activePreset: 'wifi', iconLogoDataUrl: uri });
    expect(old.ok && old.style.logoFile).toBe('');
    for (const bad of ['../x', 'a:b/c', 'nocolon', 5, null]) {
      const r = parsePreset({ dotStyle: 'square', activePreset: 'icon', logoIcon: bad });
      expect(r.ok && r.style.logoPreset).toBe('none');
    }
    expect(parsePreset({ dotStyle: 'square', activePreset: 'toString' }).ok).toBe(true);
  });
});

describe('parsePreset validation', () => {
  it('rejects non-objects and unrelated JSON', () => {
    expect(parsePreset(null).ok).toBe(false);
    expect(parsePreset([]).ok).toBe(false);
    expect(parsePreset({ foo: 1 }).ok).toBe(false);
  });
  it('falls back to defaults for invalid fields and clamps numbers', () => {
    const result = parsePreset({ dotStyle: 'nope', primaryColor: 'red', margin: 999, ecLevel: 'H' });
    expect(result.ok && result.style.dotsType).toBe(DEFAULT_STYLE.dotsType);
    expect(result.ok && result.style.dotsColor).toBe(DEFAULT_STYLE.dotsColor);
    expect(result.ok && result.style.margin).toBe(40);
  });
  it('accepts the legacy "solid" foreground type', () => {
    const result = parsePreset({ fgType: 'solid', dotStyle: 'square' });
    expect(result.ok && result.style.fgType).toBe('single');
  });
  it('rejects non-image custom logos', () => {
    const bad = parsePreset({ dotStyle: 'square', activePreset: 'custom', uploadedLogoDataUrl: 'javascript:alert(1)' });
    expect(bad.ok && bad.style.logoPreset).toBe('none');
    expect(bad.ok && bad.style.logoFile).toBe('');
  });
  it('reports invalid JSON text', () => {
    expect(parsePresetText('{oops').ok).toBe(false);
    expect(parsePresetText('{"dotStyle":"square"}').ok).toBe(true);
  });
});
