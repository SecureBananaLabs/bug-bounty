import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEventEmitter } from '../utils/emitter.js';

describe('Lightweight Isolated Event Emitter Utility', () => {
  it('subscribes to events with .on() and triggers callback on .emit()', () => {
    const emitter = createEventEmitter();
    let received = null;

    emitter.on('payout:confirmed', (data) => {
      received = data;
    });

    emitter.emit('payout:confirmed', { amount: 50, currency: 'EUR' });
    assert.deepEqual(received, { amount: 50, currency: 'EUR' });
  });

  it('handles one-time subscriptions with .once()', () => {
    const emitter = createEventEmitter();
    let count = 0;

    emitter.once('session:start', () => {
      count++;
    });

    emitter.emit('session:start');
    emitter.emit('session:start');
    emitter.emit('session:start');

    assert.equal(count, 1);
  });

  it('unsubscribes handlers cleanly via returned function or .off()', () => {
    const emitter = createEventEmitter();
    let count = 0;
    const handler = () => { count++; };

    const unsubscribe = emitter.on('tick', handler);
    emitter.emit('tick');
    assert.equal(count, 1);

    unsubscribe();
    emitter.emit('tick');
    assert.equal(count, 1);
  });

  it('isolates listener errors without breaking subsequent listeners', () => {
    const emitter = createEventEmitter();
    let secondRan = false;

    emitter.on('action', () => {
      throw new Error('Listener failed');
    });

    emitter.on('action', () => {
      secondRan = true;
    });

    emitter.emit('action');
    assert.equal(secondRan, true);
  });
});
