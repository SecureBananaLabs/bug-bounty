import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { once } from '../utils/once.js';

describe('Single Execution Function Wrapper (once)', () => {
  it('executes the underlying function exactly once and caches the result', () => {
    let callCount = 0;
    const initialize = once((x) => {
      callCount++;
      return x * 10;
    });

    assert.equal(initialize.isCalled(), false);
    const v1 = initialize(5);
    const v2 = initialize(10);
    const v3 = initialize(20);

    assert.equal(v1, 50);
    assert.equal(v2, 50);
    assert.equal(v3, 50);
    assert.equal(callCount, 1);
    assert.equal(initialize.isCalled(), true);
  });

  it('preserves this context and passes multiple arguments on first invocation', () => {
    const context = {
      multiplier: 3,
      compute: once(function (a, b) {
        return (a + b) * this.multiplier;
      })
    };

    assert.equal(context.compute(4, 6), 30);
    assert.equal(context.compute(100, 200), 30);
  });

  it('supports .reset() to allow re-initialization in tests or lifecycle restarts', () => {
    let count = 0;
    const boot = once(() => ++count);

    assert.equal(boot(), 1);
    assert.equal(boot(), 1);

    boot.reset();
    assert.equal(boot.isCalled(), false);
    assert.equal(boot(), 2);
  });

  it('throws TypeError if argument is not a function', () => {
    assert.throws(() => once(null), TypeError);
    assert.throws(() => once('not-a-fn'), TypeError);
  });
});
