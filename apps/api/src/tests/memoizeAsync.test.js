import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { memoizeAsync } from '../utils/memoizeAsync.js';

describe('Async Memoize with TTL Utility', () => {
  it('caches async results and avoids duplicate function invocations', async () => {
    let callCount = 0;
    const fetchUser = memoizeAsync(async (id) => {
      callCount++;
      return { id, name: `User_${id}` };
    }, { ttlMs: 1000 });

    const r1 = await fetchUser(101);
    const r2 = await fetchUser(101);

    assert.deepEqual(r1, { id: 101, name: 'User_101' });
    assert.deepEqual(r2, { id: 101, name: 'User_101' });
    assert.equal(callCount, 1);
  });

  it('re-executes underlying function after TTL expiration', async () => {
    let callCount = 0;
    const compute = memoizeAsync(async (x) => {
      callCount++;
      return x * 2;
    }, { ttlMs: 30 });

    const v1 = await compute(5);
    assert.equal(v1, 10);
    assert.equal(callCount, 1);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const v2 = await compute(5);
    assert.equal(v2, 10);
    assert.equal(callCount, 2);
  });

  it('supports explicit cache clearing via .clear()', async () => {
    let callCount = 0;
    const compute = memoizeAsync(async () => {
      callCount++;
      return 'data';
    }, { ttlMs: 5000 });

    await compute();
    assert.equal(callCount, 1);

    compute.clear();
    await compute();
    assert.equal(callCount, 2);
  });
});
