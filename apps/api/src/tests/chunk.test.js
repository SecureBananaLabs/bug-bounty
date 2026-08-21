import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chunk } from '../utils/chunk.js';

describe('Array Chunking Utility', () => {
  it('splits array evenly when divisible by chunk size', () => {
    assert.deepEqual(chunk([1, 2, 3, 4], 2), [[1, 2], [3, 4]]);
  });

  it('handles trailing uneven chunks properly', () => {
    assert.deepEqual(chunk(['a', 'b', 'c', 'd', 'e'], 2), [['a', 'b'], ['c', 'd'], ['e']]);
  });

  it('defaults to chunk size of 1 when omitted', () => {
    assert.deepEqual(chunk([10, 20, 30]), [[10], [20], [30]]);
  });

  it('returns empty array when input is empty or not an array', () => {
    assert.deepEqual(chunk([]), []);
    assert.deepEqual(chunk(null), []);
    assert.deepEqual(chunk('invalid'), []);
  });

  it('returns empty array if chunk size is zero or negative', () => {
    assert.deepEqual(chunk([1, 2, 3], 0), []);
    assert.deepEqual(chunk([1, 2, 3], -5), []);
  });
});
