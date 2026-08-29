import { describe, it } from 'node:test';
import assert from 'node:assert';
import { debounce } from '../utils/debounce.js';

describe('debounce Utility', () => {
  it('should delay function execution until wait time has elapsed', async () => {
    let callCount = 0;
    const debounced = debounce(() => {
      callCount++;
    }, 50);

    debounced();
    debounced();
    debounced();
    assert.strictEqual(callCount, 0);

    await new Promise((resolve) => setTimeout(resolve, 80));
    assert.strictEqual(callCount, 1);
  });

  it('should support leading edge execution immediately', () => {
    let callCount = 0;
    const debounced = debounce(
      (val) => {
        callCount++;
        return val * 2;
      },
      50,
      { leading: true, trailing: false }
    );

    const res1 = debounced(5);
    debounced(10);
    assert.strictEqual(callCount, 1);
    assert.strictEqual(res1, 10);
  });

  it('should cancel pending invocations when cancel is called', async () => {
    let callCount = 0;
    const debounced = debounce(() => {
      callCount++;
    }, 50);

    debounced();
    assert.strictEqual(debounced.pending(), true);
    debounced.cancel();
    assert.strictEqual(debounced.pending(), false);

    await new Promise((resolve) => setTimeout(resolve, 80));
    assert.strictEqual(callCount, 0);
  });

  it('should immediately flush pending invocations when flush is called', () => {
    let callCount = 0;
    const debounced = debounce((msg) => {
      callCount++;
      return msg;
    }, 50);

    debounced('hello');
    assert.strictEqual(callCount, 0);
    const res = debounced.flush();
    assert.strictEqual(callCount, 1);
    assert.strictEqual(res, 'hello');
  });

  it('should respect maxWait guarantee', async () => {
    let callCount = 0;
    const debounced = debounce(
      () => {
        callCount++;
      },
      50,
      { maxWait: 100 }
    );

    debounced();
    await new Promise((resolve) => setTimeout(resolve, 40));
    debounced();
    await new Promise((resolve) => setTimeout(resolve, 40));
    debounced();
    await new Promise((resolve) => setTimeout(resolve, 40));

    assert.ok(callCount >= 1);
  });

  it('should throw TypeError on non-function inputs', () => {
    assert.throws(() => debounce(null), { name: 'TypeError' });
    assert.throws(() => debounce(123), { name: 'TypeError' });
  });
});