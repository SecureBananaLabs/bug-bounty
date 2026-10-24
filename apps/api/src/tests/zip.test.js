import test from 'node:test';
import assert from 'node:assert/strict';
import { zip, unzip, zipWith, unzipWith } from '../utils/zip.js';
import zipModule from '../utils/zip.js';

test('zip: default object and named exports are present', () => {
  assert.equal(typeof zip, 'function');
  assert.equal(typeof unzip, 'function');
  assert.equal(typeof zipWith, 'function');
  assert.equal(typeof unzipWith, 'function');
  assert.equal(zipModule.zip, zip);
  assert.equal(zipModule.unzip, unzip);
});

test('zip: pairs arrays of equal length correctly', () => {
  const letters = ['a', 'b', 'c'];
  const numbers = [1, 2, 3];
  const booleans = [true, false, true];

  const actual = zip(letters, numbers, booleans);
  assert.deepEqual(actual, [
    ['a', 1, true],
    ['b', 2, false],
    ['c', 3, true]
  ]);
});

test('zip: handles arrays of unequal length by filling shorter with undefined', () => {
  const arr1 = ['a', 'b', 'c'];
  const arr2 = [1, 2];
  const arr3 = [true];

  const actual = zip(arr1, arr2, arr3);
  assert.deepEqual(actual, [
    ['a', 1, true],
    ['b', 2, undefined],
    ['c', undefined, undefined]
  ]);
});

test('zip: handles empty invocations and empty arrays', () => {
  assert.deepEqual(zip(), []);
  assert.deepEqual(zip([], []), []);
  assert.deepEqual(zip([], [1, 2]), [
    [undefined, 1],
    [undefined, 2]
  ]);
});

test('zip: non-array fallback converts safe iterables or falls back to empty arrays', () => {
  const set = new Set([10, 20]);
  const arr = ['x', 'y'];

  const actual = zip(arr, set);
  assert.deepEqual(actual, [
    ['x', 10],
    ['y', 20]
  ]);
});

test('zip: non-array inputs (null, undefined, numbers, strings, objects) gracefully fall back to empty arrays', () => {
  assert.deepEqual(zip(['a', 'b'], null, undefined, 42, 'hello', { key: 'val' }), [
    ['a', undefined, undefined, undefined, undefined, undefined],
    ['b', undefined, undefined, undefined, undefined, undefined]
  ]);
});

test('zip: sparse array protection prevents hole contamination from Array.prototype', () => {
  const sparse = new Array(3);
  sparse[0] = 'first';
  sparse[2] = 'third';

  // Simulate prototype pollution attempt
  try {
    Array.prototype[1] = 'polluted-prototype-val';

    const actual = zip(sparse, [1, 2, 3]);
    assert.deepEqual(actual, [
      ['first', 1],
      [undefined, 2],
      ['third', 3]
    ]);
  } finally {
    delete Array.prototype[1];
  }
});

test('unzip: reverses a zipped array back to original array groups', () => {
  const zipped = [
    ['a', 1, true],
    ['b', 2, false]
  ];

  const actual = unzip(zipped);
  assert.deepEqual(actual, [
    ['a', 'b'],
    [1, 2],
    [true, false]
  ]);
});

test('unzip: handles empty array or invalid inputs by returning empty array', () => {
  assert.deepEqual(unzip([]), []);
  assert.deepEqual(unzip(null), []);
  assert.deepEqual(unzip(undefined), []);
  assert.deepEqual(unzip('not-an-array'), []);
  assert.deepEqual(unzip(12345), []);
});

test('unzip: sparse rows and unequal row lengths normalized with undefined', () => {
  const rows = [
    ['a', 1, true],
    ['b', 2],
    ['c']
  ];

  const actual = unzip(rows);
  assert.deepEqual(actual, [
    ['a', 'b', 'c'],
    [1, 2, undefined],
    [true, undefined, undefined]
  ]);
});

test('unzip: prototype pollution defense on row holes', () => {
  const row1 = ['x', 'y'];
  const row2 = new Array(2);
  row2[1] = 'target';

  try {
    Array.prototype[0] = 'polluted-row-val';

    const actual = unzip([row1, row2]);
    assert.deepEqual(actual, [
      ['x', undefined],
      ['y', 'target']
    ]);
  } finally {
    delete Array.prototype[0];
  }
});

test('zipWith: combines grouped elements using iteratee function', () => {
  const numbers1 = [1, 2, 3];
  const numbers2 = [10, 20, 30];
  const numbers3 = [100, 200, 300];

  const sum = (a = 0, b = 0, c = 0) => a + b + c;
  const actual = zipWith(sum, numbers1, numbers2, numbers3);

  assert.deepEqual(actual, [111, 222, 333]);
});

test('zipWith: throws TypeError if iteratee is not a function', () => {
  assert.throws(() => zipWith(null, [1, 2]), TypeError);
  assert.throws(() => zipWith(undefined, [1, 2]), TypeError);
  assert.throws(() => zipWith('not-func', [1, 2]), TypeError);
});

test('zipWith: propagates exceptions thrown by iteratee', () => {
  const faultyIteratee = (a, b) => {
    if (b === 0) throw new RangeError('Cannot divide by zero');
    return a / b;
  };

  assert.deepEqual(zipWith(faultyIteratee, [10], [2]), [5]);
  assert.throws(() => zipWith(faultyIteratee, [10], [0]), {
    name: 'RangeError',
    message: 'Cannot divide by zero'
  });
});

test('unzipWith: combines regrouped elements using iteratee function', () => {
  const zipped = [
    [1, 10, 100],
    [2, 20, 200]
  ];

  const sum = (...args) => args.reduce((acc, v) => acc + (v || 0), 0);
  const actual = unzipWith(zipped, sum);

  assert.deepEqual(actual, [3, 30, 300]);
});

test('unzipWith: throws TypeError if iteratee is not a function', () => {
  assert.throws(() => unzipWith([[1, 2]], null), TypeError);
  assert.throws(() => unzipWith([[1, 2]], 'not-a-func'), TypeError);
});

test('zip: preserves object references, symbols, and null values in tuples', () => {
  const sym = Symbol('token');
  const obj = { id: 1 };
  const arr1 = [sym, obj];
  const arr2 = [null, undefined];

  const actual = zip(arr1, arr2);
  assert.equal(actual[0][0], sym);
  assert.equal(actual[0][1], null);
  assert.equal(actual[1][0], obj);
  assert.equal(actual[1][1], undefined);
});
