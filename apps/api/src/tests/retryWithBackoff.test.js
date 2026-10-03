import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { retryWithBackoff } from '../utils/retryWithBackoff.js';

describe('retryWithBackoff', () => {
  test('resolves immediately on first attempt if fn succeeds', async () => {
    let callCount = 0;
    const result = await retryWithBackoff(async () => {
      callCount++;
      return 'success';
    });

    assert.equal(result, 'success');
    assert.equal(callCount, 1);
  });

  test('retries on failure until success within max retries', async () => {
    let callCount = 0;
    const result = await retryWithBackoff(
      async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'recovered';
      },
      { retries: 3, initialDelayMs: 10, jitter: false }
    );

    assert.equal(result, 'recovered');
    assert.equal(callCount, 3);
  });

  test('throws final error if all retries are exhausted', async () => {
    let callCount = 0;
    await assert.rejects(
      async () => {
        await retryWithBackoff(
          async () => {
            callCount++;
            throw new Error('Persistent failure');
          },
          { retries: 2, initialDelayMs: 5, jitter: false }
        );
      },
      { message: 'Persistent failure' }
    );

    assert.equal(callCount, 3); // 1 initial + 2 retries
  });

  test('honors custom shouldRetry predicate', async () => {
    let callCount = 0;
    class NonRetryableError extends Error {}

    await assert.rejects(
      async () => {
        await retryWithBackoff(
          async () => {
            callCount++;
            throw new NonRetryableError('Do not retry this');
          },
          {
            retries: 5,
            shouldRetry: (err) => !(err instanceof NonRetryableError),
          }
        );
      },
      (err) => err instanceof NonRetryableError
    );

    assert.equal(callCount, 1);
  });

  test('invokes onRetry callback on each retry attempt', async () => {
    const retryLogs = [];
    let callCount = 0;

    await retryWithBackoff(
      async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error(`Fail ${callCount}`);
        }
        return 'done';
      },
      {
        retries: 3,
        initialDelayMs: 5,
        jitter: false,
        onRetry: (err, attempt, delay) => {
          retryLogs.push({ attempt, message: err.message, delay });
        },
      }
    );

    assert.equal(retryLogs.length, 2);
    assert.equal(retryLogs[0].attempt, 1);
    assert.equal(retryLogs[0].message, 'Fail 1');
    assert.equal(retryLogs[1].attempt, 2);
    assert.equal(retryLogs[1].message, 'Fail 2');
  });

  test('cancels retries when AbortSignal is triggered', async () => {
    const controller = new AbortController();
    let callCount = 0;

    setTimeout(() => {
      controller.abort();
    }, 20);

    await assert.rejects(
      async () => {
        await retryWithBackoff(
          async () => {
            callCount++;
            throw new Error('Failure');
          },
          {
            retries: 10,
            initialDelayMs: 50,
            jitter: false,
            signal: controller.signal,
          }
        );
      },
      { message: 'Operation aborted' }
    );
  });
});
