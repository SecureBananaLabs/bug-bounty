import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { once } from '../utils/once.js';

describe('once defensive utility (ref #743)', () => {
  it('invokes wrapped function only once and idempotently returns cached result', () => {
    let callCount = 0;
    const add = (a, b) => {
      callCount++;
      return a + b;
    };

    const onceAdd = once(add);
    assert.strictEqual(onceAdd.called, false);
    assert.strictEqual(onceAdd.result, undefined);

    const first = onceAdd(10, 20);
    assert.strictEqual(first, 30);
    assert.strictEqual(callCount, 1);
    assert.strictEqual(onceAdd.called, true);
    assert.strictEqual(onceAdd.result, 30);

    // Subsequent invocations return cached result without re-executing fn
    const second = onceAdd(100, 200);
    assert.strictEqual(second, 30);
    assert.strictEqual(callCount, 1);

    const third = onceAdd();
    assert.strictEqual(third, 30);
    assert.strictEqual(callCount, 1);
  });

  it('preserves context (this) on invocation', () => {
    const service = {
      prefix: 'KEY:',
      count: 0,
      generateId: once(function (suffix) {
        this.count++;
        return `${this.prefix}${suffix}`;
      }),
    };

    const id1 = service.generateId('user_1');
    assert.strictEqual(id1, 'KEY:user_1');
    assert.strictEqual(service.count, 1);

    const id2 = service.generateId('user_2');
    assert.strictEqual(id2, 'KEY:user_1');
    assert.strictEqual(service.count, 1);
  });

  it('supports explicit thisArg option', () => {
    const customContext = { name: 'boundContext' };
    const fn = once(
      function () {
        return this.name;
      },
      { thisArg: customContext }
    );

    const result = fn.call({ name: 'ignoredContext' });
    assert.strictEqual(result, 'boundContext');
  });

  it('caches exceptions and re-throws them idempotently on subsequent calls (rethrow: true default)', () => {
    let execCount = 0;
    const failFn = () => {
      execCount++;
      throw new Error(`Failure code ${execCount}`);
    };

    const onceFail = once(failFn);
    assert.strictEqual(onceFail.hasError, false);

    // First call throws
    assert.throws(() => onceFail(), /Failure code 1/);
    assert.strictEqual(execCount, 1);
    assert.strictEqual(onceFail.called, true);
    assert.strictEqual(onceFail.hasError, true);
    assert.strictEqual(onceFail.error.message, 'Failure code 1');

    // Second call re-throws the exact same cached exception without re-running failFn (CWE-755)
    assert.throws(() => onceFail(), /Failure code 1/);
    assert.strictEqual(execCount, 1);

    // Third call also re-throws without executing
    assert.throws(() => onceFail(), /Failure code 1/);
    assert.strictEqual(execCount, 1);
  });

  it('suppresses re-throwing on subsequent calls when rethrow: false', () => {
    let execCount = 0;
    const failFn = () => {
      execCount++;
      throw new Error('Initial crash');
    };

    const onceFail = once(failFn, { rethrow: false });

    // First call throws
    assert.throws(() => onceFail(), /Initial crash/);
    assert.strictEqual(execCount, 1);

    // Second call does NOT throw, returns undefined
    const res = onceFail();
    assert.strictEqual(res, undefined);
    assert.strictEqual(execCount, 1);
  });

  it('allows retry when retryOnError: true', () => {
    let attempts = 0;
    const flakyService = () => {
      attempts++;
      if (attempts < 3) {
        throw new Error(`Attempt ${attempts} failed`);
      }
      return 'Connected successfully';
    };

    const onceFlaky = once(flakyService, { retryOnError: true });

    // Attempt 1 fails
    assert.throws(() => onceFlaky(), /Attempt 1 failed/);
    assert.strictEqual(onceFlaky.called, false);

    // Attempt 2 fails
    assert.throws(() => onceFlaky(), /Attempt 2 failed/);
    assert.strictEqual(onceFlaky.called, false);

    // Attempt 3 succeeds
    const successResult = onceFlaky();
    assert.strictEqual(successResult, 'Connected successfully');
    assert.strictEqual(onceFlaky.called, true);
    assert.strictEqual(attempts, 3);

    // Subsequent calls return cached result without further executions
    const nextResult = onceFlaky();
    assert.strictEqual(nextResult, 'Connected successfully');
    assert.strictEqual(attempts, 3);
  });

  it('supports wrapper reset capability', () => {
    let runs = 0;
    const runner = once(() => ++runs);

    assert.strictEqual(runner(), 1);
    assert.strictEqual(runner(), 1);

    runner.reset();
    assert.strictEqual(runner.called, false);
    assert.strictEqual(runner.result, undefined);

    assert.strictEqual(runner(), 2);
    assert.strictEqual(runner(), 2);
  });

  it('supports freezeResult option to prevent result tampering', () => {
    const createConfig = once(
      () => ({
        port: 3000,
        env: 'production',
      }),
      { freezeResult: true }
    );

    const config = createConfig();
    assert.strictEqual(Object.isFrozen(config), true);
    assert.throws(() => {
      config.port = 8080;
    }, TypeError);
  });

  it('exposes original fn reference via .fn property', () => {
    const original = (x) => x * 2;
    const wrapped = once(original);
    assert.strictEqual(wrapped.fn, original);
  });

  it('validates fn and options argument types', () => {
    assert.throws(() => once(null), TypeError);
    assert.throws(() => once(undefined), TypeError);
    assert.throws(() => once(123), TypeError);
    assert.throws(() => once('function'), TypeError);
    assert.throws(() => once({}), TypeError);
    assert.throws(() => once(() => {}, 'invalidOptions'), TypeError);
  });

  it('supports once.strict which throws error when called more than once', () => {
    let initialized = false;
    const initDB = once.strict(() => {
      initialized = true;
      return 'DB_READY';
    }, 'Database connection can only be established once');

    assert.strictEqual(initDB(), 'DB_READY');
    assert.strictEqual(initialized, true);

    assert.throws(
      () => initDB(),
      /Database connection can only be established once/
    );

    // Test reset on strict
    initDB.reset();
    assert.strictEqual(initDB(), 'DB_READY');
  });

  it('supports once.async to ensure async operations and Promises run exactly once', async () => {
    let networkCalls = 0;
    const fetchAuthToken = once.async(async () => {
      networkCalls++;
      await new Promise((r) => setTimeout(r, 20));
      return `jwt-token-${networkCalls}`;
    });

    // Concurrent calls receive the exact same Promise
    const p1 = fetchAuthToken();
    const p2 = fetchAuthToken();
    const p3 = fetchAuthToken();

    assert.strictEqual(p1, p2);
    assert.strictEqual(p2, p3);

    const [t1, t2, t3] = await Promise.all([p1, p2, p3]);
    assert.strictEqual(t1, 'jwt-token-1');
    assert.strictEqual(t2, 'jwt-token-1');
    assert.strictEqual(t3, 'jwt-token-1');
    assert.strictEqual(networkCalls, 1);

    // Subsequent call after resolution returns cached Promise
    const t4 = await fetchAuthToken();
    assert.strictEqual(t4, 'jwt-token-1');
    assert.strictEqual(networkCalls, 1);
  });

  it('supports once.async with retryOnError: true on rejected promises', async () => {
    let fetchAttempts = 0;
    const flakyAsync = once.async(
      async () => {
        fetchAttempts++;
        if (fetchAttempts === 1) {
          throw new Error('Network timeout');
        }
        return 'recovered-data';
      },
      { retryOnError: true }
    );

    // First attempt rejects
    await assert.rejects(() => flakyAsync(), /Network timeout/);

    // Give microtask queue moment to reset
    await new Promise((r) => setTimeout(r, 5));

    // Second attempt retries and succeeds
    const result = await flakyAsync();
    assert.strictEqual(result, 'recovered-data');
    assert.strictEqual(fetchAttempts, 2);

    // Subsequent calls return cached resolution
    const cached = await flakyAsync();
    assert.strictEqual(cached, 'recovered-data');
    assert.strictEqual(fetchAttempts, 2);
  });

  it('tolerates null options gracefully across once and once.async', async () => {
    const fn1 = once(() => 'ok-sync', null);
    assert.strictEqual(fn1(), 'ok-sync');

    const fn2 = once.async(async () => 'ok-async', null);
    const res = await fn2();
    assert.strictEqual(res, 'ok-async');
  });

  it('validates once.async options type', () => {
    assert.throws(() => once.async(() => {}, 'invalid-string'), TypeError);
    assert.throws(() => once.async(() => {}, 12345), TypeError);
  });

  it('exposes fn and result/promise consistently across strict and async wrappers', async () => {
    const rawSync = () => 42;
    const strictFn = once.strict(rawSync);
    assert.strictEqual(strictFn.fn, rawSync);
    assert.strictEqual(strictFn(), 42);
    assert.strictEqual(strictFn.result, 42);

    const rawAsync = async () => 99;
    const asyncFn = once.async(rawAsync);
    assert.strictEqual(asyncFn.fn, rawAsync);
    const p = asyncFn();
    assert.strictEqual(asyncFn.promise, p);
    assert.strictEqual(await p, 99);
  });
});
