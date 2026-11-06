import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { retryWithBackoff } from '../utils/retryWithBackoff.js';

describe('Asynchronous Retry with Exponential Backoff and Jitter (retryWithBackoff)', () => {
  it('resolves immediately on first attempt if fn succeeds', async () => {
    let callCount = 0;
    const result = await retryWithBackoff(async () => {
      callCount++;
      return 'success';
    });

    assert.equal(result, 'success');
    assert.equal(callCount, 1);
  });

  it('retries on transient failures until succeeding within max retries', async () => {
    let callCount = 0;
    const retriesObserved = [];

    const result = await retryWithBackoff(
      async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error(`Transient error #${callCount}`);
        }
        return 'recovered';
      },
      {
        retries: 3,
        initialDelayMs: 5,
        jitter: false,
        onRetry: (_err, attempt) => retriesObserved.push(attempt)
      }
    );

    assert.equal(result, 'recovered');
    assert.equal(callCount, 3);
    assert.deepEqual(retriesObserved, [1, 2]);
  });

  it('throws the last error when all retries are exhausted', async () => {
    let callCount = 0;
    await assert.rejects(
      () =>
        retryWithBackoff(
          async () => {
            callCount++;
            throw new Error('Persistent failure');
          },
          { retries: 2, initialDelayMs: 5, jitter: false }
        ),
      /Persistent failure/
    );
    assert.equal(callCount, 3);
  });

  it('stops retrying immediately when shouldRetry returns false', async () => {
    let callCount = 0;
    await assert.rejects(
      () =>
        retryWithBackoff(
          async () => {
            callCount++;
            const err = new Error('Fatal 400 Bad Request');
            err.status = 400;
            throw err;
          },
          {
            retries: 4,
            initialDelayMs: 5,
            shouldRetry: (err) => err.status !== 400
          }
        ),
      /Fatal 400 Bad Request/
    );
    assert.equal(callCount, 1);
  });

  it('aborts in-flight backoff wait when AbortSignal triggers', async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(new Error('Cancelled by caller')), 15);

    await assert.rejects(
      () =>
        retryWithBackoff(
          async () => {
            throw new Error('Retry me');
          },
          {
            retries: 5,
            initialDelayMs: 200,
            jitter: false,
            signal: controller.signal
          }
        ),
      /Cancelled by caller/
    );
  });
});
