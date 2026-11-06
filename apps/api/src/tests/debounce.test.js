import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { debounce } from '../utils/debounce.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe('debounce defensive utility (ref #743)', () => {
  it('collapses rapid calls into one trailing invocation with the last args', async () => {
    const calls = [];
    const d = debounce((x) => calls.push(x), 30);
    d(1);
    d(2);
    d(3);
    assert.equal(d.pending(), true);
    await sleep(70);
    assert.deepEqual(calls, [3]);
    assert.equal(d.pending(), false);
  });

  it('supports leading edge without duplicating a single call on trailing', async () => {
    const calls = [];
    const d = debounce((x) => calls.push(x), 30, { leading: true });
    d('a');
    assert.deepEqual(calls, ['a']);
    await sleep(70);
    assert.deepEqual(calls, ['a']);
  });

  it('leading + trailing fires again when called more than once', async () => {
    const calls = [];
    const d = debounce((x) => calls.push(x), 30, { leading: true });
    d('a');
    d('b');
    await sleep(70);
    assert.deepEqual(calls, ['a', 'b']);
  });

  it('trailing:false and leading:false never invokes', async () => {
    let n = 0;
    const d = debounce(() => n++, 20, { trailing: false });
    d();
    await sleep(50);
    assert.equal(n, 0);
  });

  it('cancel drops the pending invocation', async () => {
    let n = 0;
    const d = debounce(() => n++, 20);
    d();
    d.cancel();
    assert.equal(d.pending(), false);
    await sleep(50);
    assert.equal(n, 0);
  });

  it('flush invokes immediately and returns the result', () => {
    const d = debounce((x) => x * 2, 1000);
    d(21);
    assert.equal(d.flush(), 42);
    assert.equal(d.pending(), false);
  });

  it('flush with nothing pending returns last result and does not invoke', () => {
    let n = 0;
    const d = debounce(() => ++n, 1000);
    assert.equal(d.flush(), undefined);
    assert.equal(n, 0);
  });

  it('maxWait forces an invocation during continuous calls', async () => {
    const calls = [];
    const d = debounce((x) => calls.push(x), 40, { maxWait: 60 });
    const start = Date.now();
    let i = 0;
    while (Date.now() - start < 130) {
      d(i++);
      await sleep(10);
    }
    d.cancel();
    assert.ok(calls.length >= 1, 'maxWait should have fired at least once');
  });

  it('preserves this context', async () => {
    const obj = { v: 7, run: debounce(function () { return this.v; }, 10) };
    obj.run();
    assert.equal(obj.run.flush(), 7);
  });

  it('routes timer-driven errors to onError instead of crashing the process', async () => {
    const errors = [];
    const d = debounce(() => { throw new Error('boom'); }, 10, { onError: (e) => errors.push(e.message) });
    d();
    await sleep(40);
    assert.deepEqual(errors, ['boom']);
  });

  it('flush propagates errors synchronously', () => {
    const d = debounce(() => { throw new Error('sync boom'); }, 1000);
    d();
    assert.throws(() => d.flush(), /sync boom/);
  });

  it('validates arguments', () => {
    assert.throws(() => debounce(null, 10), TypeError);
    assert.throws(() => debounce(() => {}, -1), TypeError);
    assert.throws(() => debounce(() => {}, NaN), TypeError);
    assert.throws(() => debounce(() => {}, Infinity), TypeError);
    assert.throws(() => debounce(() => {}, '10'), TypeError);
    assert.throws(() => debounce(() => {}, 10, 'x'), TypeError);
    assert.throws(() => debounce(() => {}, 10, { maxWait: -5 }), TypeError);
    assert.throws(() => debounce(() => {}, 10, { onError: 5 }), TypeError);
    assert.doesNotThrow(() => debounce(() => {}, 10, null));
  });
});
