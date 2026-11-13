import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEventBus, EventBus, TimeoutError } from '../utils/eventBus.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('EventBus utility (ref #743)', () => {
  it('instantiates via factory and class constructor', () => {
    const bus = createEventBus();
    assert.ok(bus instanceof EventBus);
    assert.equal(bus.getMaxListeners(), 10);

    const custom = new EventBus({ maxListeners: 25 });
    assert.equal(custom.getMaxListeners(), 25);
  });

  it('validates constructor arguments defensively', () => {
    assert.throws(() => createEventBus('invalid'), TypeError);
    assert.throws(() => createEventBus({ maxListeners: -1 }), TypeError);
    assert.throws(() => createEventBus({ maxListeners: 3.5 }), TypeError);
    assert.throws(() => createEventBus({ onError: 'not a function' }), TypeError);
  });

  it('validates event names and listeners', () => {
    const bus = createEventBus();
    assert.throws(() => bus.on('', () => {}), TypeError);
    assert.throws(() => bus.on(123, () => {}), TypeError);
    assert.throws(() => bus.on('test', 'not-a-fn'), TypeError);
    assert.throws(() => bus.off('', () => {}), TypeError);
    assert.throws(() => bus.emit(null), TypeError);
    assert.throws(() => bus.listenerCount(undefined), TypeError);
  });

  it('registers and emits synchronous events with payload arguments', () => {
    const bus = createEventBus();
    const calls = [];

    bus.on('data', (a, b) => calls.push({ a, b }));
    const emitted = bus.emit('data', 'hello', 42);

    assert.equal(emitted, true);
    assert.equal(bus.emit('nonexistent'), false);
    assert.deepEqual(calls, [{ a: 'hello', b: 42 }]);
  });

  it('handles once listeners and removes after first emission', () => {
    const bus = createEventBus();
    let count = 0;

    bus.once('ping', () => count++);
    bus.emit('ping');
    bus.emit('ping');

    assert.equal(count, 1);
    assert.equal(bus.listenerCount('ping'), 0);
  });

  it('allows removing listeners with off() before and after once wraps', () => {
    const bus = createEventBus();
    let count = 0;
    const fn = () => count++;

    bus.on('ev', fn);
    assert.equal(bus.listenerCount('ev'), 1);
    bus.off('ev', fn);
    assert.equal(bus.listenerCount('ev'), 0);

    // off can remove a once-wrapped listener by passing original function
    bus.once('ev2', fn);
    assert.equal(bus.listenerCount('ev2'), 1);
    bus.off('ev2', fn);
    assert.equal(bus.listenerCount('ev2'), 0);
    bus.emit('ev2');
    assert.equal(count, 0);
  });

  it('executes async listeners concurrently via emitAsync and returns results', async () => {
    const bus = createEventBus();

    bus.on('calc', async (x) => {
      await sleep(10);
      return x * 2;
    });
    bus.on('calc', async (x) => {
      await sleep(5);
      return x + 10;
    });

    const results = await bus.emitAsync('calc', 5);
    assert.deepEqual(results, [10, 15]);
  });

  it('captures listener exceptions inside onError boundary without breaking emission', () => {
    const errors = [];
    const bus = createEventBus({
      onError: (err, ctx) => errors.push({ err, ctx })
    });

    let secondCalled = false;
    bus.on('bad', () => {
      throw new Error('boom');
    });
    bus.on('bad', () => {
      secondCalled = true;
    });

    bus.emit('bad', 'arg1');

    assert.equal(secondCalled, true);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].err.message, 'boom');
    assert.equal(errors[0].ctx.event, 'bad');
  });

  it('captures async listener rejections inside onError boundary', async () => {
    const errors = [];
    const bus = createEventBus({
      onError: (err, ctx) => errors.push({ err, ctx })
    });

    bus.on('async-err', async () => {
      throw new Error('async failure');
    });

    const res = await bus.emitAsync('async-err');
    assert.deepEqual(res, [undefined]);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].err.message, 'async failure');
  });

  it('re-throws unhandled error event when no onError is provided', () => {
    const bus = createEventBus();
    assert.throws(() => bus.emit('error', new Error('fatal')), /fatal/);
  });

  it('waitFor resolves with emitted arguments', async () => {
    const bus = createEventBus();

    const promise = bus.waitFor('ready');
    setTimeout(() => bus.emit('ready', { status: 'ok' }), 10);

    const res = await promise;
    assert.deepEqual(res, { status: 'ok' });
    assert.equal(bus.listenerCount('ready'), 0);
  });

  it('waitFor rejects with TimeoutError when operation times out', async () => {
    const bus = createEventBus();

    await assert.rejects(
      bus.waitFor('slow', { timeout: 25 }),
      (err) => {
        assert.ok(err instanceof TimeoutError);
        assert.equal(err.code, 'ETIMEDOUT');
        assert.equal(err.timeout, 25);
        return true;
      }
    );
    assert.equal(bus.listenerCount('slow'), 0);
  });

  it('waitFor respects pre-aborted and mid-flight AbortSignal', async () => {
    const bus = createEventBus();

    // Pre-aborted
    const preAc = new AbortController();
    preAc.abort(new Error('already aborted'));
    await assert.rejects(bus.waitFor('ev', { signal: preAc.signal }), /already aborted/);
    assert.equal(bus.listenerCount('ev'), 0);

    // Mid-flight abort
    const liveAc = new AbortController();
    const p = bus.waitFor('live', { signal: liveAc.signal, timeout: 500 });
    setTimeout(() => liveAc.abort(new Error('cancelled')), 15);
    await assert.rejects(p, /cancelled/);
    assert.equal(bus.listenerCount('live'), 0);
  });

  it('waitFor supports filter predicate to selectively match event', async () => {
    const bus = createEventBus();

    const p = bus.waitFor('msg', {
      filter: (m) => m.id === 42
    });

    bus.emit('msg', { id: 1 });
    bus.emit('msg', { id: 10 });
    bus.emit('msg', { id: 42, payload: 'match' });

    const matched = await p;
    assert.deepEqual(matched, { id: 42, payload: 'match' });
  });

  it('warns via onError when maxListeners threshold is exceeded', () => {
    const warnings = [];
    const bus = createEventBus({
      maxListeners: 2,
      onError: (err, ctx) => {
        if (ctx.type === 'maxListeners') warnings.push(err);
      }
    });

    bus.on('ev', () => {});
    bus.on('ev', () => {});
    assert.equal(warnings.length, 0);

    bus.on('ev', () => {}); // 3rd listener exceeds limit of 2
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0].name, 'MaxListenersExceededWarning');
    assert.equal(warnings[0].count, 3);
  });

  it('guarantees prototype pollution immunity on event names', () => {
    const bus = createEventBus();
    const protoEvents = [];

    bus.on('__proto__', (val) => protoEvents.push(val));
    bus.on('constructor', (val) => protoEvents.push(val));
    bus.on('prototype', (val) => protoEvents.push(val));

    bus.emit('__proto__', 'safe-proto');
    bus.emit('constructor', 'safe-constructor');
    bus.emit('prototype', 'safe-prototype');

    assert.equal(Object.prototype.polluted, undefined);
    assert.equal({}.polluted, undefined);
    assert.deepEqual(protoEvents, ['safe-proto', 'safe-constructor', 'safe-prototype']);

    assert.equal(bus.listenerCount('__proto__'), 1);
    assert.deepEqual(bus.eventNames(), ['__proto__', 'constructor', 'prototype']);

    bus.removeAllListeners('__proto__');
    assert.equal(bus.listenerCount('__proto__'), 0);
  });

  it('supports listener introspection and cleanup', () => {
    const bus = createEventBus();
    const f1 = () => {};
    const f2 = () => {};

    bus.on('test', f1);
    bus.once('test', f2);

    assert.equal(bus.listenerCount('test'), 2);
    assert.deepEqual(bus.listeners('test'), [f1, f2]);
    assert.equal(bus.rawListeners('test').length, 2);

    bus.removeAllListeners();
    assert.equal(bus.listenerCount('test'), 0);
    assert.deepEqual(bus.eventNames(), []);
  });
});
