import { describe, it } from 'node:test';
import assert from 'node:assert';
import { chunk, chunkWhile } from '../utils/chunk.js';

describe('chunk Utility', () => {
  it('should split arrays evenly into specified chunk sizes', () => {
    const input = [1, 2, 3, 4, 5, 6];
    assert.deepStrictEqual(chunk(input, 2), [[1, 2], [3, 4], [5, 6]]);
    assert.deepStrictEqual(chunk(input, 3), [[1, 2, 3], [4, 5, 6]]);
  });

  it('should handle uneven chunking placing remaining items in last chunk', () => {
    const input = ['a', 'b', 'c', 'd', 'e'];
    assert.deepStrictEqual(chunk(input, 2), [['a', 'b'], ['c', 'd'], ['e']]);
    assert.deepStrictEqual(chunk(input, 4), [['a', 'b', 'c', 'd'], ['e']]);
  });

  it('should default to size 1 when size is omitted', () => {
    const input = [10, 20, 30];
    assert.deepStrictEqual(chunk(input), [[10], [20], [30]]);
  });

  it('should return empty array when input is empty array', () => {
    assert.deepStrictEqual(chunk([], 5), []);
    assert.deepStrictEqual(chunkWhile([], () => true), []);
  });

  it('should group elements conditionally using chunkWhile', () => {
    const numbers = [1, 2, 4, 7, 8, 9, 13, 14];
    // Group consecutive numbers (diff === 1)
    const grouped = chunkWhile(numbers, (curr, prev) => curr - prev === 1);
    assert.deepStrictEqual(grouped, [
      [1, 2],
      [4],
      [7, 8, 9],
      [13, 14],
    ]);
  });

  it('should throw TypeError for invalid inputs', () => {
    assert.throws(() => chunk(null), { name: 'TypeError' });
    assert.throws(() => chunk('string'), { name: 'TypeError' });
    assert.throws(() => chunk([1, 2], 0), { name: 'TypeError' });
    assert.throws(() => chunk([1, 2], -2), { name: 'TypeError' });
    assert.throws(() => chunk([1, 2], 1.5), { name: 'TypeError' });
    assert.throws(() => chunkWhile([1, 2], null), { name: 'TypeError' });
  });
});