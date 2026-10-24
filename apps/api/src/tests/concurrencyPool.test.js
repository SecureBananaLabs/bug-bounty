import { describe, it } from 'node:test';
import assert from 'node:assert';
import { concurrencyPool } from '../utils/concurrencyPool.js';

describe('concurrencyPool utility', () => {
  it('enforces strictly bounded concurrency limit (CWE-400)', async () => {
    let activeWorkers = 0;
    let peakConcurrency = 0;

    const createTask = (id, durationMs) => async () => {
      activeWorkers++;
      if (activeWorkers > peakConcurrency) {
        peakConcurrency = activeWorkers;
      }
      await new Promise((r) => setTimeout(r, durationMs));
      activeWorkers--;
      return `result-${id}`;
    };

    const tasks = [
      createTask(1, 30),
      createTask(2, 30),
      createTask(3, 30),
      createTask(4, 30),
      createTask(5, 30),
      createTask(6, 30),
    ];

    const results = await concurrencyPool(tasks, 2);

    assert.strictEqual(peakConcurrency, 2);
    assert.strictEqual(results.length, 6);
    assert.deepStrictEqual(results, [
      'result-1',
      'result-2',
      'result-3',
      'result-4',
      'result-5',
      'result-6',
    ]);
  });

  it('guarantees result ordering regardless of task completion order', async () => {
    // Task 0 takes 50ms, Task 1 takes 10ms, Task 2 takes 5ms
    const tasks = [
      () => new Promise((r) => setTimeout(() => r('slow'), 40)),
      () => new Promise((r) => setTimeout(() => r('fast'), 10)),
      () => new Promise((r) => setTimeout(() => r('faster'), 5)),
    ];

    const results = await concurrencyPool(tasks, 3);
    assert.deepStrictEqual(results, ['slow', 'fast', 'faster']);
  });

  it('handles empty task list resolving immediately to an empty array', async () => {
    const res = await concurrencyPool([], 3);
    assert.deepStrictEqual(res, []);
  });

  it('handles limit greater than tasks count seamlessly', async () => {
    const tasks = [() => 'a', () => 'b'];
    const res = await concurrencyPool(tasks, 10);
    assert.deepStrictEqual(res, ['a', 'b']);
  });

  it('handles synchronous task returns and synchronous exceptions', async () => {
    const tasks = [
      () => 42,
      () => Promise.resolve('async-val'),
      () => {
        throw new Error('Sync crash');
      },
    ];

    await assert.rejects(
      () => concurrencyPool(tasks, 2),
      /Sync crash/
    );
  });

  it('rejects immediately on first failure in firstRejection mode (default)', async () => {
    let unstartedRan = false;

    const tasks = [
      () => Promise.reject(new Error('Immediate fail')),
      async () => {
        await new Promise((r) => setTimeout(r, 100));
        unstartedRan = true;
        return 'unwanted';
      },
    ];

    await assert.rejects(
      () => concurrencyPool(tasks, 1),
      /Immediate fail/
    );

    assert.strictEqual(unstartedRan, false);
  });

  it('supports allSettled mode collecting full results and reasons', async () => {
    const tasks = [
      () => Promise.resolve('success-1'),
      () => Promise.reject(new Error('error-2')),
      () => 'success-3',
    ];

    const results = await concurrencyPool(tasks, 2, { mode: 'allSettled' });

    assert.strictEqual(results.length, 3);
    assert.strictEqual(results[0].status, 'fulfilled');
    assert.strictEqual(results[0].value, 'success-1');
    assert.strictEqual(results[1].status, 'rejected');
    assert.strictEqual(results[1].reason.message, 'error-2');
    assert.strictEqual(results[2].status, 'fulfilled');
    assert.strictEqual(results[2].value, 'success-3');
  });

  it('rejects immediately if signal is already aborted prior to call', async () => {
    const controller = new AbortController();
    controller.abort(new Error('Pre-aborted signal'));

    let taskExecuted = false;
    const tasks = [
      () => {
        taskExecuted = true;
        return 1;
      },
    ];

    await assert.rejects(
      () => concurrencyPool(tasks, 2, { signal: controller.signal }),
      /Pre-aborted signal/
    );
    assert.strictEqual(taskExecuted, false);
  });

  it('cancels remaining tasks when AbortSignal triggers mid-flight (firstRejection)', async () => {
    const controller = new AbortController();
    let unstartedRan = false;

    const tasks = [
      async () => {
        await new Promise((r) => setTimeout(r, 10));
        controller.abort(new Error('Mid-flight abort'));
        return 'done-first';
      },
      async () => {
        await new Promise((r) => setTimeout(r, 50));
        unstartedRan = true;
        return 'should-not-run';
      },
    ];

    await assert.rejects(
      () => concurrencyPool(tasks, 1, { signal: controller.signal }),
      /Mid-flight abort/
    );

    assert.strictEqual(unstartedRan, false);
  });

  it('marks unstarted tasks as rejected in allSettled mode when aborted mid-flight', async () => {
    const controller = new AbortController();

    const tasks = [
      async () => {
        await new Promise((r) => setTimeout(r, 10));
        controller.abort(new Error('Cancelled rest'));
        return 'task-0';
      },
      async () => 'task-1',
      async () => 'task-2',
    ];

    const results = await concurrencyPool(tasks, 1, {
      mode: 'allSettled',
      signal: controller.signal,
    });

    assert.strictEqual(results[0].status, 'fulfilled');
    assert.strictEqual(results[0].value, 'task-0');
    assert.strictEqual(results[1].status, 'rejected');
    assert.strictEqual(results[1].reason.message, 'Cancelled rest');
    assert.strictEqual(results[2].status, 'rejected');
    assert.strictEqual(results[2].reason.message, 'Cancelled rest');
  });

  it('invokes onProgress callback for each completed task safely', async () => {
    const progressReports = [];
    const onProgress = (p) => {
      progressReports.push({ ...p });
    };

    const tasks = [() => 'a', () => 'b', () => 'c'];

    await concurrencyPool(tasks, 2, { onProgress });

    assert.strictEqual(progressReports.length, 3);
    assert.strictEqual(progressReports[2].completed, 3);
  });

  it('provides concurrencyPool.all and concurrencyPool.allSettled helpers', async () => {
    const tasks = [() => 10, () => 20];
    const allRes = await concurrencyPool.all(tasks, 2);
    assert.deepStrictEqual(allRes, [10, 20]);

    const settledRes = await concurrencyPool.allSettled(tasks, 2);
    assert.strictEqual(settledRes[0].status, 'fulfilled');
    assert.strictEqual(settledRes[0].value, 10);
  });

  it('provides concurrencyPool.map helper for bounded concurrent mapping', async () => {
    const numbers = [1, 2, 3, 4];
    const mapped = await concurrencyPool.map(numbers, async (n) => n * 10, 2);
    assert.deepStrictEqual(mapped, [10, 20, 30, 40]);
  });

  it('validates input arguments defensively (CWE-1287)', async () => {
    await assert.rejects(() => concurrencyPool(null, 2), TypeError);
    await assert.rejects(() => concurrencyPool(1234, 2), TypeError);
    await assert.rejects(() => concurrencyPool([() => 1], 0), RangeError);
    await assert.rejects(() => concurrencyPool([() => 1], -5), RangeError);
    await assert.rejects(() => concurrencyPool([() => 1], 1.5), TypeError);
    await assert.rejects(() => concurrencyPool([() => 1], 'two'), TypeError);
    await assert.rejects(() => concurrencyPool([() => 1], 2, 'invalid-options'), TypeError);
    await assert.rejects(
      () => concurrencyPool([() => 1], 2, { mode: 'invalid-mode' }),
      TypeError
    );
    await assert.rejects(
      () => concurrencyPool(['not-a-fn'], 2),
      TypeError
    );
    await assert.rejects(
      () => concurrencyPool.all([() => 1], 2, 'invalid-options'),
      TypeError
    );
    await assert.rejects(
      () => concurrencyPool.allSettled([() => 1], 2, 'invalid-options'),
      TypeError
    );
    await assert.rejects(
      () => concurrencyPool.map([1, 2], (x) => x, 2, 'invalid-options'),
      TypeError
    );
  });

  it('settles tasks as rejected in allSettled mode when signal is pre-aborted', async () => {
    const controller = new AbortController();
    controller.abort(new Error('Pre-aborted settle test'));

    const tasks = [() => 'a', () => 'b'];
    const results = await concurrencyPool(tasks, 2, {
      signal: controller.signal,
      mode: 'allSettled',
    });

    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].status, 'rejected');
    assert.strictEqual(results[0].reason.message, 'Pre-aborted settle test');
    assert.strictEqual(results[1].status, 'rejected');
    assert.strictEqual(results[1].reason.message, 'Pre-aborted settle test');
  });

  it('supports custom iterable generators as task sources seamlessly', async () => {
    function* taskGen() {
      yield () => 'gen-1';
      yield () => 'gen-2';
      yield () => 'gen-3';
    }

    const results = await concurrencyPool(taskGen(), 2);
    assert.deepStrictEqual(results, ['gen-1', 'gen-2', 'gen-3']);
  });
});
