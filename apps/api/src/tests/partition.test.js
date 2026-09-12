import { describe, it, expect, vi } from 'vitest';
import { partition } from '../utils/partition.js';

describe('partition', () => {
  it('should split array into two groups', () => {
    const [even, odd] = partition([1, 2, 3, 4, 5], (n) => n % 2 === 0);
    expect(even).toEqual([2, 4]);
    expect(odd).toEqual([1, 3, 5]);
  });

  it('should return empty arrays for non-array input', () => {
    expect(partition(null, () => true)).toEqual([[], []]);
    expect(partition(undefined, () => true)).toEqual([[], []]);
    expect(partition('hello', () => true)).toEqual([[], []]);
  });

  it('should pass index and array to predicate', () => {
    const predicate = vi.fn((item, index) => index < 3);
    const [matches, rest] = partition([10, 20, 30, 40, 50], predicate);
    expect(matches).toEqual([10, 20, 30]);
    expect(rest).toEqual([40, 50]);
    expect(predicate).toHaveBeenCalledTimes(5);
  });

  it('should handle empty array', () => {
    expect(partition([], () => true)).toEqual([[], []]);
  });

  it('should put all items in matches when predicate always true', () => {
    const [matches, nonMatches] = partition([1, 2, 3], () => true);
    expect(matches).toEqual([1, 2, 3]);
    expect(nonMatches).toEqual([]);
  });

  it('should put all items in nonMatches when predicate always false', () => {
    const [matches, nonMatches] = partition([1, 2, 3], () => false);
    expect(matches).toEqual([]);
    expect(nonMatches).toEqual([1, 2, 3]);
  });
});
