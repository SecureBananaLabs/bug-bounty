import test from 'node:test';
import assert from 'node:assert/strict';
import { chunk } from '../utils/chunk.js';

test('chunk: splits array evenly into chunks of given size', () => {
  const input = [1, 2, 3, 4, 5, 6];
  const result = chunk(input, 2);
  assert.deepEqual(result, [[1, 2], [3, 4], [5, 6]]);
});

test('chunk: creates final smaller chunk for uneven arrays', () => {
  const input = ['a', 'b', 'c', 'd', 'e'];
  const result = chunk(input, 2);
  assert.deepEqual(result, [['a', 'b'], ['c', 'd'], ['e']]);
});

test('chunk: defaults size to 1 if omitted', () => {
  const input = [10, 20, 30];
  const result = chunk(input);
  assert.deepEqual(result, [[10], [20], [30]]);
});

test('chunk: handles size larger than array length', () => {
  const input = [1, 2, 3];
  const result = chunk(input, 10);
  assert.deepEqual(result, [[1, 2, 3]]);
});

test('chunk: clamps floating point sizes to integer via Math.floor', () => {
  const input = [1, 2, 3, 4, 5];
  const result = chunk(input, 2.9);
  assert.deepEqual(result, [[1, 2], [3, 4], [5]]);
});

test('chunk: handles empty array gracefully', () => {
  assert.deepEqual(chunk([]), []);
  assert.deepEqual(chunk([], 5), []);
});

test('chunk: non-array fallback returns empty array by default', () => {
  assert.deepEqual(chunk(null, 2), []);
  assert.deepEqual(chunk(undefined, 2), []);
  assert.deepEqual(chunk(12345, 2), []);
  assert.deepEqual(chunk('hello', 2), []);
  assert.deepEqual(chunk({ a: 1, b: 2 }, 2), []);
  assert.deepEqual(chunk(true, 2), []);
});

test('chunk: non-positive, zero, NaN, and infinite sizes return empty array', () => {
  const input = [1, 2, 3];
  assert.deepEqual(chunk(input, 0), []);
  assert.deepEqual(chunk(input, -1), []);
  assert.deepEqual(chunk(input, -100), []);
  assert.deepEqual(chunk(input, NaN), []);
  assert.deepEqual(chunk(input, Infinity), []);
  assert.deepEqual(chunk(input, -Infinity), []);
  assert.deepEqual(chunk(input, 'invalid'), []);
});

test('chunk: sparse array defense prevents Array.prototype pollution inheritance', () => {
  const sparse = new Array(4);
  sparse[0] = 'first';
  sparse[3] = 'fourth';
  // Simulate potential Array.prototype pollution on hole index
  Array.prototype[1] = 'POLLUTED_VALUE';

  try {
    const result = chunk(sparse, 2);
    assert.equal(result.length, 2);
    assert.deepEqual(result[0], ['first', undefined]);
    assert.deepEqual(result[1], [undefined, 'fourth']);
    // Verify chunk did not inherit polluted prototype value
    assert.notEqual(result[0][1], 'POLLUTED_VALUE');
  } finally {
    delete Array.prototype[1];
  }
});

test('chunk: skipHoles option filters out holes entirely', () => {
  const sparse = [];
  sparse[0] = 'a';
  sparse[2] = 'b';
  sparse[5] = 'c';

  const result = chunk(sparse, 2, { skipHoles: true });
  assert.deepEqual(result, [['a', 'b'], ['c']]);
});

test('chunk: maxChunks option limits output chunk count', () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8];
  const result = chunk(input, 2, { maxChunks: 2 });
  assert.deepEqual(result, [[1, 2], [3, 4]]);
});

test('chunk: strict mode throws TypeError on non-array or invalid size', () => {
  assert.throws(() => chunk(null, 2, { strict: true }), TypeError);
  assert.throws(() => chunk('not-an-array', 2, { strict: true }), TypeError);
  assert.throws(() => chunk([1, 2], 0, { strict: true }), TypeError);
  assert.throws(() => chunk([1, 2], -5, { strict: true }), TypeError);
  assert.throws(() => chunk([1, 2], NaN, { strict: true }), TypeError);
});

test('chunk: options validation throws TypeError for non-object options', () => {
  assert.throws(() => chunk([1, 2], 2, null), TypeError);
  assert.throws(() => chunk([1, 2], 2, 'invalid'), TypeError);
  assert.throws(() => chunk([1, 2], 2, 123), TypeError);
});

test('chunk: numeric string sizes are safely parsed and clamped', () => {
  const input = [1, 2, 3, 4];
  assert.deepEqual(chunk(input, '2'), [[1, 2], [3, 4]]);
  assert.deepEqual(chunk(input, '3.5'), [[1, 2, 3], [4]]);
});

test('chunk: objects with custom elements and complex types are preserved', () => {
  const sym = Symbol('token');
  const obj1 = { id: 1 };
  const obj2 = { id: 2 };
  const input = [obj1, obj2, sym, [99]];

  const result = chunk(input, 2);
  assert.equal(result[0][0], obj1);
  assert.equal(result[0][1], obj2);
  assert.equal(result[1][0], sym);
  assert.deepEqual(result[1][1], [99]);
});
