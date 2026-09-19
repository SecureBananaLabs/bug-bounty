import { describe, it, expect } from 'vitest';
import { flattenCompact } from '../utils/flattenCompact.js';

describe('flattenCompact', () => {
  it('should return empty array for non-array input', () => {
    expect(flattenCompact(null)).toEqual([]);
    expect(flattenCompact(undefined)).toEqual([]);
    expect(flattenCompact('hello')).toEqual([]);
    expect(flattenCompact(42)).toEqual([]);
  });

  it('should flatten one level by default (depth=1)', () => {
    expect(flattenCompact([1, [2, 3], 4])).toEqual([1, 2, 3, 4]);
  });

  it('should remove falsy values (null, undefined, "", NaN)', () => {
    expect(flattenCompact([0, 1, null, 2, undefined, 3, '', 4, NaN, 5])).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should respect depth parameter', () => {
    const nested = [1, [2, [3, [4]]]];
    expect(flattenCompact(nested, 1)).toEqual([1, 2, [3, [4]]]);
    expect(flattenCompact(nested, 2)).toEqual([1, 2, 3, [4]]);
    expect(flattenCompact(nested, 3)).toEqual([1, 2, 3, 4]);
  });

  it('should handle Infinity depth for full flattening', () => {
    const deeplyNested = [1, [2, [3, [4, [5]]]]];
    expect(flattenCompact(deeplyNested, Infinity)).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle empty array', () => {
    expect(flattenCompact([])).toEqual([]);
  });

  it('should handle depth=0 (no flattening, just compact)', () => {
    expect(flattenCompact([1, [2, null], 3], 0)).toEqual([1, [2, null], 3]);
  });

  it('should keep zero and false (they are not falsy in our definition... wait, 0 is kept)', () => {
    // Our implementation skips: null, undefined, '', NaN
    // Keeps: 0, false, [], {}
    expect(flattenCompact([0, false, null, ''])).toEqual([0, false]);
  });

  it('should handle all-falsy input', () => {
    expect(flattenCompact([null, undefined, '', NaN])).toEqual([]);
  });
});
