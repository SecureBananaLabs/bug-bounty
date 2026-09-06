import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pLimit } from '../utils/pLimit.js';

describe('Asynchronous Concurrency Limiter Utility', () => {
  it('strictly limits active concurrent promises to concurrency limit', async () => {
    const limit = pLimit(2);
    let running = 0;
    let maxRunning = 0;

    const task = async (ms) => {
      return limit(async () => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await new Promise((r) => setTimeout(r, ms));
        running--;
      });
    };

    await Promise.all([task(30), task(30), task(30), task(30)]);

    assert.equal(maxRunning, 2);
    assert.equal(running, 0);
  });

  it('reports accurate activeCount and pendingCount', async () => {
    const limit = pLimit(1);

    const p1 = limit(() => new Promise((r) => setTimeout(r, 40)));
    const p2 = limit(() => new Promise((r) => setTimeout(r, 40)));

    assert.equal(limit.activeCount, 1);
    assert.equal(limit.pendingCount, 1);

    await Promise.all([p1, p2]);

    assert.equal(limit.activeCount, 0);
    assert.equal(limit.pendingCount, 0);
  });

  it('propagates errors cleanly without stalling the queue', async () => {
    const limit = pLimit(1);

    await assert.rejects(
      () => limit(async () => { throw new Error('task error'); }),
      { message: 'task error' }
    );

    const result = await limit(async () => 'next task ok');
    assert.equal(result, 'next task ok');
  });
});
