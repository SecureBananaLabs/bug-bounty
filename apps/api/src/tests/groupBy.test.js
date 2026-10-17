/**
 * @file groupBy.test.js
 * Unit tests for prototype-safe groupBy utility.
 */

import assert from 'assert';
import { groupBy } from '../utils/groupBy.js';

function runTests() {
  console.log('Running groupBy unit tests...');

  // Test 1: Group by string property key
  {
    const items = [
      { id: 1, category: 'fruit', name: 'apple' },
      { id: 2, category: 'vegetable', name: 'carrot' },
      { id: 3, category: 'fruit', name: 'banana' },
    ];

    const grouped = groupBy(items, 'category');
    assert.deepStrictEqual(grouped, {
      fruit: [
        { id: 1, category: 'fruit', name: 'apple' },
        { id: 3, category: 'fruit', name: 'banana' },
      ],
      vegetable: [
        { id: 2, category: 'vegetable', name: 'carrot' },
      ],
    });
    console.log('✔ Test 1 passed: Group by string property key');
  }

  // Test 2: Group by custom iteratee function
  {
    const numbers = [6.1, 4.2, 6.3];
    const grouped = groupBy(numbers, Math.floor);

    assert.deepStrictEqual(grouped, {
      '4': [4.2],
      '6': [6.1, 6.3],
    });
    console.log('✔ Test 2 passed: Group by custom iteratee function');
  }

  // Test 3: Guard against prototype pollution keys (__proto__, constructor, prototype)
  {
    const maliciousItems = [
      { key: '__proto__', val: 'polluted' },
      { key: 'constructor', val: 'evil' },
    ];

    const grouped = groupBy(maliciousItems, 'key');

    assert.strictEqual(Object.prototype.polluted, undefined);
    assert.strictEqual({}.polluted, undefined);
    assert.strictEqual(typeof Object.prototype.constructor, 'function');
    assert.strictEqual(grouped['__proto__'].length, 1);
    assert.strictEqual(grouped['constructor'].length, 1);
    console.log('✔ Test 3 passed: Prototype pollution safely handled');
  }

  // Test 4: Handle arrays and Sets (iterables)
  {
    const set = new Set(['one', 'two', 'three']);
    const grouped = groupBy(set, (s) => s.length);

    assert.deepStrictEqual(grouped, {
      '3': ['one', 'two'],
      '5': ['three'],
    });
    console.log('✔ Test 4 passed: Sets and custom iterables');
  }

  // Test 5: Handle empty, null, and non-iterable collections
  {
    assert.deepStrictEqual(groupBy(null, 'id'), {});
    assert.deepStrictEqual(groupBy(undefined, 'id'), {});
    assert.deepStrictEqual(groupBy(12345, 'id'), {});
    assert.deepStrictEqual(groupBy([], 'id'), {});
    console.log('✔ Test 5 passed: Non-iterable inputs safely return empty object');
  }

  console.log('All groupBy tests passed successfully!');
}

runTests();
