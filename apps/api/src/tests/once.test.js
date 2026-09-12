import { describe, it, expect, vi } from 'vitest';
import { once } from '../utils/once.js';

describe('once', () => {
  it('should call the function only once', () => {
    const fn = vi.fn().mockReturnValue(42);
    const wrapped = once(fn);

    expect(wrapped()).toBe(42);
    expect(wrapped()).toBe(42);
    expect(wrapped()).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to the first call', () => {
    const fn = vi.fn((a, b) => a + b);
    const wrapped = once(fn);

    expect(wrapped(3, 4)).toBe(7);
    expect(wrapped(10, 20)).toBe(7); // still returns first result
    expect(fn).toHaveBeenCalledWith(3, 4);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should preserve this context', () => {
    const fn = vi.fn(function () { return this.value; });
    const wrapped = once(fn);
    const ctx = { value: 'hello' };

    expect(wrapped.call(ctx)).toBe('hello');
    expect(fn).toHaveBeenCalledWith();
    // Verify fn was called with the correct this context
  });

  it('should return undefined if function returns nothing', () => {
    const fn = vi.fn(() => {});
    const wrapped = once(fn);

    expect(wrapped()).toBeUndefined();
    expect(wrapped()).toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should cache and re-throw errors from first call', () => {
    const fn = vi.fn(() => { throw new Error('boom'); });
    const wrapped = once(fn);

    expect(() => wrapped()).toThrow('boom');
    expect(() => wrapped()).toThrow('boom'); // same error behavior
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
