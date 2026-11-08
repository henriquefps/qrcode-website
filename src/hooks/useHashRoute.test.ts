import { describe, expect, it } from 'vitest';
import { parseRoute } from './useHashRoute';

describe('parseRoute', () => {
  it('reads known routes', () => {
    expect(parseRoute('#/read')).toBe('read');
    expect(parseRoute('#/create')).toBe('create');
    expect(parseRoute('#read')).toBe('read');
    expect(parseRoute('#/read?x=1')).toBe('read');
  });
  it('defaults to create', () => {
    expect(parseRoute('')).toBe('create');
    expect(parseRoute('#/nope')).toBe('create');
  });
});
