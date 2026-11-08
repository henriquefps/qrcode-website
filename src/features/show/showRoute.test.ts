import { describe, expect, it } from 'vitest';
import { parseRoute } from '@/hooks/useHashRoute';
import { isShowHash } from './showRoute';

describe('isShowHash', () => {
  it('matches the Quick show shortcut', () => {
    expect(isShowHash('#/show')).toBe(true);
    expect(isShowHash('#show')).toBe(true);
    expect(isShowHash('#/show?from=shortcut')).toBe(true);
  });
  it('ignores other routes', () => {
    expect(isShowHash('')).toBe(false);
    expect(isShowHash('#/read')).toBe(false);
    expect(isShowHash('#/showcase')).toBe(false);
  });
  it('renders Create underneath', () => {
    expect(parseRoute('#/show')).toBe('create');
  });
});
