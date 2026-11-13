import test from 'node:test';
import assert from 'node:assert/strict';
import { throttle } from '../utils/throttle.js';
import defaultThrottle from '../utils/throttle.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('throttle: default and named export are identical', () => {
  assert.equal(throttle, defaultThrottle);
  assert.equal(typeof throttle, 'function');
});

test('throttle: invokes immediately on leading edge by default', () => {
  let calls = 0;
  const fn = (val) => {
    calls++;
    return val * 2;
  };
  const throttled = throttle(fn, 50);

  const res1 = throttled(5);
  assert.equal(calls, 1);
  assert.equal(res1, 10);
});

test('throttle: suppresses calls within wait interval and invokes trailing with latest args', async () => {
  let callArgs = [];
  const fn = (val) => {
    callArgs.push(val);
    return val;
  };
  const throttled = throttle(fn, 60);

  throttled(1);
  throttled(2);
  throttled(3);

  assert.deepEqual(callArgs, [1]);
  assert.equal(throttled.pending(), true);

  await sleep(100);

  assert.deepEqual(callArgs, [1, 3]);
  assert.equal(throttled.pending(), false);
});

test('throttle: respects leading: false option', async () => {
  let calls = 0;
  const fn = () => ++calls;
  const throttled = throttle(fn, 60, { leading: false });

  throttled();
  assert.equal(calls, 0);
  assert.equal(throttled.pending(), true);

  await sleep(100);

  assert.equal(calls, 1);
  assert.equal(throttled.pending(), false);
});

test('throttle: respects trailing: false option', async () => {
  let callArgs = [];
  const fn = (val) => callArgs.push(val);
  const throttled = throttle(fn, 60, { trailing: false });

  throttled('first');
  throttled('second');
  throttled('third');

  assert.deepEqual(callArgs, ['first']);

  await sleep(100);

  // trailing calls should have been dropped
  assert.deepEqual(callArgs, ['first']);
  assert.equal(throttled.pending(), false);
});

test('throttle: handles both leading: false and trailing: false by not executing', async () => {
  let calls = 0;
  const fn = () => ++calls;
  const throttled = throttle(fn, 50, { leading: false, trailing: false });

  throttled();
  throttled();

  assert.equal(calls, 0);
  await sleep(80);
  assert.equal(calls, 0);
});

test('throttle: cancel() aborts pending trailing execution and resets state', async () => {
  let calls = 0;
  const fn = () => ++calls;
  const throttled = throttle(fn, 60);

  throttled();
  assert.equal(calls, 1);

  throttled();
  assert.equal(throttled.pending(), true);

  throttled.cancel();
  assert.equal(throttled.pending(), false);

  await sleep(100);
  assert.equal(calls, 1);
});

test('throttle: flush() executes pending trailing call immediately', async () => {
  let callArgs = [];
  const fn = (val) => {
    callArgs.push(val);
    return val * 10;
  };
  const throttled = throttle(fn, 100);

  throttled(1);
  throttled(2);
  assert.equal(throttled.pending(), true);

  const flushedResult = throttled.flush();
  assert.equal(flushedResult, 20);
  assert.deepEqual(callArgs, [1, 2]);
  assert.equal(throttled.pending(), false);

  // Subsequent flush when idle returns cached result without invoking
  const secondFlush = throttled.flush();
  assert.equal(secondFlush, 20);
  assert.deepEqual(callArgs, [1, 2]);

  await sleep(120);
  assert.deepEqual(callArgs, [1, 2]);
});

test('throttle: preserves dynamic this context across invocations', async () => {
  const service = {
    multiplier: 3,
    compute(x) {
      return x * this.multiplier;
    }
  };

  service.throttled = throttle(service.compute, 50);

  const res1 = service.throttled(4);
  assert.equal(res1, 12);

  service.multiplier = 10;
  service.throttled(5);

  await sleep(80);
  // trailing invocation should have executed with updated context multiplier
  assert.equal(service.throttled(2), 20);
});

