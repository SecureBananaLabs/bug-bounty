import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { memoizeAsync } from '../utils/memoizeAsync.js';

describe('Async Memoize with TTL Utility (memoizeAsync)', () => {
  it('caches async results and avoids duplicate function invocations within TTL', async () => {
    let callCount = 0;
    const fetchUser = memoizeAsync(
      async (id) => {
        callCount++;
        return { id, name: `User_${id}` };
      },
      { ttlMs: 1000 }
    );

    const r1 = await fetchUser(101);
    const r2 = await fetchUser(101);

    assert.deepEqual(r1, { id: 101, name: 'User_101' });
    assert.deepEqual(r2, { id: 101, name: 'User_101' });
    assert.equal(callCount, 1);
  });

  it('re-computes value after TTL expires', async () => {
    let callCount = 0;
    const fetchMetric = memoizeAsync(
      async (tag) => {
        callCount++;
        return `${tag}:${callCount}`;
      },
      { ttlMs: 35 }
    );

    const first = await fetchMetric('cpu');
    assert.equal(first, 'cpu:1');

    await new Promise((resolve) => setTimeout(resolve, 60));

    const second = await fetchMetric('cpu');
    assert.equal(second, 'cpu:2');
    assert.equal(callCount, 2);
  });

  it('supports custom keyResolver and manual invalidation (.deleteKey and .clear)', async () => {
    let count = 0;
    const loadProfile = memoizeAsync(
      async (user) => {
        count++;
        return { id: user.id, seq: count };
      },
      {
        ttlMs: 5000,
        keyResolver: (user) => `user:${user.id}`
      }
    );

    const a1 = await loadProfile({ id: 7 });
    const a2 = await loadProfile({ id: 7 });
    assert.equal(a1.seq, 1);
    assert.equal(a2.seq, 1);

    assert.equal(loadProfile.deleteKey('user:7'), true);
    const a3 = await loadProfile({ id: 7 });
    assert.equal(a3.seq, 2);

    loadProfile.clear();
    assert.equal(loadProfile.size(), 0);
  });

  it('evicts rejected promises immediately so subsequent retries can succeed', async () => {
    let attempts = 0;
    const flakyTask = memoizeAsync(async () => {
      attempts++;
      if (attempts === 1) {
        throw new Error('Transient RPC failure');
      }
      return 'recovered';
    });

    await assert.rejects(() => flakyTask(), /Transient RPC failure/);
    const res = await flakyTask();
    assert.equal(res, 'recovered');
    assert.equal(attempts, 2);
  });

  it('throws TypeError when passed a non-function argument', () => {
    assert.throws(() => memoizeAsync(null), TypeError);
  });
});
