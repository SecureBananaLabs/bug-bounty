import { describe, it, expect } from 'vitest';
import { chunk } from '../utils/chunk.js';

describe('chunk', () => {
  it('should return empty array for non-array input', () => {
    expect(chunk('hello', 2)).toEqual([]);
    expect(chunk(null, 2)).toEqual([]);
    expect(chunk(undefined, 2)).toEqual([]);
    expect(chunk(42, 2)).toEqual([]);
  });

  it('should return array with single element for size >= array length', () => {
    expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
    expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
  });

  it('should chunk array correctly', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([1, 2, 3, 4, 5, 6], 3)).toEqual([[1, 2, 3], [4, 5, 6]]);
  });

  it('should handle empty array', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it('should clamp non-positive or non-integer sizes to 1', () => {
    expect(chunk([1, 2, 3], 0)).toEqual([[1], [2], [3]]);
    expect(chunk([1, 2, 3], -1)).toEqual([[1], [2], [3]]);
    expect(chunk([1, 2, 3], 1.7)).toEqual([[1], [2], [3]]);
    expect(chunk([1, 2, 3], NaN)).toEqual([[1], [2], [3]]);
  });

  it('should handle single element arrays', () => {
    expect(chunk([42], 2)).toEqual([[42]]);
  });
});
