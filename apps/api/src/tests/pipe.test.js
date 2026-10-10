import { describe, it, expect, vi } from 'vitest';
import { pipe, pipeAsync } from '../utils/pipe.js';

describe('pipe', () => {
  it('should compose functions left to right', () => {
    const double = (x) => x * 2;
    const add10 = (x) => x + 10;
    const stringify = (x) => `${x}`;

    const pipeline = pipe(double, add10, stringify);
    expect(pipeline(5)).toBe('20'); // 5*2=10, 10+10=20, "20"
  });

  it('should work with single function', () => {
    const double = (x) => x * 2;
    expect(pipe(double)(3)).toBe(6);
  });

  it('should return identity when no functions provided', () => {
    expect(pipe()(42)).toBe(42);
  });

  it('should pass through each function in order', () => {
    const log = vi.fn((x) => x);
    const pipeline = pipe(log, log, log);
    pipeline('hello');
    expect(log).toHaveBeenCalledTimes(3);
  });
});

describe('pipeAsync', () => {
  it('should compose async functions sequentially', () => {
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    const asyncDouble = async (x) => { await delay(1); return x * 2; };
    const asyncAdd5 = async (x) => { await delay(1); return x + 5; };

    const result = pipeAsync(asyncDouble, asyncAdd5)(4);
    // 4*2=8, 8+5=13
    return expect(result).resolves.toBe(13);
  });

  it('should handle empty functions returning undefined initially', () => {
    const asyncTriple = async (x) => x * 3;
    return expect(pipeAsync(asyncTriple)(7)).resolves.toBe(21);
  });
});
