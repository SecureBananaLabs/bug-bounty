/**
 * @file pLimit.test.js
 * Unit tests for pLimit concurrency limiter.
 */

import assert from 'assert';
import { pLimit } from '../utils/pLimit.js';

async function runTests() {
  console.log('Running pLimit unit tests...');

  // Test 1: Concurrency constraint enforcement
  {
    const limit = pLimit(2);
    let running = 0;
    let maxRunning = 0;

    const task = async (ms) => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((r) => setTimeout(r, ms));
      running--;
      return ms;
    };

    const inputs = [30, 20, 20, 10];
    const results = await Promise.all(inputs.map((ms) => limit(() => task(ms))));

    assert.strictEqual(maxRunning, 2);
    assert.deepStrictEqual(results, [30, 20, 20, 10]);
    console.log('✔ Test 1 passed: Concurrency constraint strictly respected');
  }

  // Test 2: Active and Pending count metrics
  {
    const limit = pLimit(1);
    let release;
    const blocker = () => new Promise((resolve) => { release = resolve; });

    const p1 = limit(blocker);
    const p2 = limit(blocker);

    await new Promise((r) => setTimeout(r, 10));

    assert.strictEqual(limit.activeCount, 1);
    assert.strictEqual(limit.pendingCount, 1);

    release();
    await p1;

    await new Promise((r) => setTimeout(r, 10));

    assert.strictEqual(limit.activeCount, 1);
    assert.strictEqual(limit.pendingCount, 0);

    release();
    await p2;

    assert.strictEqual(limit.activeCount, 0);
    assert.strictEqual(limit.pendingCount, 0);
    console.log('✔ Test 2 passed: Active and Pending metrics tracked accurately');
  }

  // Test 3: Error propagation without blocking remaining tasks
  {
    const limit = pLimit(2);

    const failTask = () => Promise.reject(new Error('Task failure'));
    const successTask = () => Promise.resolve('ok');

    const results = await Promise.allSettled([
      limit(failTask),
      limit(successTask),
      limit(successTask),
    ]);

    assert.strictEqual(results[0].status, 'rejected');
    assert.strictEqual(results[0].reason.message, 'Task failure');
    assert.strictEqual(results[1].status, 'fulfilled');
    assert.strictEqual(results[1].value, 'ok');
    assert.strictEqual(results[2].status, 'fulfilled');
    assert.strictEqual(results[2].value, 'ok');
    console.log('✔ Test 3 passed: Rejection isolation and error propagation');
  }

  // Test 4: Passing arguments to target function
  {
    const limit = pLimit(1);
    const multiply = (a, b) => Promise.resolve(a * b);

    const res = await limit(multiply, 6, 7);
    assert.strictEqual(res, 42);
    console.log('✔ Test 4 passed: Function arguments correctly forwarded');
  }

  // Test 5: Validation errors on invalid concurrency parameter
  {
    assert.throws(() => pLimit(0), TypeError);
    assert.throws(() => pLimit(-1), TypeError);
    assert.throws(() => pLimit(1.5), TypeError);
    assert.throws(() => pLimit('invalid'), TypeError);
    console.log('✔ Test 5 passed: Invalid concurrency input validated');
  }

  console.log('All pLimit tests passed successfully!');
}

runTests();
