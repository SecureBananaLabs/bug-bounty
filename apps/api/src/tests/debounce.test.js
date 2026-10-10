import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../utils/debounce.js';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create a debounced function with cancel and flush methods', () => {
    const fn = vi.fn();
    const db = debounce(fn, 100);
    expect(typeof db).toBe('function');
    expect(typeof db.cancel).toBe('function');
    expect(typeof db.flush).toBe('function');
  });

  it('should not call fn immediately (trailing mode)', () => {
    const fn = vi.fn();
    const db = debounce(fn, 100);
    db('a');
    db('b');
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
  });

  it('should call on leading edge when leading=true', () => {
    const fn = vi.fn();
    const db = debounce(fn, 100, { leading: true });
    db('first');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('first');
  });

  it('should reset timer on subsequent calls', () => {
    const fn = vi.fn();
    const db = debounce(fn, 100);
    db('a');
    vi.advanceTimersByTime(50);
    db('b');
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
  });

  it('should cancel pending invocation', () => {
    const fn = vi.fn();
    const db = debounce(fn, 100);
    db('a');
    db.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });

  it('should flush pending invocation immediately', () => {
    const fn = vi.fn();
    const db = debounce(fn, 100);
    db('flush-me');
    db.flush();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('flush-me');
  });

  it('should work with trailing=false (leading only)', () => {
    const fn = vi.fn();
    const db = debounce(fn, 100, { leading: true, trailing: false });
    db('a');
    db('b');
    // Only the first call (leading) should trigger
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(200);
    // No trailing call
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
