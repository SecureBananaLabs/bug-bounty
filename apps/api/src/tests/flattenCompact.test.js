import { describe, it } from 'node:test';
import assert from 'node:assert';
import { flattenCompact, flatten, compact } from '../utils/flattenCompact.js';

describe('flattenCompact Utility', () => {
  it('should flatten deeply nested arrays to Infinity depth by default', () => {
    const input = [1, [2, [3, [4, [5]]]]];
    const result = flatten(input);
    assert.deepStrictEqual(result, [1, 2, 3, 4, 5]);
  });

  it('should respect custom depth limit when flattening', () => {
    const input = [1, [2, [3, [4]]]];
    const res1 = flatten(input, 1);
    assert.deepStrictEqual(res1, [1, 2, [3, [4]]]);

    const res2 = flatten(input, 2);
    assert.deepStrictEqual(res2, [1, 2, 3, [4]]);
  });

  it('should compact nullish values by default preserving 0 and false', () => {
    const input = [0, false, '', null, undefined, NaN, 'valid'];
    const result = compact(input);
    assert.deepStrictEqual(result, [0, false, '', 'valid']);
  });

  it('should compact all falsy values when mode is falsy', () => {
    const input = [0, false, '', null, undefined, NaN, 'valid', 42];
    const result = compact(input, 'falsy');
    assert.deepStrictEqual(result, ['valid', 42]);
  });

  it('should seamlessly flatten and compact nested arrays with nullish values', () => {
    const input = [1, [null, 2, [undefined, 3, [NaN, 4, [null, 5]]]]];
    const result = flattenCompact(input);
    assert.deepStrictEqual(result, [1, 2, 3, 4, 5]);
  });

  it('should seamlessly flatten and compact nested arrays with falsy mode', () => {
    const input = [1, [0, 2, ['', 3, [false, 4, [null, 5]]]]];
    const result = flattenCompact(input, { mode: 'falsy' });
    assert.deepStrictEqual(result, [1, 2, 3, 4, 5]);
  });

  it('should handle depth and mode combined options in flattenCompact', () => {
    const input = [1, [null, 2, [3, [null, 4]]]];
    const result = flattenCompact(input, { depth: 1 });
    assert.deepStrictEqual(result, [1, 2, [3, [null, 4]]]);
  });

  it('should throw TypeError when invalid non-array inputs are provided', () => {
    assert.throws(() => flattenCompact(null), { name: 'TypeError' });
    assert.throws(() => flattenCompact(123), { name: 'TypeError' });
    assert.throws(() => compact('not-an-array'), { name: 'TypeError' });
    assert.throws(() => flatten({}), { name: 'TypeError' });
  });
});