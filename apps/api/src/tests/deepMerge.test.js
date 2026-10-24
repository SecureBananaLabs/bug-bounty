/**
 * @file deepMerge.test.js
 * Unit tests for prototype-safe deepMerge utility.
 */

import assert from 'assert';
import { deepMerge } from '../utils/deepMerge.js';

function runTests() {
  console.log('Running deepMerge unit tests...');

  // Test 1: Recursive object merging
  {
    const target = {
      server: { port: 3000, host: 'localhost' },
      features: { auth: true },
    };
    const source = {
      server: { port: 8080, ssl: true },
      features: { logging: false },
    };

    const result = deepMerge(target, source);
    assert.deepStrictEqual(result, {
      server: { port: 8080, host: 'localhost', ssl: true },
      features: { auth: true, logging: false },
    });
    console.log('✔ Test 1 passed: Recursive nested merge');
  }

  // Test 2: Multiple sources in sequence
  {
    const base = { a: 1 };
    const src1 = { b: 2, c: { d: 3 } };
    const src2 = { c: { e: 4 }, f: 5 };

    const result = deepMerge(base, src1, src2);
    assert.deepStrictEqual(result, {
      a: 1,
      b: 2,
      c: { d: 3, e: 4 },
      f: 5,
    });
    console.log('✔ Test 2 passed: Multiple source objects merged');
  }

  // Test 3: Prototype pollution protection (__proto__, constructor, prototype)
  {
    const malicious = JSON.parse('{"__proto__": {"polluted": true}, "constructor": {"prototype": {"isAdmin": true}}}');
    const target = {};

    deepMerge(target, malicious);

    assert.strictEqual(Object.prototype.polluted, undefined);
    assert.strictEqual({}.polluted, undefined);
    assert.strictEqual(Object.prototype.isAdmin, undefined);
    assert.strictEqual({}.isAdmin, undefined);
    assert.strictEqual(target.polluted, undefined);
    console.log('✔ Test 3 passed: Prototype pollution strictly blocked');
  }

  // Test 4: Array values cloned cleanly
  {
    const target = { items: [1, 2] };
    const source = { items: [{ id: 10 }] };

    const result = deepMerge(target, source);
    assert.deepStrictEqual(result.items, [{ id: 10 }]);
    assert.notStrictEqual(result.items[0], source.items[0]);
    console.log('✔ Test 4 passed: Arrays and object elements cloned');
  }

  // Test 5: Invalid and non-object handling
  {
    const res1 = deepMerge(null, { a: 1 });
    const res2 = deepMerge({ a: 1 }, null, undefined, 'string', 123);

    assert.deepStrictEqual(res1, { a: 1 });
    assert.deepStrictEqual(res2, { a: 1 });
    console.log('✔ Test 5 passed: Non-object inputs handled safely');
  }

  console.log('All deepMerge tests passed successfully!');
}

runTests();
