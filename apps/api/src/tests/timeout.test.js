import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { withTimeout, delay, TimeoutError } from '../utils/timeout.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe('timeout utilities (ref #743)', () => {
  it('resolves when the promise settles first', async () => {
    assert.equal(await withTimeout(sleep(10).then(() => 'ok'), 200), 'ok');
  });

  it('accepts a function returning a promise', async () => {
    assert.equal(await withTimeout(() => Promise.resolve(5), 100), 5);
  });

  it('rejects with TimeoutError when too slow', async () => {
    await assert.rejects(withTimeout(sleep(100), 20), (e) => {
      assert.ok(e instanceof TimeoutError);
      assert.equal(e.code, 'ETIMEDOUT');
      assert.equal(e.timeout, 20);
      return true;
    });
  });

  it('uses custom message and fallback', async () => {
    await assert.rejects(withTimeout(sleep(100), 10, { message: 'slow db' }), /slow db/);
    assert.equal(await withTimeout(sleep(100), 10, { fallback: () => 'default' }), 'default');
  });

  it('propagates rejection of the input promise', async () => {
    await assert.rejects(withTimeout(Promise.reject(new Error('bad')), 50), /bad/);
  });

  it('captures synchronous throws from the input function', async () => {
    await assert.rejects(withTimeout(() => { throw new Error('sync'); }, 50), /sync/);
  });

  it('fallback that throws rejects instead of crashing', async () => {
    await assert.rejects(withTimeout(sleep(100), 10, { fallback: () => { throw new Error('fb'); } }), /fb/);
  });

  it('rejects immediately with a pre-aborted signal and does not call the function', async () => {
    const ac = new AbortController();
    ac.abort();
    let called = false;
    await assert.rejects(withTimeout(() => { called = true; return 1; }, 50, { signal: ac.signal }));
    assert.equal(called, false);
  });

  it('rejects when signal aborts mid-flight', async () => {
    const ac = new AbortController();
    const p = withTimeout(sleep(200), 500, { signal: ac.signal });
    setTimeout(() => ac.abort(new Error('stop')), 10);
    await assert.rejects(p, /stop/);
  });

  it('does not leak timers (process is not held open after settle)', async () => {
    const start = Date.now();
    await withTimeout(Promise.resolve(1), 5000);
    assert.ok(Date.now() - start < 500);
  });

  it('delay resolves with value and honours abort', async () => {
    assert.equal(await delay(10, { value: 'v' }), 'v');
    const ac = new AbortController();
    const p = delay(500, { signal: ac.signal });
    ac.abort();
    await assert.rejects(p);
  });

  it('validates arguments', () => {
    assert.throws(() => withTimeout(Promise.resolve(), -1), TypeError);
    assert.throws(() => withTimeout(Promise.resolve(), NaN), TypeError);
    assert.throws(() => withTimeout(Promise.resolve(), '5'), TypeError);
    assert.throws(() => withTimeout(42, 10), TypeError);
    assert.throws(() => withTimeout(Promise.resolve(), 10, 'x'), TypeError);
    assert.throws(() => withTimeout(Promise.resolve(), 10, { signal: {} }), TypeError);
    assert.throws(() => withTimeout(Promise.resolve(), 10, { fallback: 1 }), TypeError);
    assert.throws(() => delay(Infinity), TypeError);
  });
});
