/**
 * @file memoizeAsync.test.js
 * Unit tests for memoizeAsync utility.
 */

import assert from 'assert';
import { memoizeAsync } from '../utils/memoizeAsync.js';

async function runTests() {
  console.log('Running memoizeAsync unit tests...');

  // Test 1: Caches async results and avoids duplicate calls
  {
    let callCount = 0;
    const fetchPrice = memoizeAsync(async (symbol) => {
      callCount++;
      return { symbol, price: symbol === 'ETH' ? 3000 : 1 };
    });

    const p1 = await fetchPrice('ETH');
    const p2 = await fetchPrice('ETH');
    const p3 = await fetchPrice('USDC');

    assert.strictEqual(callCount, 2);
    assert.deepStrictEqual(p1, { symbol: 'ETH', price: 3000 });
    assert.deepStrictEqual(p2, { symbol: 'ETH', price: 3000 });
    assert.deepStrictEqual(p3, { symbol: 'USDC', price: 1 });
    console.log('✔ Test 1 passed: Basic async memoization');
  }

  // Test 2: Concurrent in-flight request deduplication
  {
    let executions = 0;
    const slowTask = memoizeAsync(async (id) => {
      executions++;
      await new Promise((r) => setTimeout(r, 20));
      return `result_${id}`;
    });

    const [r1, r2, r3] = await Promise.all([
      slowTask(42),
      slowTask(42),
      slowTask(42),
    ]);

    assert.strictEqual(executions, 1);
    assert.strictEqual(r1, 'result_42');
    assert.strictEqual(r2, 'result_42');
    assert.strictEqual(r3, 'result_42');
    console.log('✔ Test 2 passed: Concurrent in-flight request deduplication');
  }

  // Test 3: TTL expiration
  {
    let calls = 0;
    const getTimestamp = memoizeAsync(async () => {
      calls++;
      return Date.now();
    }, { ttlMs: 30 });

    const t1 = await getTimestamp();
    const t2 = await getTimestamp();
    assert.strictEqual(t1, t2);
    assert.strictEqual(calls, 1);

    // Wait for TTL to expire
    await new Promise((r) => setTimeout(r, 50));

    const t3 = await getTimestamp();
    assert.strictEqual(calls, 2);
    assert.notStrictEqual(t1, t3);
    console.log('✔ Test 3 passed: TTL expiration');
  }

  // Test 4: Custom keyResolver
  {
    let count = 0;
    const queryUser = memoizeAsync(async (userObj) => {
      count++;
      return userObj.name.toUpperCase();
    }, { keyResolver: (u) => u.id });

    const u1 = await queryUser({ id: 'user_1', name: 'Alice' });
    const u2 = await queryUser({ id: 'user_1', name: 'Alice Changed' }); // Same id, returns cached

    assert.strictEqual(count, 1);
    assert.strictEqual(u1, 'ALICE');
    assert.strictEqual(u2, 'ALICE');
    console.log('✔ Test 4 passed: Custom keyResolver');
  }

  // Test 5: Invalidation methods (.clear(), .deleteKey(), .has, .size)
  {
    const cachedFn = memoizeAsync(async (x) => x * 2);
    await cachedFn(10);
    await cachedFn(20);

    assert.strictEqual(cachedFn.size, 2);
    assert.strictEqual(cachedFn.has(10), true);
    assert.strictEqual(cachedFn.has(30), false);

    cachedFn.deleteKey(10);
    assert.strictEqual(cachedFn.size, 1);
    assert.strictEqual(cachedFn.has(10), false);

    cachedFn.clear();
    assert.strictEqual(cachedFn.size, 0);
    console.log('✔ Test 5 passed: Invalidation methods (.clear, .deleteKey, .has, .size)');
  }

  // Test 6: Rejection handling does not cache failed errors
  {
    let attempts = 0;
    const flakyApi = memoizeAsync(async (shouldFail) => {
      attempts++;
      if (shouldFail) {
        throw new Error('Network error');
      }
      return 'OK';
    });

    await assert.rejects(async () => await flakyApi(true), /Network error/);
    assert.strictEqual(attempts, 1);

    // Subsequent call retries because failed call was not cached
    const success = await flakyApi(false);
    assert.strictEqual(attempts, 2);
    assert.strictEqual(success, 'OK');
    console.log('✔ Test 6 passed: Rejection handling removes cache key for retries');
  }

  console.log('All memoizeAsync tests passed successfully!');
}

runTests();
