import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { partition } from '../utils/partition.js';

describe('partition', () => {
  test('partitions array of numbers with predicate', () => {
    const numbers = [1, 2, 3, 4, 5, 6];
    const [evens, odds] = partition(numbers, (n) => n % 2 === 0);

    assert.deepEqual(evens, [2, 4, 6]);
    assert.deepEqual(odds, [1, 3, 5]);
  });

  test('partitions array with default Boolean predicate (truthy/falsy)', () => {
    const items = [0, 1, false, 2, '', 3, 'a', null, undefined, NaN];
    const [truthy, falsy] = partition(items);

    assert.deepEqual(truthy, [1, 2, 3, 'a']);
    assert.deepEqual(falsy, [0, false, '', null, undefined, NaN]);
  });

  test('partitions objects by property values', () => {
    const users = {
      alice: { active: true, age: 25 },
      bob: { active: false, age: 17 },
      charlie: { active: true, age: 30 }
    };

    const [active, inactive] = partition(users, (u) => u.active);
    assert.deepEqual(active, [{ active: true, age: 25 }, { active: true, age: 30 }]);
    assert.deepEqual(inactive, [{ active: false, age: 17 }]);
  });

  test('partitions Set items', () => {
    const set = new Set([10, 15, 20, 25, 30]);
    const [divBy10, notDivBy10] = partition(set, (n) => n % 10 === 0);

    assert.deepEqual(divBy10, [10, 20, 30]);
    assert.deepEqual(notDivBy10, [15, 25]);
  });

  test('handles null, undefined, and non-iterable inputs gracefully', () => {
    assert.deepEqual(partition(null), [[], []]);
    assert.deepEqual(partition(undefined), [[], []]);
    assert.deepEqual(partition(12345), [[], []]);
  });
});
