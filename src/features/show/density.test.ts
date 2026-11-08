import { describe, expect, it } from 'vitest';
import { DENSE_VERSION, densityFor, versionFor } from './density';

describe('versionFor', () => {
  it('finds the smallest version for a byte count', () => {
    expect(versionFor(1, 'M')).toBe(1);
    expect(versionFor(14, 'M')).toBe(1);
    expect(versionFor(15, 'M')).toBe(2);
    expect(versionFor(17, 'L')).toBe(1);
    expect(versionFor(2331, 'M')).toBe(40);
    expect(versionFor(2332, 'M')).toBe(0);
    expect(versionFor(2953, 'L')).toBe(40);
    expect(versionFor(2954, 'L')).toBe(0);
  });
});

describe('densityFor', () => {
  it('is empty for empty text', () => {
    expect(densityFor('')).toMatchObject({ bytes: 0, version: 0, modules: 0, dense: false, tooLong: false });
  });

  it('uses M for passwords and short links', () => {
    const d = densityFor('correct horse battery staple');
    expect(d).toMatchObject({ level: 'M', version: 3, modules: 29, dense: false, tooLong: false });
  });

  it('stays on M up to the dense version', () => {
    expect(densityFor('a'.repeat(213))).toMatchObject({ level: 'M', version: DENSE_VERSION, dense: false });
  });

  it('switches to L and flags long text', () => {
    const d = densityFor('a'.repeat(214));
    expect(d).toMatchObject({ level: 'L', version: 9, modules: 53, dense: true, tooLong: false });
  });

  it('counts UTF-8 bytes, not characters', () => {
    expect(densityFor('é'.repeat(7)).bytes).toBe(14);
    expect(densityFor('😀').bytes).toBe(4);
  });

  it('accepts text that fits only at L', () => {
    expect(densityFor('a'.repeat(2900))).toMatchObject({ level: 'L', version: 40, tooLong: false });
  });

  it('rejects text that fits nowhere', () => {
    expect(densityFor('a'.repeat(2954))).toMatchObject({ tooLong: true, version: 0, modules: 0 });
  });
});
