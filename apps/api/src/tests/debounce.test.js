import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { debounce } from '../utils/debounce.js';

describe('Configurable Debounce Utility', () => {
  it('delays execution until after wait period', async () => {
    let callCount = 0;
    const fn = debounce(() => { callCount++; }, 30);

    fn();
    fn();
    fn();

    assert.equal(callCount, 0);

    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(callCount, 1);
  });

  it('supports immediate execution on leading edge', () => {
    let callCount = 0;
    const fn = debounce(() => { callCount++; }, 50, { leading: true, trailing: false });

    fn();
    fn();
    fn();

    assert.equal(callCount, 1);
  });

  it('cancels scheduled invocations with .cancel()', async () => {
    let callCount = 0;
    const fn = debounce(() => { callCount++; }, 30);

    fn();
    fn.cancel();

    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(callCount, 0);
  });

  it('flushes pending execution immediately with .flush()', () => {
    let result = 0;
    const fn = debounce((x) => { result = x; return x; }, 100);

    fn(42);
    assert.equal(result, 0);

    fn.flush();
    assert.equal(result, 42);
  });
});
