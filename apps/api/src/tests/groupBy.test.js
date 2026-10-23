import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { groupBy } from '../utils/groupBy.js';

describe('Prototype-Safe Collection Grouper Utility (groupBy)', () => {
  it('groups items by string property name', () => {
    const list = [
      { id: 1, category: 'finance' },
      { id: 2, category: 'tech' },
      { id: 3, category: 'finance' }
    ];

    const grouped = groupBy(list, 'category');
    assert.deepEqual(grouped.finance, [
      { id: 1, category: 'finance' },
      { id: 3, category: 'finance' }
    ]);
    assert.deepEqual(grouped.tech, [{ id: 2, category: 'tech' }]);
  });

  it('groups items using a custom callback function', () => {
    const numbers = [6.1, 4.2, 6.3];
    const grouped = groupBy(numbers, Math.floor);

    assert.deepEqual(grouped['4'], [4.2]);
    assert.deepEqual(grouped['6'], [6.1, 6.3]);
  });

  it('prevents prototype pollution and handles Object.prototype method names safely', () => {
    const malicious = [
      { type: '__proto__', val: 1 },
      { type: 'constructor', val: 2 },
      { type: 'prototype', val: 3 },
      { type: 'toString', val: 4 },
      { type: 'valid', val: 5 }
    ];

    const grouped = groupBy(malicious, 'type');
    assert.equal(Object.prototype.hasOwnProperty.call(grouped, '__proto__'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(grouped, 'constructor'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(grouped, 'prototype'), false);
    assert.deepEqual(grouped.toString, [{ type: 'toString', val: 4 }]);
    assert.deepEqual(grouped.valid, [{ type: 'valid', val: 5 }]);
  });

  it('returns empty object for non-array inputs', () => {
    assert.deepEqual(groupBy(null, 'id'), {});
    assert.deepEqual(groupBy(undefined, 'id'), {});
    assert.deepEqual(groupBy('invalid', 'id'), {});
  });
});
