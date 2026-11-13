import test from 'node:test';
import assert from 'node:assert/strict';
import { retryAsync } from '../utils/retryAsync.js';

test('retryAsync resolves immediately when fn succeeds on first attempt', async () => {
  let callCount = 0;
  const result = await retryAsync(async () => {
    callCount++;
    return 'ok';
  }, { retries: 3, delay: 5 });

  assert.equal(result, 'ok');
  assert.equal(callCount, 1);
});

test('retryAsync retries and succeeds after transient failures', async () => {
  let callCount = 0;
  const result = await retryAsync(async () => {
    callCount++;
    if (callCount < 3) {
      throw new Error(`Transient failure ${callCount}`);
    }
    return 'recovered';
  }, { retries: 3, delay: 5, backoff: 1.5 });

  assert.equal(result, 'recovered');
  assert.equal(callCount, 3);
});

test('retryAsync throws final error when retries are exhausted', async () => {
  let callCount = 0;
  await assert.rejects(
    async () => {
      await retryAsync(async () => {
        callCount++;
        throw new Error('Persistent failure');
      }, { retries: 2, delay: 5 });
    },
    { message: 'Persistent failure' }
  );

  // 1 initial try + 2 retries = 3 calls
  assert.equal(callCount, 3);
});

test('retryAsync halts immediately when shouldRetry returns false', async () => {
  let callCount = 0;
  await assert.rejects(
    async () => {
      await retryAsync(async () => {
        callCount++;
        const err = new Error('Fatal 400 Bad Request');
        err.statusCode = 400;
        throw err;
      }, {
        retries: 5,
        delay: 5,
        shouldRetry: (err) => err.statusCode >= 500,
      });
    },
    { message: 'Fatal 400 Bad Request' }
  );

  // Fails on attempt 1, shouldRetry is false, halts with 1 call
  assert.equal(callCount, 1);
});

test('retryAsync invokes onRetry callback before sleeping', async () => {
  const retryEvents = [];
  let callCount = 0;

  const result = await retryAsync(async () => {
    callCount++;
    if (callCount < 3) {
      throw new Error(`Err ${callCount}`);
    }
    return 'done';
  }, {
    retries: 4,
    delay: 5,
    backoff: 2,
    onRetry: (err, attempt, nextDelay) => {
      retryEvents.push({ message: err.message, attempt, nextDelay });
    },
  });

  assert.equal(result, 'done');
  assert.equal(retryEvents.length, 2);
  assert.equal(retryEvents[0].attempt, 1);
  assert.equal(retryEvents[0].nextDelay, 5);
  assert.equal(retryEvents[1].attempt, 2);
  assert.equal(retryEvents[1].nextDelay, 10);
});

test('retryAsync clamps delay at maxDelay', async () => {
  let recordedDelay = 0;
  let callCount = 0;

  await assert.rejects(
    async () => {
      await retryAsync(async () => {
        callCount++;
        throw new Error('Fail');
      }, {
        retries: 3,
        delay: 50,
        backoff: 10,
        maxDelay: 100,
        onRetry: (_err, _attempt, delay) => {
          recordedDelay = delay;
        },
      });
    },
    { message: 'Fail' }
  );

  // Attempt 1: 50
  // Attempt 2: min(50 * 10, 100) = 100
  // Attempt 3: min(50 * 100, 100) = 100
  assert.equal(recordedDelay, 100);
});

test('retryAsync validates inputs strictly', async () => {
  await assert.rejects(
    async () => retryAsync('not-a-func'),
    { name: 'TypeError', message: 'fn must be a callable function' }
  );

  await assert.rejects(
    async () => retryAsync(async () => {}, { retries: -1 }),
    { name: 'TypeError', message: 'retries must be a non-negative integer' }
  );

  await assert.rejects(
    async () => retryAsync(async () => {}, { delay: -10 }),
    { name: 'TypeError', message: 'delay must be a non-negative number' }
  );

  await assert.rejects(
    async () => retryAsync(async () => {}, { backoff: 0.5 }),
    { name: 'TypeError', message: 'backoff must be a number greater than or equal to 1' }
  );

  await assert.rejects(
    async () => retryAsync(async () => {}, { maxDelay: -5 }),
    { name: 'TypeError', message: 'maxDelay must be a non-negative number' }
  );

  await assert.rejects(
    async () => retryAsync(async () => {}, { shouldRetry: 'not-a-func' }),
    { name: 'TypeError', message: 'shouldRetry must be a function' }
  );

  await assert.rejects(
    async () => retryAsync(async () => {}, { onRetry: 123 }),
    { name: 'TypeError', message: 'onRetry must be null or a function' }
  );
});

test('retryAsync works with synchronous functions returning values or throwing', async () => {
  let count = 0;
  const result = await retryAsync(() => {
    count++;
    if (count === 1) throw new Error('sync fail');
    return 12345;
  }, { retries: 2, delay: 5 });

  assert.equal(result, 12345);
  assert.equal(count, 2);
});
