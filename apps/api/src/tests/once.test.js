import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { once } from '../utils/once.js';

describe('Single Execution Function Wrapper (once)', () => {
  it('executes the underlying function exactly once and caches result', () => {
    let callCount = 0;
    const initialize = once((x) => {
      callCount++;
      return x * 10;
    });

    const v1 = initialize(5);
    const v2 = initialize(10);
    const v3 = initialize(20);

    assert.equal(v1, 50);
    assert.equal(v2, 50);
    assert.equal(v3, 50);
    assert.equal(callCount, 1);
  });

  it('preserves `this` context across execution', () => {
    const context = {
      base: 100,
      compute: once(function (n) {
        return this.base + n;
      }),
    };

    assert.equal(context.compute(5), 105);
    assert.equal(context.compute(50), 105);
  });

  it('throws TypeError if argument is not a function', () => {
    assert.throws(() => once(null), { name: 'TypeError' });
    assert.throws(() => once('invalid'), { name: 'TypeError' });
  });
});
