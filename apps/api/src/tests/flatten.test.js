import test from 'node:test';
import assert from 'node:assert/strict';
import { flatten, flattenDeep } from '../utils/flatten.js';

test('flatten: flattens array one level by default', () => {
  const input = [1, [2, 3], [4, [5]]];
  const result = flatten(input);
  assert.deepEqual(result, [1, 2, 3, 4, [5]]);
});

test('flatten: flattens to specified integer depth', () => {
  const input = [1, [2, [3, [4, [5]]]]];
  assert.deepEqual(flatten(input, 1), [1, 2, [3, [4, [5]]]]);
  assert.deepEqual(flatten(input, 2), [1, 2, 3, [4, [5]]]);
  assert.deepEqual(flatten(input, 3), [1, 2, 3, 4, [5]]);
  assert.deepEqual(flatten(input, 4), [1, 2, 3, 4, 5]);
});

test('flattenDeep: flattens nested arrays completely', () => {
  const input = [1, [2, [3, [4, [5]]]]];
  const result = flattenDeep(input);
  assert.deepEqual(result, [1, 2, 3, 4, 5]);
});

test('flatten: handles empty arrays', () => {
  assert.deepEqual(flatten([]), []);
  assert.deepEqual(flatten([], 3), []);
  assert.deepEqual(flattenDeep([]), []);
});

test('flatten: non-array input falls back to empty array by default', () => {
  assert.deepEqual(flatten(null), []);
  assert.deepEqual(flatten(undefined), []);
  assert.deepEqual(flatten(1234), []);
  assert.deepEqual(flatten('string'), []);
  assert.deepEqual(flatten({ a: 1 }), []);
  assert.deepEqual(flatten(true), []);
});

test('flatten: strict mode throws TypeError on non-array input', () => {
  assert.throws(() => flatten(null, 1, { strict: true }), TypeError);
  assert.throws(() => flatten('hello', 1, { strict: true }), TypeError);
  assert.throws(() => flatten({ 0: 'a', length: 1 }, 1, { strict: true }), TypeError);
});

test('flatten: depth <= 0 returns shallow copy of array', () => {
  const input = [1, [2, 3]];
  const res0 = flatten(input, 0);
  assert.deepEqual(res0, [1, [2, 3]]);
  assert.notEqual(res0, input);

  const resNeg = flatten(input, -5);
  assert.deepEqual(resNeg, [1, [2, 3]]);
});

test('flatten: NaN depth returns shallow copy or throws in strict mode', () => {
  const input = [1, [2]];
  assert.deepEqual(flatten(input, NaN), [1, [2]]);
  assert.throws(() => flatten(input, NaN, { strict: true }), TypeError);
});

test('flatten: parses float depth via Math.floor and numeric strings', () => {
  const input = [1, [2, [3]]];
  assert.deepEqual(flatten(input, 1.8), [1, 2, [3]]);
  assert.deepEqual(flatten(input, '2'), [1, 2, 3]);
});

test('flatten: protects against circular array references (preserve, skip, throw)', () => {
  // Direct circular reference
  const direct = [10];
  direct.push(direct);

  // Default: preserve circular reference without infinite recursion
  const resPreserve = flatten(direct, 5);
  assert.equal(resPreserve[0], 10);
  assert.equal(resPreserve[1], direct);

  // skip circular reference
  const resSkip = flatten(direct, 5, { onCircular: 'skip' });
  assert.deepEqual(resSkip, [10]);

  // throw on circular reference
  assert.throws(() => flatten(direct, 5, { onCircular: 'throw' }), /Circular array reference/);

  // Indirect circular reference
  const a = ['a'];
  const b = ['b', a];
  a.push(b);

  const indirectPreserve = flatten(a, 10);
  assert.equal(indirectPreserve[0], 'a');
  assert.equal(indirectPreserve[1], 'b');

  const indirectSkip = flatten(a, 10, { onCircular: 'skip' });
  assert.deepEqual(indirectSkip, ['a', 'b']);

  assert.throws(() => flatten(a, 10, { onCircular: 'throw' }), /Circular array reference/);
});

test('flatten: allows diamond shared array references without false circular alarms', () => {
  const shared = [9, 10];
  const input = [1, shared, 2, shared];
  const result = flatten(input, 1);
  assert.deepEqual(result, [1, 9, 10, 2, 9, 10]);
});

test('flatten: sparse array defense prevents Array.prototype pollution inheritance', () => {
  const sparse = new Array(3);
  sparse[0] = 'first';
  sparse[2] = 'third';

  // Simulate prototype pollution on hole index 1
  Array.prototype[1] = 'POLLUTED';
  try {
    const result = flatten(sparse, 1);
    assert.equal(result.length, 3);
    assert.equal(result[0], 'first');
    assert.equal(result[1], undefined);
    assert.equal(result[2], 'third');
    assert.notEqual(result[1], 'POLLUTED');

    // Test with nested sparse array
    const nestedSparse = [sparse];
    const nestedRes = flatten(nestedSparse, 1);
    assert.equal(nestedRes[1], undefined);
    assert.notEqual(nestedRes[1], 'POLLUTED');
  } finally {
    delete Array.prototype[1];
  }
});

test('flatten: skipHoles option removes unassigned slots', () => {
  const sparse = [];
  sparse[0] = 'x';
  sparse[3] = 'y';

  const result = flatten(sparse, 1, { skipHoles: true });
  assert.deepEqual(result, ['x', 'y']);

  const nested = [1, [, , [3, , 4]]];
  const deepRes = flattenDeep(nested, { skipHoles: true });
  assert.deepEqual(deepRes, [1, 3, 4]);
});

test('flatten: maxDepth cap enforces recursion safety', () => {
  const deep = [[[[[5]]]]];
  // Clamped in non-strict mode
  const res = flatten(deep, 10, { maxDepth: 2 });
  assert.deepEqual(res, [[[5]]]);

  // Throws RangeError in strict mode
  assert.throws(() => flatten(deep, 10, { maxDepth: 2, strict: true }), RangeError);
});

test('flatten: preserves symbols, objects, functions, and diverse data types', () => {
  const sym = Symbol('token');
  const fn = () => 42;
  const obj = { id: 101 };
  const date = new Date(1700000000000);
  const regex = /abc/g;

  const input = [sym, [fn, [obj, [date, regex]]]];
  const result = flattenDeep(input);

  assert.equal(result[0], sym);
  assert.equal(result[1], fn);
  assert.equal(result[2], obj);
  assert.equal(result[3], date);
  assert.equal(result[4], regex);
});

test('flatten: options parameter validation', () => {
  assert.throws(() => flatten([1, 2], 1, null), TypeError);
  assert.throws(() => flatten([1, 2], 1, 'invalid'), TypeError);
  assert.throws(() => flatten([1, 2], 1, { onCircular: 'unknown' }), TypeError);
});
