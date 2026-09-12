/**
 * @file setNested.test.js
 * Unit tests for setNested utility.
 */

import assert from 'assert';
import { setNested } from '../utils/setNested.js';

function runTests() {
  console.log('Running setNested unit tests...');

  // Test 1: Set nested dot-separated path
  {
    const config = {};
    setNested(config, 'server.database.port', 5432);
    assert.strictEqual(config.server.database.port, 5432);
    console.log('✔ Test 1 passed: Dot notation nesting');
  }

  // Test 2: Array index creation with bracket notation
  {
    const data = {};
    setNested(data, 'users[0].name', 'Alice');
    setNested(data, 'users[1].name', 'Bob');
    assert.strictEqual(Array.isArray(data.users), true);
    assert.strictEqual(data.users[0].name, 'Alice');
    assert.strictEqual(data.users[1].name, 'Bob');
    console.log('✔ Test 2 passed: Bracket array indexing');
  }

  // Test 3: Array path input
  {
    const target = { a: { b: 10 } };
    setNested(target, ['a', 'b'], 99);
    assert.strictEqual(target.a.b, 99);
    console.log('✔ Test 3 passed: Array path input');
  }

  // Test 4: Prototype pollution defense (__proto__, constructor, prototype)
  {
    const obj = {};
    setNested(obj, '__proto__.polluted', 'hacked');
    setNested(obj, 'constructor.prototype.polluted', 'hacked');
    setNested(obj, 'prototype.polluted', 'hacked');
    setNested(obj, ['__proto__', 'polluted'], 'hacked');

    assert.strictEqual(Object.prototype.polluted, undefined);
    assert.strictEqual({}.polluted, undefined);
    assert.strictEqual(obj.polluted, undefined);
    console.log('✔ Test 4 passed: Prototype pollution blocked');
  }

  // Test 5: Overwriting non-object intermediate keys
  {
    const state = { setting: 'disabled' };
    setNested(state, 'setting.enabled', true);
    assert.deepStrictEqual(state, { setting: { enabled: true } });
    console.log('✔ Test 5 passed: Overwrite non-object intermediate');
  }

  // Test 6: Null and invalid inputs
  {
    assert.strictEqual(setNested(null, 'a.b', 1), null);
    assert.deepStrictEqual(setNested({}, '', 1), {});
    console.log('✔ Test 6 passed: Null / empty handling');
  }

  console.log('All setNested tests passed successfully!');
}

runTests();
