import { describe, it, expect, vi } from 'vitest';
import { createEventEmitter } from '../utils/emitter.js';

describe('createEventEmitter', () => {
  it('should create an emitter with on/off/once/emit methods', () => {
    const ee = createEventEmitter();
    expect(typeof ee.on).toBe('function');
    expect(typeof ee.once).toBe('function');
    expect(typeof ee.off).toBe('function');
    expect(typeof ee.emit).toBe('function');
  });

  it('should call registered handlers on emit', () => {
    const ee = createEventEmitter();
    const handler = vi.fn();
    ee.on('test', handler);
    ee.emit('test', 'a', 'b');
    expect(handler).toHaveBeenCalledWith('a', 'b');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should support multiple handlers for same event', () => {
    const ee = createEventEmitter();
    const h1 = vi.fn();
    const h2 = vi.fn();
    ee.on('event', h1);
    ee.on('event', h2);
    ee.emit('event');
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('should remove handlers with off', () => {
    const ee = createEventEmitter();
    const handler = vi.fn();
    ee.on('test', handler);
    ee.off('test', handler);
    ee.emit('test');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should call once handler only one time', () => {
    const ee = createEventEmitter();
    const handler = vi.fn();
    ee.once('test', handler);
    ee.emit('test');
    ee.emit('test');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should isolate errors — one failing handler does not stop others', () => {
    const ee = createEventEmitter();
    const good = vi.fn();
    const bad = vi.fn(() => { throw new Error('boom'); });
    const good2 = vi.fn();

    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    ee.on('test', bad);
    ee.on('test', good);
    ee.on('test', good2);

    ee.emit('test');

    expect(bad).toThrow(); // actually threw
    expect(good).toHaveBeenCalled();
    expect(good2).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('should do nothing when emitting unregistered event', () => {
    const ee = createEventEmitter();
    expect(() => ee.emit('nonexistent')).not.toThrow();
  });
});
