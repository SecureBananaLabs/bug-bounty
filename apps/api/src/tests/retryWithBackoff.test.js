import { describe, it } from 'node:test';
import assert from 'node:assert';
import { retryWithBackoff, calculateBackoff } from '../utils/retryWithBackoff.js';

describe('retryWithBackoff Utility', () => {
  it('should successfully return the value on immediate success without retries', async () => {
    let callCount = 0;
    const res = await retryWithBackoff(async () => {
      callCount++;
      return 'success-value';
    });

    assert.strictEqual(res, 'success-value');
    assert.strictEqual(callCount, 1);
  });

  it('should retry on failure and resolve when a retry succeeds', async () => {
    let callCount = 0;
    const res = await retryWithBackoff(
      async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('transient error');
        }
        return 'recovered';
      },
      {
        maxRetries: 3,
        initialDelayMs: 10,
        jitter: false,
      }
    );

    assert.strictEqual(res, 'recovered');
    assert.strictEqual(callCount, 3);
  });

  it('should rethrow the last error when maxRetries is exceeded', async () => {
    let callCount = 0;
    await assert.rejects(
      async () => {
        await retryWithBackoff(
          async () => {
            callCount++;
            throw new Error('persistent failure');
          },
          {
            maxRetries: 2,
            initialDelayMs: 10,
            jitter: false,
          }
        );
      },
      {
        name: 'Error',
        message: 'persistent failure',
      }
    );

    assert.strictEqual(callCount, 3); // initial + 2 retries
  });

  it('should respect custom retryOn predicate and not retry if predicate returns false', async () => {
    let callCount = 0;
    class NonRetryableError extends Error {
      constructor(msg) {
        super(msg);
        this.name = 'NonRetryableError';
      }
    }

    await assert.rejects(
      async () => {
        await retryWithBackoff(
          async () => {
            callCount++;
            throw new NonRetryableError('do not retry');
          },
          {
            maxRetries: 5,
            initialDelayMs: 10,
            retryOn: (err) => !(err instanceof NonRetryableError),
          }
        );
      },
      {
        name: 'NonRetryableError',
        message: 'do not retry',
      }
    );

    assert.strictEqual(callCount, 1);
  });

  it('should trigger onRetry callback on each failed attempt before retry', async () => {
    const onRetryEvents = [];
    let callCount = 0;

    const res = await retryWithBackoff(
      async () => {
        callCount++;
        if (callCount <= 2) {
          throw new Error(`err-${callCount}`);
        }
        return 'done';
      },
      {
        maxRetries: 3,
        initialDelayMs: 10,
        jitter: false,
        onRetry: (data) => onRetryEvents.push(data),
      }
    );

    assert.strictEqual(res, 'done');
    assert.strictEqual(onRetryEvents.length, 2);
    assert.strictEqual(onRetryEvents[0].attempt, 1);
    assert.strictEqual(onRetryEvents[0].error.message, 'err-1');
    assert.strictEqual(onRetryEvents[1].attempt, 2);
    assert.strictEqual(onRetryEvents[1].error.message, 'err-2');
  });

  it('should abort immediately if AbortSignal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort(new Error('Pre-aborted'));

    await assert.rejects(
      async () => {
        await retryWithBackoff(
          async () => 'never executed',
          { signal: controller.signal }
        );
      },
      (err) => err.message === 'Pre-aborted'
    );
  });

  it('should calculate exponential backoff accurately with and without jitter', () => {
    const d1 = calculateBackoff(1, { initialDelayMs: 100, backoffFactor: 2, jitter: false });
    const d2 = calculateBackoff(2, { initialDelayMs: 100, backoffFactor: 2, jitter: false });
    const d3 = calculateBackoff(3, { initialDelayMs: 100, backoffFactor: 2, jitter: false });

    assert.strictEqual(d1, 100);
    assert.strictEqual(d2, 200);
    assert.strictEqual(d3, 400);

    const jitterDelay = calculateBackoff(2, { initialDelayMs: 100, backoffFactor: 2, jitter: true });
    assert.ok(jitterDelay >= 0 && jitterDelay <= 200);

    const equalJitter = calculateBackoff(2, { initialDelayMs: 100, backoffFactor: 2, jitter: 'equal' });
    assert.ok(equalJitter >= 100 && equalJitter <= 200);
  });
});