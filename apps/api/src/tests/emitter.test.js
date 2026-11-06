import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEventEmitter } from '../utils/emitter.js';

describe('Lightweight Isolated Event Emitter Utility (createEventEmitter)', () => {
  it('subscribes to events with .on() and triggers callback on .emit()', () => {
    const emitter = createEventEmitter();
    let received = null;

    emitter.on('payout:confirmed', (data) => {
      received = data;
    });

    const count = emitter.emit('payout:confirmed', { amount: 800, currency: 'USDC' });
    assert.equal(count, 1);
    assert.deepEqual(received, { amount: 800, currency: 'USDC' });
  });

  it('supports .once() for single-execution listeners', () => {
    const emitter = createEventEmitter();
    let calls = 0;

    emitter.once('milestone:completed', () => {
      calls++;
    });

    emitter.emit('milestone:completed');
    emitter.emit('milestone:completed');

    assert.equal(calls, 1);
    assert.equal(emitter.listenerCount('milestone:completed'), 0);
  });

  it('unsubscribes handlers via .off() or returned disposer function', () => {
    const emitter = createEventEmitter();
    let count = 0;
    const handler = () => {
      count++;
    };

    const unsubscribe = emitter.on('job:updated', handler);
    emitter.emit('job:updated');
    assert.equal(count, 1);

    unsubscribe();
    emitter.emit('job:updated');
    assert.equal(count, 1);
  });

  it('isolates listener errors so subsequent listeners still execute', () => {
    const emitter = createEventEmitter();
    const order = [];

    emitter.on('alert', () => {
      order.push('first');
      throw new Error('Listener 1 crashed');
    });
    emitter.on('alert', () => {
      order.push('second');
    });

    const invoked = emitter.emit('alert');
    assert.equal(invoked, 2);
    assert.deepEqual(order, ['first', 'second']);
  });

  it('supports .clear() to remove event-specific or all listeners', () => {
    const emitter = createEventEmitter();
    emitter.on('a', () => {});
    emitter.on('b', () => {});
    assert.equal(emitter.listenerCount('a'), 1);

    emitter.clear('a');
    assert.equal(emitter.listenerCount('a'), 0);
    assert.equal(emitter.listenerCount('b'), 1);

    emitter.clear();
    assert.equal(emitter.listenerCount('b'), 0);
  });
});