test('throttle: passes all arguments properly to the target function', () => {
  let received;
  const fn = (...args) => {
    received = args;
  };
  const throttled = throttle(fn, 50);

  throttled('a', 42, { key: 'value' }, [1, 2, 3]);
  assert.deepEqual(received, ['a', 42, { key: 'value' }, [1, 2, 3]]);
});

test('throttle: propagates exceptions thrown by the target function', () => {
  const faulty = (fail) => {
    if (fail) throw new Error('Faulty execution');
    return 'ok';
  };

  // Leading edge throws synchronously
  const throttledLeading = throttle(faulty, 50);
  assert.throws(() => throttledLeading(true), {
    name: 'Error',
    message: 'Faulty execution'
  });

  // Trailing edge throws synchronously when flushed
  const throttledTrailing = throttle(faulty, 50);
  assert.equal(throttledTrailing(false), 'ok');
  throttledTrailing(true); // queued for trailing
  assert.throws(() => throttledTrailing.flush(), {
    name: 'Error',
    message: 'Faulty execution'
  });
});

test('throttle: handles non-numeric, negative, and extreme wait times gracefully', () => {
  let count = 0;
  const fn = () => ++count;

  // Negative wait clamps to 0
  const tNeg = throttle(fn, -100);
  tNeg();
  assert.equal(count, 1);

  // NaN wait clamps to 0
  const tNaN = throttle(fn, NaN);
  tNaN();
  assert.equal(count, 2);

  // Non-numeric string converts or clamps
  const tStr = throttle(fn, '50');
  tStr();
  assert.equal(count, 3);

  // Null / undefined options
  const tNullOpts = throttle(fn, 10, null);
  tNullOpts();
  assert.equal(count, 4);
});

test('throttle: throws TypeError when fn is not a function', () => {
  assert.throws(() => throttle(null), TypeError);
  assert.throws(() => throttle(undefined), TypeError);
  assert.throws(() => throttle('not-a-func'), TypeError);
  assert.throws(() => throttle(12345), TypeError);
  assert.throws(() => throttle({}), TypeError);
});

test('throttle: multiple throttled intervals operate cleanly without cross-leakage', async () => {
  let count = 0;
  const fn = () => ++count;
  const throttled = throttle(fn, 40);

  // Interval 1
  throttled();
  assert.equal(count, 1);
  await sleep(60);

  // Interval 2
  throttled();
  assert.equal(count, 2);
  await sleep(60);

  // Interval 3
  throttled();
  assert.equal(count, 3);
});

test('throttle: cancel and flush are safe no-ops when idle', () => {
  const fn = () => 'result';
  const throttled = throttle(fn, 50);

  // Calling cancel before any invocation
  assert.doesNotThrow(() => throttled.cancel());
  assert.equal(throttled.pending(), false);

  // Calling flush before any invocation returns undefined
  assert.equal(throttled.flush(), undefined);
  assert.equal(throttled.pending(), false);
});

test('throttle: handles primitive/invalid options by falling back to defaults', () => {
  let count = 0;
  const fn = () => ++count;

  const tStr = throttle(fn, 20, 'invalid-options');
  tStr();
  assert.equal(count, 1);

  const tNum = throttle(fn, 20, 12345);
  tNum();
  assert.equal(count, 2);
});

test('throttle: leading: false never executes synchronously even across multiple intervals', async () => {
  let calls = 0;
  const fn = () => ++calls;
  const throttled = throttle(fn, 50, { leading: false });

  // Interval 1
  throttled();
  assert.equal(calls, 0, 'Leading call must not execute synchronously');
  await sleep(70);
  assert.equal(calls, 1, 'Trailing call must execute after wait');

  // Interval 2
  throttled();
  assert.equal(calls, 1, 'Second cycle must not execute synchronously');
  await sleep(70);
  assert.equal(calls, 2, 'Second trailing call must execute after wait');
});

test('throttle: supports optional onError callback for safe error interception', async () => {
  let capturedError;
  const faulty = () => {
    throw new Error('Async error caught');
  };
  const throttled = throttle(faulty, 40, {
    onError: (err) => {
      capturedError = err;
    }
  });

  throttled();
  throttled();
  await sleep(70);
  assert.ok(capturedError);
  assert.equal(capturedError.message, 'Async error caught');
});

