import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { flattenCompact } from '../utils/flattenCompact.js';

describe('Array Flatten & Compact Utility (flattenCompact)', () => {
  it('flattens array one level by default and removes nullish/empty values', () => {
    const input = [1, [2, null, 3], '', undefined, 4, [NaN, 5]];
    assert.deepEqual(flattenCompact(input), [1, 2, 3, 4, 5]);
  });

  it('supports custom depth and deep flattening with Infinity', () => {
    const input = [1, [2, [3, [null, 4]]]];
    assert.deepEqual(flattenCompact(input, Infinity), [1, 2, 3, 4]);
  });

  it('handles non-array inputs gracefully', () => {
    assert.deepEqual(flattenCompact(null), []);
    assert.deepEqual(flattenCompact('test'), []);
  });

  it('preserves valid falsy values like 0 and false', () => {
    const input = [0, false, null, undefined, '', 'valid'];
    assert.deepEqual(flattenCompact(input), [0, false, 'valid']);
  });
});
