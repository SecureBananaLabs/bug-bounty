import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { partition } from '../utils/partition.js';

describe('Collection Predicate Partition Utility (partition)', () => {
  it('partitions numbers based on even/odd predicate', () => {
    const numbers = [1, 2, 3, 4, 5, 6];
    const [evens, odds] = partition(numbers, (n) => n % 2 === 0);

    assert.deepEqual(evens, [2, 4, 6]);
    assert.deepEqual(odds, [1, 3, 5]);
  });

  it('partitions complex objects based on predicate function or property name', () => {
    const users = [
      { id: 1, active: true },
      { id: 2, active: false },
      { id: 3, active: true }
    ];

    const [active, inactive] = partition(users, (u) => u.active);
    assert.deepEqual(active, [
      { id: 1, active: true },
      { id: 3, active: true }
    ]);
    assert.deepEqual(inactive, [{ id: 2, active: false }]);

    const [byPropActive, byPropInactive] = partition(users, 'active');
    assert.equal(byPropActive.length, 2);
    assert.equal(byPropInactive.length, 1);
  });

  it('passes element, index, and original array to the predicate', () => {
    const items = ['a', 'b', 'c', 'd'];
    const [firstHalf, secondHalf] = partition(items, (_item, idx, arr) => idx < arr.length / 2);

    assert.deepEqual(firstHalf, ['a', 'b']);
    assert.deepEqual(secondHalf, ['c', 'd']);
  });

  it('returns [[], []] for empty or non-array inputs', () => {
    assert.deepEqual(partition([], (x) => Boolean(x)), [[], []]);
    assert.deepEqual(partition(null, (x) => Boolean(x)), [[], []]);
    assert.deepEqual(partition(undefined), [[], []]);
  });
});
