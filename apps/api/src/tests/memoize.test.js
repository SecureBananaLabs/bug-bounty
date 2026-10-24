import test from 'node:test';
import assert from 'node:assert/strict';
import { memoize } from '../utils/memoize.js';

test('memoize: memoizes function results for identical arguments', () => {
  let callCount = 0;
  const square = (n) => {
    callCount++;
    return n * n;
  };

  const memoized = memoize(square);

  assert.equal(memoized(4), 16);
  assert.equal(memoized(4), 16);
  assert.equal(callCount, 1);

  assert.equal(memoized(5), 25);
  assert.equal(callCount, 2);
  assert.equal(memoized(5), 25);
  assert.equal(callCount, 2);
});

test('memoize: handles zero-argument functions safely', () => {
  let counter = 0;
  const generate = () => ++counter;
  const memoized = memoize(generate);

  assert.equal(memoized(), 1);
  assert.equal(memoized(), 1);
  assert.equal(counter, 1);
});

test('memoize: uses custom resolver for key computation', () => {
  let callCount = 0;
  const add = (a, b) => {
    callCount++;
    return a + b;
  };

  const memoized = memoize(add, (a, b) => `${a}:${b}`);

  assert.equal(memoized(2, 3), 5);
  assert.equal(memoized(2, 3), 5);
  assert.equal(callCount, 1);

  assert.equal(memoized(3, 2), 5);
  assert.equal(callCount, 2);
});

test('memoize: supports passing options as second argument memoize(fn, options)', () => {
  let calls = 0;
  const fn = (x) => { calls++; return x * 2; };
  const memoized = memoize(fn, { maxSize: 10 });

  assert.equal(memoized(3), 6);
  assert.equal(memoized(3), 6);
  assert.equal(calls, 1);
});

test('memoize: enforces LRU eviction when maxSize is exceeded', () => {
  let calls = 0;
  const fn = (x) => { calls++; return `res:${x}`; };
  const evicted = [];

  const memoized = memoize(fn, {
    maxSize: 3,
    onEvict: (k, v) => evicted.push({ k, v })
  });

  memoized(1); // cache: [1]
  memoized(2); // cache: [1, 2]
  memoized(3); // cache: [1, 2, 3]
  assert.equal(memoized.cache.size, 3);

  // Accessing 4 should evict 1
  memoized(4);
  assert.equal(memoized.cache.size, 3);
  assert.equal(evicted.length, 1);
  assert.equal(evicted[0].k, 1);
  assert.equal(evicted[0].v, 'res:1');

  // Calling 1 again triggers re-computation
  assert.equal(calls, 4);
  memoized(1);
  assert.equal(calls, 5);
});

test('memoize: refreshes LRU order on hit so accessed items survive eviction', () => {
  const fn = (x) => x;
  const memoized = memoize(fn, { maxSize: 3 });

  memoized('a'); // order: a
  memoized('b'); // order: a, b
  memoized('c'); // order: a, b, c

  // Read 'a' -> should refresh 'a' to most recent: order: b, c, a
  assert.equal(memoized('a'), 'a');

  // Insert 'd' -> should evict 'b' (oldest) instead of 'a'
  memoized('d');

  assert.equal(memoized.cache.has('a'), true);
  assert.equal(memoized.cache.has('b'), false);
  assert.equal(memoized.cache.has('c'), true);
  assert.equal(memoized.cache.has('d'), true);
});

test('memoize: TTL expiration re-computes expired entries', async () => {
  let calls = 0;
  const fn = (x) => { calls++; return x * 10; };

  const memoized = memoize(fn, { ttlMs: 40 });

  assert.equal(memoized(5), 50);
  assert.equal(calls, 1);
  assert.equal(memoized(5), 50);
  assert.equal(calls, 1);

  // Wait for TTL to expire
  await new Promise((r) => setTimeout(r, 60));

  assert.equal(memoized.cache.has(5), false);
  assert.equal(memoized(5), 50);
  assert.equal(calls, 2);
});

test('memoize: resolver defense catches errors in non-strict mode and falls back', () => {
  let calls = 0;
  const fn = (x) => { calls++; return x; };
  const faultyResolver = () => {
    throw new Error('Resolver crash');
  };

  const memoized = memoize(fn, faultyResolver, { strict: false });

  // Does not crash, falls back to args[0]
  assert.equal(memoized('safe-key'), 'safe-key');
  assert.equal(memoized('safe-key'), 'safe-key');
  assert.equal(calls, 1);
});

test('memoize: resolver error propagates in strict mode', () => {
  const fn = (x) => x;
  const faultyResolver = () => { throw new Error('Resolver crash'); };
  const memoized = memoize(fn, faultyResolver, { strict: true });

  assert.throws(() => memoized('key'), /Resolver crash/);
});

test('memoize: supports object references and Symbol keys natively', () => {
  const fn = (obj) => ({ count: Object.keys(obj).length });
  const memoized = memoize(fn);

  const objA = { x: 1 };
  const objB = { x: 1 };

  const resA1 = memoized(objA);
  const resA2 = memoized(objA);
  assert.equal(resA1, resA2); // same cached instance

  const resB = memoized(objB);
  assert.notEqual(resA1, resB); // distinct object identity
});

test('memoize: preserves this context', () => {
  const service = {
    multiplier: 10,
    calculate(n) {
      return n * this.multiplier;
    }
  };

  service.calculate = memoize(service.calculate);
  assert.equal(service.calculate(3), 30);
  assert.equal(service.calculate(3), 30);
});

test('memoize: cache methods clear, delete, get, has, set, size work properly', () => {
  const fn = (x) => x * 2;
  const memoized = memoize(fn);

  memoized(10);
  assert.equal(memoized.cache.has(10), true);
  assert.equal(memoized.cache.get(10), 20);
  assert.equal(memoized.cache.size, 1);

  // Manual set
  memoized.cache.set(99, 198);
  assert.equal(memoized.cache.get(99), 198);
  assert.equal(memoized.cache.size, 2);

  // Delete
  assert.equal(memoized.cache.delete(10), true);
  assert.equal(memoized.cache.has(10), false);
  assert.equal(memoized.cache.size, 1);

  // Clear
  memoized.cache.clear();
  assert.equal(memoized.cache.size, 0);
  assert.equal(memoized.cache.get(99), undefined);
});

test('memoize: input validations and strict mode', () => {
  assert.throws(() => memoize(null), TypeError);
  assert.throws(() => memoize(123), TypeError);
  assert.throws(() => memoize('string'), TypeError);
  assert.throws(() => memoize(() => {}, 123, null), TypeError);

  // Strict mode validations
  assert.throws(() => memoize(() => {}, 'not-a-func', { strict: true }), TypeError);
  assert.throws(() => memoize(() => {}, { maxSize: 0, strict: true }), TypeError);
  assert.throws(() => memoize(() => {}, { ttlMs: -10, strict: true }), TypeError);
});
