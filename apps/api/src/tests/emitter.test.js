/**
 * @file emitter.test.js
 * Unit tests for createEventEmitter utility.
 */

import assert from 'assert';
import { createEventEmitter } from '../utils/emitter.js';

function runTests() {
  console.log('Running createEventEmitter unit tests...');

  // Test 1: Standard subscription and emission
  {
    const emitter = createEventEmitter();
    const calls = [];
    const unsubscribe = emitter.on('payment', (amount, currency) => {
      calls.push({ amount, currency });
    });

    emitter.emit('payment', 100, 'USDC');
    emitter.emit('payment', 250, 'EUR');
    assert.strictEqual(calls.length, 2);
    assert.deepStrictEqual(calls[0], { amount: 100, currency: 'USDC' });
    assert.deepStrictEqual(calls[1], { amount: 250, currency: 'EUR' });

    unsubscribe();
    emitter.emit('payment', 500, 'USD');
    assert.strictEqual(calls.length, 2); // No new calls after unsubscribe
    console.log('✔ Test 1 passed: Standard subscription and emission');
  }

  // Test 2: once() listener only triggers once
  {
    const emitter = createEventEmitter();
    let count = 0;
    emitter.once('init', () => {
      count++;
    });

    assert.strictEqual(emitter.listenerCount('init'), 1);
    emitter.emit('init');
    emitter.emit('init');
    emitter.emit('init');

    assert.strictEqual(count, 1);
    assert.strictEqual(emitter.listenerCount('init'), 0);
    console.log('✔ Test 2 passed: once() listener triggers exactly once');
  }

  // Test 3: off() with once() handler
  {
    const emitter = createEventEmitter();
    let count = 0;
    const handler = () => count++;
    emitter.once('task', handler);
    assert.strictEqual(emitter.listenerCount('task'), 1);

    emitter.off('task', handler);
    assert.strictEqual(emitter.listenerCount('task'), 0);

    emitter.emit('task');
    assert.strictEqual(count, 0);
    console.log('✔ Test 3 passed: off() successfully deregisters once() handler');
  }

  // Test 4: Error boundary isolation
  {
    const errorsCaptured = [];
    const emitter = createEventEmitter({
      onError: (err, event) => {
        errorsCaptured.push({ err: err.message, event });
      },
    });

    let secondListenerCalled = false;
    emitter.on('action', () => {
      throw new Error('Explosion in listener 1');
    });
    emitter.on('action', () => {
      secondListenerCalled = true;
    });

    emitter.emit('action');
    assert.strictEqual(secondListenerCalled, true);
    assert.strictEqual(errorsCaptured.length, 1);
    assert.strictEqual(errorsCaptured[0].err, 'Explosion in listener 1');
    assert.strictEqual(errorsCaptured[0].event, 'action');
    console.log('✔ Test 4 passed: Error boundary isolates failing listeners');
  }

  // Test 5: removeAllListeners
  {
    const emitter = createEventEmitter();
    emitter.on('evt1', () => {});
    emitter.on('evt1', () => {});
    emitter.on('evt2', () => {});

    assert.strictEqual(emitter.listenerCount('evt1'), 2);
    assert.strictEqual(emitter.listenerCount('evt2'), 1);

    emitter.removeAllListeners('evt1');
    assert.strictEqual(emitter.listenerCount('evt1'), 0);
    assert.strictEqual(emitter.listenerCount('evt2'), 1);

    emitter.removeAllListeners();
    assert.strictEqual(emitter.listenerCount('evt2'), 0);
    console.log('✔ Test 5 passed: removeAllListeners clears specific or all events');
  }

  // Test 6: Invalid listener throws TypeError
  {
    const emitter = createEventEmitter();
    assert.throws(() => emitter.on('test', 'not a function'), TypeError);
    assert.throws(() => emitter.once('test', null), TypeError);
    console.log('✔ Test 6 passed: TypeError thrown for non-function listeners');
  }

  console.log('All createEventEmitter tests passed successfully!');
}

runTests();
