const { throttle } = require('../utils/throttle');

describe('throttle utility', () => {
  jest.useFakeTimers();

  test('should throttle invocations within the wait window', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);

    throttled(2);
    throttled(3);
    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(3);
  });

  test('should support cancel() to abort pending trailing execution', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled(1);
    throttled(2);
    expect(throttled.pending()).toBe(true);

    throttled.cancel();
    expect(throttled.pending()).toBe(false);

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should support flush() to immediately execute pending trailing calls', () => {
    const fn = jest.fn((x) => x * 2);
    const throttled = throttle(fn, 100);

    throttled(1);
    throttled(5);

    const res = throttled.flush();
    expect(res).toBe(10);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
