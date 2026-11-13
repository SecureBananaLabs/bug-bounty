import test from 'node:test';
import assert from 'node:assert/strict';
import { pLimit } from '../utils/pLimit.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('pLimit - throttles concurrency to the maximum specified limit', async () => {
  const limit = pLimit(2);
  let activeMax = 0;
  let currentlyRunning = 0;

  const makeTask = (id, ms) => async () => {
    currentlyRunning++;
    if (currentlyRunning > activeMax) {
      activeMax = currentlyRunning;
    }
    await delay(ms);
    currentlyRunning--;
    return id;
  };

  const tasks = [
    limit(makeTask(1, 30)),
    limit(makeTask(2, 30)),
    limit(makeTask(3, 30)),
    limit(makeTask(4, 30)),
    limit(makeTask(5, 30))
  ];

  const results = await Promise.all(tasks);
  assert.deepEqual(results, [1, 2, 3, 4, 5]);
  assert.equal(activeMax, 2, 'Maximum concurrent tasks must never exceed 2');
  assert.equal(limit.activeCount, 0);
  assert.equal(limit.pendingCount, 0);
});

test('pLimit - strictly serializes tasks when concurrency is 1', async () => {
  const limit = pLimit(1);
  const log = [];

  const task1 = limit(async () => {
    log.push('start 1');
    await delay(20);
    log.push('end 1');
    return 'r1';
  });

  const task2 = limit(async () => {
    log.push('start 2');
    await delay(10);
    log.push('end 2');
    return 'r2';
  });

  const results = await Promise.all([task1, task2]);
  assert.deepEqual(results, ['r1', 'r2']);
  assert.deepEqual(log, ['start 1', 'end 1', 'start 2', 'end 2']);
});

test('pLimit - accurately reports activeCount and pendingCount metrics', async () => {
  const limit = pLimit(2);

  assert.equal(limit.concurrency, 2);
  assert.equal(limit.activeCount, 0);
  assert.equal(limit.pendingCount, 0);

  const t1 = limit(async () => { await delay(40); return 1; });
  const t2 = limit(async () => { await delay(40); return 2; });
  const t3 = limit(async () => { await delay(40); return 3; });
  const t4 = limit(async () => { await delay(40); return 4; });

  assert.equal(limit.activeCount, 2);
  assert.equal(limit.pendingCount, 2);

  await Promise.all([t1, t2, t3, t4]);

  assert.equal(limit.activeCount, 0);
  assert.equal(limit.pendingCount, 0);
});

test('pLimit - forwards invocation arguments to wrapped function', async () => {
  const limit = pLimit(3);

  const sum = async (a, b, c) => {
    await delay(10);
    return a + b + c;
  };

  const result = await limit(sum, 10, 20, 30);
  assert.equal(result, 60);
});

test('pLimit - propagates async rejection without blocking queued tasks', async () => {
  const limit = pLimit(1);

  const failTask = limit(async () => {
    await delay(10);
    throw new Error('Task failed');
  });

  const passTask = limit(async () => {
    await delay(10);
    return 'recovered';
  });

  await assert.rejects(failTask, { message: 'Task failed' });
  const result = await passTask;
  assert.equal(result, 'recovered');
  assert.equal(limit.activeCount, 0);
  assert.equal(limit.pendingCount, 0);
});

test('pLimit - handles synchronous functions and errors properly', async () => {
  const limit = pLimit(2);

  const syncVal = await limit(() => 42);
  assert.equal(syncVal, 42);

  const syncFail = limit(() => {
    throw new Error('Sync error');
  });
  await assert.rejects(syncFail, { message: 'Sync error' });

  assert.equal(limit.activeCount, 0);
  assert.equal(limit.pendingCount, 0);
});

test('pLimit - rejects with TypeError when fn is not a function', async () => {
  const limit = pLimit(2);

  await assert.rejects(limit(null), {
    name: 'TypeError',
    message: 'Expected `fn` to be a function'
  });

  await assert.rejects(limit('string'), {
    name: 'TypeError',
    message: 'Expected `fn` to be a function'
  });
});

test('pLimit - throws TypeError on invalid concurrency values', () => {
  assert.throws(() => pLimit(0), {
    name: 'TypeError',
    message: 'Expected `concurrency` to be a positive integer'
  });

  assert.throws(() => pLimit(-5), {
    name: 'TypeError',
    message: 'Expected `concurrency` to be a positive integer'
  });

  assert.throws(() => pLimit(1.5), {
    name: 'TypeError',
    message: 'Expected `concurrency` to be a positive integer'
  });

  assert.throws(() => pLimit(NaN), {
    name: 'TypeError',
    message: 'Expected `concurrency` to be a positive integer'
  });

  assert.throws(() => pLimit(Infinity), {
    name: 'TypeError',
    message: 'Expected `concurrency` to be a positive integer'
  });

  assert.throws(() => pLimit('3'), {
    name: 'TypeError',
    message: 'Expected `concurrency` to be a positive integer'
  });

  assert.throws(() => pLimit(null), {
    name: 'TypeError',
    message: 'Expected `concurrency` to be a positive integer'
  });
});

test('pLimit - clearQueue cancels pending tasks while allowing active to finish', async () => {
  const limit = pLimit(1);

  const t1 = limit(async () => {
    await delay(30);
    return 't1-done';
  });

  const t2 = limit(async () => {
    await delay(30);
    return 't2-done';
  });

  const t3 = limit(async () => {
    await delay(30);
    return 't3-done';
  });

  // Attach catch handler early to prevent unhandled rejection events
  const p2 = t2.catch((err) => err);
  const p3 = t3.catch((err) => err);

  assert.equal(limit.activeCount, 1);
  assert.equal(limit.pendingCount, 2);

  limit.clearQueue(new Error('Queue aborted by operator'));

  assert.equal(limit.pendingCount, 0);

  const r1 = await t1;
  assert.equal(r1, 't1-done');

  const err2 = await p2;
  const err3 = await p3;
  assert.equal(err2.message, 'Queue aborted by operator');
  assert.equal(err3.message, 'Queue aborted by operator');

  assert.equal(limit.activeCount, 0);
  assert.equal(limit.pendingCount, 0);
});

test('pLimit - handles higher concurrency than task count cleanly', async () => {
  const limit = pLimit(10);
  const tasks = [1, 2, 3].map((n) => limit(() => n * 2));
  const results = await Promise.all(tasks);
  assert.deepEqual(results, [2, 4, 6]);
});
