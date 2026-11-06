/**
 * @file once.test.js
 * Unit tests for once and onceAsync utility wrappers.
 */

import assert from 'assert';
import { once, onceAsync } from '../utils/once.js';

async function runTests() {
  console.log('Running once and onceAsync unit tests...');

  // Test 1: Function only runs once and returns cached value
  {
    let count = 0;
    const initialize = once((x) => {
      count++;
      return x * 10;
    });

    const res1 = initialize(5);
    const res2 = initialize(10);
    const res3 = initialize(20);

    assert.strictEqual(count, 1);
    assert.strictEqual(res1, 50);
    assert.strictEqual(res2, 50);
    assert.strictEqual(res3, 50);
    console.log('✔ Test 1 passed: Function runs strictly once');
  }

  // Test 2: Preserves `this` execution context
  {
    const database = {
      prefix: 'DB_',
      connect: once(function (dbName) {
        return this.prefix + dbName;
      }),
    };

    const c1 = database.connect('PRODUCTION');
    const c2 = database.connect('STAGING');

    assert.strictEqual(c1, 'DB_PRODUCTION');
    assert.strictEqual(c2, 'DB_PRODUCTION');
    console.log('✔ Test 2 passed: Preserves `this` context');
  }

  // Test 3: onceAsync single execution and concurrency deduplication
  {
    let asyncCalls = 0;
    const fetchConfig = onceAsync(async (configName) => {
      asyncCalls++;
      return { config: configName, loaded: true };
    });

    const [p1, p2, p3] = await Promise.all([
      fetchConfig('app_settings'),
      fetchConfig('app_settings'),
      fetchConfig('app_settings'),
    ]);

    assert.strictEqual(asyncCalls, 1);
    assert.deepStrictEqual(p1, { config: 'app_settings', loaded: true });
    assert.deepStrictEqual(p2, { config: 'app_settings', loaded: true });
    assert.deepStrictEqual(p3, { config: 'app_settings', loaded: true });
    console.log('✔ Test 3 passed: onceAsync concurrent deduplication');
  }

  // Test 4: onceAsync subsequent calls after resolution
  {
    let callCount = 0;
    const getMigrator = onceAsync(async () => {
      callCount++;
      return 'v1.0.0';
    });

    const initial = await getMigrator();
    const later = await getMigrator();

    assert.strictEqual(callCount, 1);
    assert.strictEqual(initial, 'v1.0.0');
    assert.strictEqual(later, 'v1.0.0');
    console.log('✔ Test 4 passed: onceAsync subsequent calls return cached result');
  }

  // Test 5: TypeError on non-function arguments
  {
    assert.throws(() => once('not a function'), TypeError);
    assert.throws(() => onceAsync(null), TypeError);
    console.log('✔ Test 5 passed: TypeError on non-function inputs');
  }

  console.log('All once and onceAsync tests passed successfully!');
}

runTests();
