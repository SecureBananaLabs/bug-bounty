import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { flattenCompact } from '../utils/flattenCompact.js';

describe('Array Flatten & Compact Utility (flattenCompact)', () => {
  it('flattens array one level by default and removes nullish, empty string, and NaN values', () => {
    const input = [1, [2, null, 3], '', undefined, 4, [NaN, 5]];
    assert.deepEqual(flattenCompact(input), [1, 2, 3, 4, 5]);
  });

  it('supports custom depth and deep flattening with Infinity', () => {
    const input = [1, [2, [3, [null, '', 4]]]];
    assert.deepEqual(flattenCompact(input, 2), [1, 2, 3, [null, '', 4]]);
    assert.deepEqual(flattenCompact(input, Infinity), [1, 2, 3, 4]);
  });

  it('preserves valid falsy primitives such as 0 and false', () => {
    const input = [0, false, [null, '', undefined, NaN, 0, false]];
    assert.deepEqual(flattenCompact(input, 1), [0, false, 0, false]);
  });

  it('supports depth 0 (compacts top-level without flattening nested arrays)', () => {
    const input = [1, null, '', [2, 3], undefined];
    assert.deepEqual(flattenCompact(input, 0), [1, [2, 3]]);
  });

  it('returns empty array for non-array inputs', () => {
    assert.deepEqual(flattenCompact(null), []);
    assert.deepEqual(flattenCompact(undefined), []);
    assert.deepEqual(flattenCompact('not-an-array'), []);
  });
});
