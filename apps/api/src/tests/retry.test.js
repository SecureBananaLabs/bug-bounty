import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { retry } from '../utils/retry.js';

describe('Asynchronous Retry Utility with Exponential Backoff', () => {
  it('returns value immediately if function succeeds on first try', async () => {
    let callCount = 0;
    const res = await retry(async () => {
      callCount++;
      return 'success';
    });

    assert.equal(res, 'success');
    assert.equal(callCount, 1);
  });

  it('retries on failure and resolves when subsequent attempt succeeds', async () => {
    let callCount = 0;
    const res = await retry(
      async () => {
        callCount++;
        if (callCount < 3) throw new Error('temporary failure');
        return 'recovered';
      },
      { maxRetries: 3, baseDelayMs: 5 }
    );

    assert.equal(res, 'recovered');
    assert.equal(callCount, 3);
  });

  it('throws final error when maxRetries is exceeded', async () => {
    let callCount = 0;
    await assert.rejects(
      async () => {
        await retry(
          async () => {
            callCount++;
            throw new Error('permanent error');
          },
          { maxRetries: 2, baseDelayMs: 5 }
        );
      },
      { message: 'permanent error' }
    );

    assert.equal(callCount, 3); // 1 initial + 2 retries
  });

  it('respects custom retryIf predicate', async () => {
    let callCount = 0;
    await assert.rejects(
      async () => {
        await retry(
          async () => {
            callCount++;
            const err = new Error('non-retryable');
            err.code = 'FATAL';
            throw err;
          },
          {
            maxRetries: 3,
            retryIf: (err) => err.code !== 'FATAL',
          }
        );
      },
      { message: 'non-retryable' }
    );

    assert.equal(callCount, 1); // Bails out immediately
  });
});
