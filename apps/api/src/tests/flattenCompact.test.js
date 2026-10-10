import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { flattenCompact } from '../utils/flattenCompact.js';

describe('flattenCompact', () => {
  test('flattens deeply nested arrays and strips falsy values by default', () => {
    const input = [1, [2, [3, null, [4, false, 0, '', undefined]], NaN], 5];
    const result = flattenCompact(input);

    assert.deepEqual(result, [1, 2, 3, 4, 5]);
  });

  test('respects depth parameter', () => {
    const input = [1, [2, [3, [4]]]];
    const resultDepth1 = flattenCompact(input, { depth: 1 });
    assert.deepEqual(resultDepth1, [1, 2, [3, [4]]]);

    const resultDepth2 = flattenCompact(input, { depth: 2 });
    assert.deepEqual(resultDepth2, [1, 2, 3, [4]]);
  });

  test('supports nullish mode (preserving 0, false, and empty strings)', () => {
    const input = [0, false, '', null, undefined, [1, null, [false, 2]]];
    const result = flattenCompact(input, { compactMode: 'nullish' });

    assert.deepEqual(result, [0, false, '', 1, false, 2]);
  });

  test('handles non-array inputs gracefully', () => {
    assert.deepEqual(flattenCompact(null), []);
    assert.deepEqual(flattenCompact(undefined), []);
    assert.deepEqual(flattenCompact('string'), []);
    assert.deepEqual(flattenCompact(123), []);
  });
});
