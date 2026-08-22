/**
 * @file retry.test.js
 * Unit tests for retry utility with exponential backoff and jitter.
 */

import assert from 'assert';
import { retry } from '../utils/retry.js';

async function runTests() {
  console.log('Running retry unit tests...');

  // Test 1: Immediate success on first attempt
  {
    let count = 0;
    const res = await retry(async () => {
      count++;
      return 'SUCCESS';
    });

    assert.strictEqual(res, 'SUCCESS');
    assert.strictEqual(count, 1);
    console.log('✔ Test 1 passed: Immediate success on first attempt');
  }

  // Test 2: Transient failures recovered on subsequent attempt
  {
    let attempts = 0;
    const retryLog = [];

    const res = await retry(
      async (att) => {
        attempts++;
        if (attempts < 3) {
          throw new Error(`Failure at attempt ${att}`);
        }
        return `SUCCESS_AT_${att}`;
      },
      {
        retries: 5,
        minTimeout: 5,
        maxTimeout: 20,
        jitter: false,
        onRetry: (err, att, delay) => {
          retryLog.push({ att, delay });
        },
      }
    );

    assert.strictEqual(res, 'SUCCESS_AT_3');
    assert.strictEqual(attempts, 3);
    assert.strictEqual(retryLog.length, 2);
    assert.strictEqual(retryLog[0].att, 1);
    assert.strictEqual(retryLog[1].att, 2);
    console.log('✔ Test 2 passed: Recovered transient failures');
  }

  // Test 3: Exhausted retries bubble up last error
  {
    let executions = 0;
    await assert.rejects(
      async () => {
        await retry(
          async () => {
            executions++;
            throw new Error('Persistent failure');
          },
          { retries: 2, minTimeout: 5, jitter: false }
        );
      },
      /Persistent failure/
    );

    assert.strictEqual(executions, 3); // initial + 2 retries
    console.log('✔ Test 3 passed: Exhausted retries throw last error');
  }

  // Test 4: Custom retryIf predicate immediately stops on fatal error
  {
    let executions = 0;
    await assert.rejects(
      async () => {
        await retry(
          async () => {
            executions++;
            const err = new Error('Unauthorized 401');
            err.status = 401;
            throw err;
          },
          {
            retries: 5,
            minTimeout: 5,
            retryIf: (err) => err.status !== 401, // Don't retry 401
          }
        );
      },
      /Unauthorized 401/
    );

    assert.strictEqual(executions, 1); // Bails out immediately without retrying
    console.log('✔ Test 4 passed: Predicate filter aborts fatal errors immediately');
  }

  // Test 5: Validation errors on invalid parameters
  {
    await assert.rejects(async () => retry('not a function'), TypeError);
    console.log('✔ Test 5 passed: Invalid fn parameter validation');
  }

  console.log('All retry tests passed successfully!');
}

runTests();
