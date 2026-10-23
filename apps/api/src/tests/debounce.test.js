import test from 'node:test';
import assert from 'node:assert/strict';
import { debounce } from '../utils/debounce.js';

test('debounce - basic delayed trailing execution', async () => {
  let callCount = 0;
  let lastArg = null;
  const fn = debounce((val) => {
    callCount += 1;
    lastArg = val;
    return val * 2;
  }, 50);

  assert.equal(typeof fn.cancel, 'function');
  assert.equal(typeof fn.flush, 'function');
  assert.equal(typeof fn.pending, 'function');
  assert.equal(fn.pending(), false);

  fn(1);
  assert.equal(callCount, 0, 'Should not execute immediately on trailing edge');
  assert.equal(fn.pending(), true, 'Should be pending after call');

  await new Promise((resolve) => setTimeout(resolve, 80));

  assert.equal(callCount, 1, 'Should execute once after waitMs');
  assert.equal(lastArg, 1);
  assert.equal(fn.pending(), false, 'Should no longer be pending');
});

test('debounce - rapid repeated calls debounce to single trailing execution', async () => {
  let callCount = 0;
  let lastArg = null;
  const fn = debounce((val) => {
    callCount += 1;
    lastArg = val;
  }, 60);

  fn(1);
  fn(2);
  fn(3);

  assert.equal(callCount, 0);

  await new Promise((resolve) => setTimeout(resolve, 30));
  fn(4); // resets timer

  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(callCount, 0, 'Still within reset wait window');

  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(callCount, 1, 'Should have executed exactly once');
  assert.equal(lastArg, 4, 'Should execute with latest arguments');
});

test('debounce - leading edge execution (leading: true, trailing: false)', async () => {
  let callCount = 0;
  let lastArg = null;
  const fn = debounce(
    (val) => {
      callCount += 1;
      lastArg = val;
      return `result-${val}`;
    },
    50,
    { leading: true, trailing: false }
  );

  const res1 = fn(100);
  assert.equal(callCount, 1, 'Should invoke immediately on leading edge');
  assert.equal(lastArg, 100);
  assert.equal(res1, 'result-100');

  // Rapid subsequent call within wait window
  const res2 = fn(200);
  assert.equal(callCount, 1, 'Subsequent call should be suppressed');
  assert.equal(res2, 'result-100', 'Should return previous cached result');

  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(callCount, 1, 'Should not execute trailing call when trailing: false');

  // Call after timeout window should trigger new leading execution
  fn(300);
  assert.equal(callCount, 2, 'New window should trigger leading call');
  assert.equal(lastArg, 300);
});

test('debounce - both leading and trailing enabled', async () => {
  let callCount = 0;
  const history = [];
  const fn = debounce(
    (val) => {
      callCount += 1;
      history.push(val);
    },
    50,
    { leading: true, trailing: true }
  );

  fn('first');
  assert.equal(callCount, 1);
  assert.deepEqual(history, ['first']);

  fn('second');
  fn('third');
  assert.equal(callCount, 1);

  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(callCount, 2, 'Trailing edge should also fire for subsequent calls');
  assert.deepEqual(history, ['first', 'third']);
});

test('debounce - cancel() aborts pending execution', async () => {
  let callCount = 0;
  const fn = debounce(() => {
    callCount += 1;
  }, 50);

  fn();
  assert.equal(fn.pending(), true);
  fn.cancel();
  assert.equal(fn.pending(), false);

  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(callCount, 0, 'Callback should not be invoked after cancel');
});

test('debounce - flush() immediately executes pending call and returns result', async () => {
  let callCount = 0;
  const fn = debounce((num) => {
    callCount += 1;
    return num * 10;
  }, 100);

  fn(5);
  assert.equal(callCount, 0);
  assert.equal(fn.pending(), true);

  const flushedResult = fn.flush();
  assert.equal(callCount, 1);
  assert.equal(flushedResult, 50);
  assert.equal(fn.pending(), false);

  // Calling flush again when idle should return last cached result without re-invoking
  const secondFlush = fn.flush();
  assert.equal(callCount, 1);
  assert.equal(secondFlush, 50);

  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.equal(callCount, 1, 'Timer should not re-invoke after flush');
});

test('debounce - preserves `this` context and arguments', async () => {
  const contextObj = {
    multiplier: 3,
    compute: debounce(function (a, b) {
      return (a + b) * this.multiplier;
    }, 30),
  };

  contextObj.compute(2, 4);
  const result = contextObj.compute.flush();
  assert.equal(result, 18, 'Context `this` and arguments should be preserved');
});

test('debounce - maxWait option enforces execution within upper time bound', async () => {
  let callCount = 0;
  const fn = debounce(
    () => {
      callCount += 1;
    },
    40,
    { maxWait: 80 }
  );

  fn();
  await new Promise((resolve) => setTimeout(resolve, 25));
  fn();
  await new Promise((resolve) => setTimeout(resolve, 25));
  fn();
  await new Promise((resolve) => setTimeout(resolve, 25));
  fn();

  // At ~75-80ms elapsed since first call, maxWait should trigger execution
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.ok(callCount >= 1, 'maxWait should have forced at least one execution');
});

test('debounce - validation and resilient edge cases', () => {
  assert.throws(
    () => debounce(null),
    {
      name: 'TypeError',
      message: 'Expected a function',
    },
    'Should throw TypeError when func is not a function'
  );

  assert.throws(
    () => debounce('string'),
    {
      name: 'TypeError',
      message: 'Expected a function',
    }
  );

  // Resilient handling of invalid/negative/NaN wait values
  let executed = false;
  const fnZero = debounce(() => {
    executed = true;
  }, -50);
  fnZero();
  fnZero.flush();
  assert.equal(executed, true);

  const fnNaN = debounce(() => {}, NaN);
  assert.equal(typeof fnNaN, 'function');
});
