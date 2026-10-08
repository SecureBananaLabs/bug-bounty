import { describe, it, expect } from 'vitest';
import once from '../utils/once.js';

describe('once utility', () => {
  it('should execute the wrapped function only once', () => {
    let count = 0;
    const fn = once(() => ++count);

    expect(fn()).toBe(1);
    expect(fn()).toBe(1);
    expect(fn()).toBe(1);
    expect(count).toBe(1);
  });

  it('should return initial result for subsequent calls with different arguments', () => {
    const add = once((a, b) => a + b);

    expect(add(5, 5)).toBe(10);
    expect(add(20, 30)).toBe(10);
  });

  it('should preserve this context during execution', () => {
    const context = {
      multiplier: 3,
      calc: once(function (val) {
        return val * this.multiplier;
      }),
    };

    expect(context.calc(4)).toBe(12);
    expect(context.calc(10)).toBe(12);
  });

  it('should throw TypeError when argument is not a function', () => {
    expect(() => once(null)).toThrow(TypeError);
    expect(() => once(123)).toThrow(TypeError);
  });
});
