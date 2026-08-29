import { describe, expect, it } from 'vitest';
import { nextPageIndex } from '../src/types/rotation.js';

describe('nextPageIndex', () => {
  it('advances to the following page', () => {
    expect(nextPageIndex(0, 3)).toBe(1);
    expect(nextPageIndex(1, 3)).toBe(2);
  });

  it('wraps around after the last page', () => {
    expect(nextPageIndex(2, 3)).toBe(0);
  });

  it('clamps an out-of-range current index instead of propagating it', () => {
    expect(nextPageIndex(9, 2)).toBe(0);
    expect(nextPageIndex(-4, 2)).toBe(1);
  });

  it('returns 0 when there are no pages to rotate through', () => {
    expect(nextPageIndex(0, 0)).toBe(0);
  });
});
