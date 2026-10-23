import test from 'node:test';
import assert from 'node:assert/strict';
import { chunk } from '../utils/chunk.js';

test('chunk - evenly divides array elements', () => {
  const input = [1, 2, 3, 4, 5, 6];
  const result2 = chunk(input, 2);
  assert.deepEqual(result2, [[1, 2], [3, 4], [5, 6]]);

  const result3 = chunk(input, 3);
  assert.deepEqual(result3, [[1, 2, 3], [4, 5, 6]]);
});

test('chunk - handles uneven splitting with remaining elements in final chunk', () => {
  const input = ['a', 'b', 'c', 'd', 'e'];
  const result = chunk(input, 2);
  assert.deepEqual(result, [['a', 'b'], ['c', 'd'], ['e']]);

  const result4 = chunk(input, 4);
  assert.deepEqual(result4, [['a', 'b', 'c', 'd'], ['e']]);
});

test('chunk - defaults size to 1 if omitted', () => {
  const input = ['x', 'y', 'z'];
  const result = chunk(input);
  assert.deepEqual(result, [['x'], ['y'], ['z']]);
});

test('chunk - size greater than or equal to array length', () => {
  const input = [10, 20, 30];
  assert.deepEqual(chunk(input, 3), [[10, 20, 30]]);
  assert.deepEqual(chunk(input, 100), [[10, 20, 30]]);
});

test('chunk - floors non-integer chunk sizes', () => {
  const input = [1, 2, 3, 4, 5];
  // 2.7 should floor to 2
  assert.deepEqual(chunk(input, 2.7), [[1, 2], [3, 4], [5]]);
  // 3.9 should floor to 3
  assert.deepEqual(chunk(input, 3.9), [[1, 2, 3], [4, 5]]);
});

test('chunk - returns empty array on invalid, zero, or negative sizes', () => {
  const input = [1, 2, 3];
  assert.deepEqual(chunk(input, 0), []);
  assert.deepEqual(chunk(input, -1), []);
  assert.deepEqual(chunk(input, -100), []);
  assert.deepEqual(chunk(input, 0.5), []);
  assert.deepEqual(chunk(input, NaN), []);
  assert.deepEqual(chunk(input, Infinity), []);
  assert.deepEqual(chunk(input, -Infinity), []);
  assert.deepEqual(chunk(input, 'invalid'), []);
});

test('chunk - returns empty array on non-array or empty inputs', () => {
  assert.deepEqual(chunk([], 2), []);
  assert.deepEqual(chunk(null, 2), []);
  assert.deepEqual(chunk(undefined, 2), []);
  assert.deepEqual(chunk(12345, 2), []);
  assert.deepEqual(chunk('string', 2), []);
  assert.deepEqual(chunk({ length: 2, 0: 'a', 1: 'b' }, 2), []);
  assert.deepEqual(chunk(true, 2), []);
});

test('chunk - does not mutate original array', () => {
  const original = [1, 2, 3, 4];
  const copy = [...original];
  const result = chunk(original, 2);

  assert.deepEqual(original, copy, 'Original array must remain unmutated');
  assert.notEqual(result[0], original, 'Chunks must be new sub-array instances');
});

test('chunk - preserves complex and heterogeneous elements', () => {
  const obj1 = { id: 1 };
  const obj2 = { id: 2 };
  const sym = Symbol('token');
  const input = [obj1, obj2, null, undefined, false, sym];

  const result = chunk(input, 2);
  assert.equal(result.length, 3);
  assert.equal(result[0][0], obj1);
  assert.equal(result[0][1], obj2);
  assert.equal(result[1][0], null);
  assert.equal(result[1][1], undefined);
  assert.equal(result[2][0], false);
  assert.equal(result[2][1], sym);
});
