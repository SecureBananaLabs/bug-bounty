/**
 * @file getNested.test.js
 * Unit tests for getNested utility.
 */

import assert from 'assert';
import { getNested } from '../utils/getNested.js';

function runTests() {
  console.log('Running getNested unit tests...');

  // Test 1: Retrieve deeply nested values via dot notation
  {
    const config = {
      app: {
        server: {
          port: 8080,
          ssl: { enabled: true },
        },
      },
    };
    assert.strictEqual(getNested(config, 'app.server.port'), 8080);
    assert.strictEqual(getNested(config, 'app.server.ssl.enabled'), true);
    console.log('✔ Test 1 passed: Deep dot notation retrieval');
  }

  // Test 2: Array indexing with bracket and array notation
  {
    const payload = {
      items: [
        { id: 101, name: 'First' },
        { id: 102, name: 'Second' },
      ],
    };
    assert.strictEqual(getNested(payload, 'items[0].name'), 'First');
    assert.strictEqual(getNested(payload, 'items[1].id'), 102);
    assert.strictEqual(getNested(payload, ['items', 0, 'id']), 101);
    console.log('✔ Test 2 passed: Bracket and array indexing');
  }

  // Test 3: Fallback to defaultValue on missing properties
  {
    const data = { user: { name: 'Alice' } };
    assert.strictEqual(getNested(data, 'user.age', 25), 25);
    assert.strictEqual(getNested(data, 'user.settings.theme', 'dark'), 'dark');
    assert.strictEqual(getNested(null, 'user.name', 'Anonymous'), 'Anonymous');
    console.log('✔ Test 3 passed: Fallback defaultValue handling');
  }

  // Test 4: Prototype pollution guards (__proto__, constructor, prototype)
  {
    const target = {};
    assert.strictEqual(getNested(target, '__proto__', 'safe'), 'safe');
    assert.strictEqual(getNested(target, 'constructor.prototype', 'safe'), 'safe');
    assert.strictEqual(getNested(target, ['__proto__', 'polluted'], 'safe'), 'safe');
    console.log('✔ Test 4 passed: Prototype pollution blocked');
  }

  // Test 5: Falsy values are preserved (0, false, empty string, null)
  {
    const state = {
      zero: 0,
      flag: false,
      empty: '',
      nullVal: null,
    };
    assert.strictEqual(getNested(state, 'zero', 99), 0);
    assert.strictEqual(getNested(state, 'flag', true), false);
    assert.strictEqual(getNested(state, 'empty', 'default'), '');
    assert.strictEqual(getNested(state, 'nullVal', 'default'), null);
    console.log('✔ Test 5 passed: Falsy values preserved correctly');
  }

  console.log('All getNested tests passed successfully!');
}

runTests();
