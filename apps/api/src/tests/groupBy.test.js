import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { groupBy } from '../utils/groupBy.js';

describe('Prototype-Safe Collection Grouper Utility (groupBy)', () => {
  it('groups items by string property name', () => {
    const list = [
      { id: 1, category: 'finance' },
      { id: 2, category: 'tech' },
      { id: 3, category: 'finance' },
    ];

    const grouped = groupBy(list, 'category');
    assert.deepEqual(grouped['finance'], [{ id: 1, category: 'finance' }, { id: 3, category: 'finance' }]);
    assert.deepEqual(grouped['tech'], [{ id: 2, category: 'tech' }]);
  });

  it('groups items using a custom mapping function', () => {
    const numbers = [6.1, 4.2, 6.3];
    const grouped = groupBy(numbers, Math.floor);

    assert.deepEqual(grouped['6'], [6.1, 6.3]);
    assert.deepEqual(grouped['4'], [4.2]);
  });

  it('protects against Prototype Pollution on group keys', () => {
    const malicious = [
      { key: '__proto__', val: 'polluted' },
      { key: 'constructor', val: 'polluted' },
    ];

    const grouped = groupBy(malicious, 'key');
    assert.equal(({})['val'], undefined);
    assert.equal(grouped['__proto__'], undefined);
  });

  it('handles non-array inputs gracefully', () => {
    const result = groupBy(null, 'cat');
    assert.deepEqual(Object.keys(result), []);
  });
});
