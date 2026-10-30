import test from 'node:test';
import assert from 'node:assert/strict';
import {
  difference,
  intersection,
  union,
  symmetricDifference
} from '../utils/setOperations.js';

test('difference: computes basic difference between two arrays', () => {
  const arr1 = [2, 1, 3, 4];
  const arr2 = [2, 3];
  const result = difference(arr1, arr2);
  assert.deepEqual(result, [1, 4]);
});

test('difference: transforms values with custom iteratee', () => {
  const arr1 = [2.1, 1.2, 3.3];
  const arr2 = [2.3, 3.4];
  const result = difference(arr1, arr2, Math.floor);
  assert.deepEqual(result, [1.2]);
});

test('difference: supports unique=false to preserve duplicate occurrences', () => {
  const arr1 = [1, 2, 1, 3, 2];
  const arr2 = [3];
  const uniqueResult = difference(arr1, arr2, { unique: true });
  assert.deepEqual(uniqueResult, [1, 2]);

  const nonUniqueResult = difference(arr1, arr2, { unique: false });
  assert.deepEqual(nonUniqueResult, [1, 2, 1, 2]);
});

test('intersection: computes basic intersection between two arrays', () => {
  const arr1 = [2, 1, 3];
  const arr2 = [2, 3, 5];
  const result = intersection(arr1, arr2);
  assert.deepEqual(result, [2, 3]);
});

test('intersection: transforms values with custom iteratee on objects', () => {
  const arr1 = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }, { id: 3, name: 'Charlie' }];
  const arr2 = [{ id: 2 }, { id: 4 }];
  const result = intersection(arr1, arr2, (x) => x.id);
  assert.deepEqual(result, [{ id: 2, name: 'Bob' }]);
});

test('union: merges arrays with uniqueness', () => {
  const arr1 = [1, 2, 3];
  const arr2 = [3, 4, 5, 1];
  const result = union(arr1, arr2);
  assert.deepEqual(result, [1, 2, 3, 4, 5]);
});

test('union: merges arrays with custom iteratee', () => {
  const arr1 = [1.2, 2.4];
  const arr2 = [1.8, 3.1];
  const result = union(arr1, arr2, Math.floor);
  assert.deepEqual(result, [1.2, 2.4, 3.1]);
});

test('symmetricDifference: returns elements present in one array but not both', () => {
  const arr1 = [1, 2, 3, 4];
  const arr2 = [3, 4, 5, 6];
  const result = symmetricDifference(arr1, arr2);
  assert.deepEqual(result, [1, 2, 5, 6]);
});

test('sparse array defense: skips unassigned holes and ignores prototype pollution', () => {
  // Simulate array with holes
  const sparse1 = [1, , 3]; // index 1 is empty hole
  const sparse2 = [2, , 4];

  // Temporarily attach property to Array.prototype to simulate attack
  Array.prototype[1] = 'evil-injected-slot';

  try {
    const diff = difference(sparse1, [3], { skipHoles: true });
    assert.deepEqual(diff, [1]);
    assert.ok(!diff.includes('evil-injected-slot'));

    const inter = intersection(sparse1, [1, 3], { skipHoles: true });
    assert.deepEqual(inter, [1, 3]);
    assert.ok(!inter.includes('evil-injected-slot'));
  } finally {
    delete Array.prototype[1];
  }
});

test('iteratee exception shielding: suppresses errors in default mode and falls back', () => {
  const arr1 = ['safe', 'boom', 'ok'];
  const arr2 = ['boom'];
  const faultyIteratee = (x) => {
    if (x === 'boom') throw new Error('Iteratee exploded');
    return x.toUpperCase();
  };

  // Default non-strict mode should shield and not crash
  const diff = difference(arr1, arr2, faultyIteratee, { strict: false });
  // 'boom' threw in arr2 and in arr1, so fallback compared raw 'boom' === 'boom'
  assert.deepEqual(diff, ['safe', 'ok']);
});

test('iteratee exception propagation: throws in strict mode', () => {
  const arr1 = ['good', 'crash'];
  const arr2 = ['good'];
  const faultyIteratee = (x) => {
    if (x === 'crash') throw new Error('Crash in strict mode');
    return x;
  };

  assert.throws(
    () => difference(arr1, arr2, faultyIteratee, { strict: true }),
    /Crash in strict mode/
  );
  assert.throws(
    () => intersection(arr1, arr2, faultyIteratee, { strict: true }),
    /Crash in strict mode/
  );
});

test('handles special JS values: NaN, null, undefined, Symbol', () => {
  const s1 = Symbol('s1');
  const s2 = Symbol('s2');
  const arr1 = [NaN, null, undefined, s1, s2];
  const arr2 = [NaN, undefined, s2];

  const diff = difference(arr1, arr2);
  assert.deepEqual(diff, [null, s1]);

  const inter = intersection(arr1, arr2);
  assert.ok(inter.some((v) => Number.isNaN(v)));
  assert.ok(inter.includes(undefined));
  assert.ok(inter.includes(s2));
  assert.equal(inter.length, 3);
});

test('supports passing options as 3rd argument', () => {
  const arr1 = [1, 2, 3];
  const arr2 = [2];
  const diff = difference(arr1, arr2, { unique: true });
  assert.deepEqual(diff, [1, 3]);

  const inter = intersection(arr1, arr2, { unique: true });
  assert.deepEqual(inter, [2]);
});

test('non-strict fallbacks vs strict type checking for invalid array arguments', () => {
  // Non-strict returns empty array
  assert.deepEqual(difference(null, [1, 2]), []);
  assert.deepEqual(difference([1, 2], null), [1, 2]);
  assert.deepEqual(intersection(undefined, [1, 2]), []);

  // Strict mode throws TypeError
  assert.throws(() => difference(null, [1, 2], { strict: true }), TypeError);
  assert.throws(() => difference([1, 2], 'invalid', { strict: true }), TypeError);
  assert.throws(() => difference([1, 2], [1], 'not-a-func', { strict: true }), TypeError);
});

test('enforces maxElements limit in strict mode', () => {
  const largeArr = new Array(1001).fill(1);
  assert.throws(
    () => difference(largeArr, [2], { strict: true, maxElements: 1000 }),
    RangeError
  );
});
