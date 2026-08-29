/**
 * @file groupBy.test.js
 * Unit tests for groupBy utility.
 */

import assert from 'assert';
import { groupBy } from '../utils/groupBy.js';

function runTests() {
  console.log('Running groupBy unit tests...');

  // Test 1: Group by property string key
  {
    const items = [
      { id: 1, category: 'finance', amount: 100 },
      { id: 2, category: 'dev', amount: 200 },
      { id: 3, category: 'finance', amount: 300 },
    ];
    const grouped = groupBy(items, 'category');
    assert.strictEqual(grouped.finance.length, 2);
    assert.strictEqual(grouped.dev.length, 1);
    assert.strictEqual(grouped.finance[0].id, 1);
    assert.strictEqual(grouped.finance[1].id, 3);
    console.log('✔ Test 1 passed: Group by property string key');
  }

  // Test 2: Group with custom iteratee function
  {
    const numbers = [6.1, 4.2, 6.3];
    const grouped = groupBy(numbers, Math.floor);
    assert.strictEqual(grouped['6'].length, 2);
    assert.strictEqual(grouped['4'].length, 1);
    assert.deepStrictEqual(grouped['6'], [6.1, 6.3]);
    console.log('✔ Test 2 passed: Group with custom iteratee function');
  }

  // Test 3: Prototype pollution security test
  {
    const items = [
      { role: '__proto__', user: 'alice' },
      { role: 'constructor', user: 'bob' },
      { role: 'prototype', user: 'charlie' },
      { role: '__proto__', user: 'david' },
    ];
    const grouped = groupBy(items, 'role');
    assert.strictEqual(grouped['__proto__'].length, 2);
    assert.strictEqual(grouped['constructor'].length, 1);
    assert.strictEqual(grouped['prototype'].length, 1);
    assert.strictEqual(Object.prototype.polluted, undefined);
    assert.strictEqual({}.polluted, undefined);
    console.log('✔ Test 3 passed: Prototype pollution security test');
  }

  // Test 4: Support Map, Set and Object collections
  {
    const set = new Set(['one', 'two', 'three', 'four']);
    const groupedByLength = groupBy(set, (s) => s.length);
    assert.strictEqual(groupedByLength['3'].length, 2); // 'one', 'two'
    assert.strictEqual(groupedByLength['5'].length, 1); // 'three'
    assert.strictEqual(groupedByLength['4'].length, 1); // 'four'
    console.log('✔ Test 4 passed: Support Sets and iterables');
  }

  // Test 5: Empty / Null handling
  {
    assert.deepStrictEqual(groupBy(null), {});
    assert.deepStrictEqual(groupBy([]), {});
    console.log('✔ Test 5 passed: Empty and null inputs');
  }

  console.log('All groupBy tests passed successfully!');
}

runTests();
