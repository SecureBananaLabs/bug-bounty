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

  it('partitions complex objects based on property value', () => {
    const users = [
      { id: 1, active: true },
      { id: 2, active: false },
      { id: 3, active: true },
    ];

    const [active, inactive] = partition(users, (u) => u.active);
    assert.deepEqual(active, [{ id: 1, active: true }, { id: 3, active: true }]);
    assert.deepEqual(inactive, [{ id: 2, active: false }]);
  });

  it('defaults to truthiness check if predicate is omitted', () => {
    const items = [0, 1, false, 2, '', 3, null, undefined];
    const [truthy, falsy] = partition(items);

    assert.deepEqual(truthy, [1, 2, 3]);
    assert.deepEqual(falsy, [0, false, '', null, undefined]);
  });

  it('handles non-array inputs gracefully', () => {
    assert.deepEqual(partition(null), [[], []]);
    assert.deepEqual(partition('abc'), [[], []]);
  });
});
