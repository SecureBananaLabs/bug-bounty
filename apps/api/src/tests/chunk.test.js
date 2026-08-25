const { chunk } = require('../utils/chunk');

describe('chunk utility', () => {
  describe('basic functionality', () => {
    test('splits array into chunks of specified size', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
      expect(chunk(['a', 'b', 'c', 'd', 'e'], 3)).toEqual([['a', 'b', 'c'], ['d', 'e']]);
    });

    test('returns single chunk when size >= array length', () => {
      expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
      expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
    });

    test('returns empty array for empty input', () => {
      expect(chunk([], 2)).toEqual([]);
    });
  });

  describe('edge cases for size parameter', () => {
    test('returns empty array for zero size', () => {
      expect(chunk([1, 2, 3], 0)).toEqual([]);
    });

    test('returns empty array for negative size', () => {
      expect(chunk([1, 2, 3], -1)).toEqual([]);
      expect(chunk([1, 2, 3], -5)).toEqual([]);
    });

    test('floors non-integer size', () => {
      expect(chunk([1, 2, 3, 4, 5], 2.5)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk([1, 2, 3, 4], 1.9)).toEqual([[1], [2], [3], [4]]);
    });

    test('returns empty array for NaN size', () => {
      expect(chunk([1, 2, 3], NaN)).toEqual([]);
    });

    test('returns empty array for Infinity size', () => {
      expect(chunk([1, 2, 3], Infinity)).toEqual([[1, 2, 3]]);
      expect(chunk([1, 2, 3], -Infinity)).toEqual([]);
    });
  });

  describe('input validation', () => {
    test('returns empty array for non-array input', () => {
      expect(chunk(null, 2)).toEqual([]);
      expect(chunk(undefined, 2)).toEqual([]);
      expect(chunk('string', 2)).toEqual([]);
      expect(chunk(123, 2)).toEqual([]);
      expect(chunk({ a: 1 }, 2)).toEqual([]);
    });
  });

  describe('preserves original array', () => {
    test('does not mutate the original array', () => {
      const original = [1, 2, 3, 4, 5];
      chunk(original, 2);
      expect(original).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('works with various data types', () => {
    test('works with objects', () => {
      const objects = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
      expect(chunk(objects, 2)).toEqual([[{ id: 1 }, { id: 2 }], [{ id: 3 }, { id: 4 }]]);
    });

    test('works with nested arrays', () => {
      const nested = [[1], [2], [3], [4]];
      expect(chunk(nested, 2)).toEqual([[[1], [2]], [[3], [4]]]);
    });

    test('works with mixed types', () => {
      const mixed = [1, 'two', { three: 3 }, [4]];
      expect(chunk(mixed, 2)).toEqual([[1, 'two'], [{ three: 3 }, [4]]]);
    });
  });
});
