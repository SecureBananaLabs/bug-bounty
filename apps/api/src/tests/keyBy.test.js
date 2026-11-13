import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { keyBy } from '../utils/keyBy.js';
import defaultKeyBy from '../utils/keyBy.js';

describe('keyBy utility', () => {
  it('exports keyBy as named export and default export', () => {
    assert.strictEqual(typeof keyBy, 'function');
    assert.strictEqual(typeof defaultKeyBy, 'function');
    assert.strictEqual(keyBy, defaultKeyBy);
    assert.strictEqual(keyBy.keyBy, keyBy);
  });

  it('keys collection by property string', () => {
    const users = [
      { id: 'u1', name: 'Alice' },
      { id: 'u2', name: 'Bob' },
    ];
    const result = keyBy(users, 'id');
    assert.deepStrictEqual(result, {
      u1: { id: 'u1', name: 'Alice' },
      u2: { id: 'u2', name: 'Bob' },
    });
  });

  it('keys collection using function iteratee with index and array arguments', () => {
    const numbers = [6.1, 4.2, 6.3];
    const result = keyBy(numbers, Math.floor);
    assert.deepStrictEqual(result, {
      '4': 4.2,
      '6': 6.3, // overwrite by default
    });
  });

  it('keys collection using identity when iteratee is undefined', () => {
    const items = ['alpha', 'beta', 'gamma'];
    const result = keyBy(items);
    assert.deepStrictEqual(result, {
      alpha: 'alpha',
      beta: 'beta',
      gamma: 'gamma',
    });
  });

  it('supports Symbol properties and Symbol keys', () => {
    const symId = Symbol('id');
    const symGroup = Symbol('group');
    const items = [
      { [symId]: 'first', code: 10 },
      { [symId]: symGroup, code: 20 },
    ];

    const result = keyBy(items, symId);
    assert.strictEqual(result.first, items[0]);
    assert.strictEqual(result[symGroup], items[1]);
  });

  it('safely handles non-array and empty inputs', () => {
    assert.deepStrictEqual(keyBy(null), {});
    assert.deepStrictEqual(keyBy(undefined), {});
    assert.deepStrictEqual(keyBy(123), {});
    assert.deepStrictEqual(keyBy('string'), {});
    assert.deepStrictEqual(keyBy({}), {});
    assert.deepStrictEqual(keyBy([]), {});

    // Iterable support (Set)
    const set = new Set([{ id: 's1' }, { id: 's2' }]);
    const setResult = keyBy(set, 'id');
    assert.deepStrictEqual(setResult, {
      s1: { id: 's1' },
      s2: { id: 's2' },
    });
  });

  it('supports nullPrototype option', () => {
    const items = [{ id: 'a' }];
    const res = keyBy(items, 'id', { nullPrototype: true });
    assert.strictEqual(Object.getPrototypeOf(res), null);
    assert.strictEqual(res.a, items[0]);

    const emptyRes = keyBy(null, 'id', { nullPrototype: true });
    assert.strictEqual(Object.getPrototypeOf(emptyRes), null);
  });

  it('defends against prototype pollution (CWE-1321) by skipping dangerous keys by default', () => {
    const malicious = [
      { key: '__proto__', payload: 'evil' },
      { key: 'constructor', payload: 'evil' },
      { key: 'prototype', payload: 'evil' },
      { key: 'safe', payload: 'ok' },
    ];

    const beforeProto = Object.prototype.polluted;
    const res = keyBy(malicious, 'key');

    assert.strictEqual(res.safe, malicious[3]);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(res, '__proto__'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(res, 'constructor'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(res, 'prototype'), false);
    assert.strictEqual(Object.prototype.polluted, beforeProto);
    assert.strictEqual({}.polluted, undefined);
  });

  it('throws on dangerous keys when dangerAction is "throw"', () => {
    assert.throws(
      () => keyBy([{ id: '__proto__' }], 'id', { dangerAction: 'throw' }),
      /Disallowed dangerous prototype key/
    );
    assert.throws(
      () => keyBy([{ id: 'constructor' }], 'id', { dangerAction: 'throw' }),
      /Disallowed dangerous prototype key/
    );
    assert.throws(
      () => keyBy([{ id: 'prototype' }], 'id', { dangerAction: 'throw' }),
      /Disallowed dangerous prototype key/
    );
  });

  it('resolves collisions via keepFirst / ignore strategy', () => {
    const items = [
      { code: 'dup', version: 1 },
      { code: 'dup', version: 2 },
    ];
    const res = keyBy(items, 'code', { collisionStrategy: 'keepFirst' });
    assert.strictEqual(res.dup.version, 1);

    const resIgnore = keyBy(items, 'code', { collisionStrategy: 'ignore' });
    assert.strictEqual(resIgnore.dup.version, 1);
  });

  it('throws on collision when collisionStrategy is "error"', () => {
    const items = [
      { code: 'dup', version: 1 },
      { code: 'dup', version: 2 },
    ];
    assert.throws(
      () => keyBy(items, 'code', { collisionStrategy: 'error' }),
      /Collision detected for key: dup/
    );
  });

  it('supports custom resolver function for collision resolution', () => {
    const items = [
      { code: 'item', score: 10 },
      { code: 'item', score: 25 },
    ];
    const res = keyBy(items, 'code', {
      collisionStrategy: (prev, next) => ({ code: prev.code, score: prev.score + next.score })
    });
    assert.strictEqual(res.item.score, 35);
  });

  it('protects against sparse array holes with skipHoles option', () => {
    const sparse = new Array(3);
    sparse[1] = { id: 'middle' };

    const resDefault = keyBy(sparse, (item) => (item ? item.id : 'hole'));
    assert.strictEqual(resDefault.middle, sparse[1]);
    assert.strictEqual(resDefault.hole, undefined);

    const resSkipped = keyBy(sparse, (item) => (item ? item.id : 'hole'), { skipHoles: true });
    assert.strictEqual(resSkipped.middle, sparse[1]);
    assert.strictEqual(resSkipped.hole, undefined);
  });

  it('handles iteratee exceptions with onError callback and suppressErrors option', () => {
    const faultyIteratee = (item) => {
      if (item.broken) {
        throw new Error('Boom');
      }
      return item.id;
    };

    const items = [{ id: 'ok' }, { broken: true }];

    // Default throws
    assert.throws(() => keyBy(items, faultyIteratee), /Iteratee threw an exception at index 1: Boom/);

    // suppressErrors
    const resSuppressed = keyBy(items, faultyIteratee, { suppressErrors: true });
    assert.strictEqual(resSuppressed.ok, items[0]);
    assert.strictEqual(resSuppressed.__errors__, items[1]);

    // onError custom fallback
    const resOnError = keyBy(items, faultyIteratee, {
      onError: (err, item) => 'rescued'
    });
    assert.strictEqual(resOnError.ok, items[0]);
    assert.strictEqual(resOnError.rescued, items[1]);
  });

  it('validates options and iteratee arguments', () => {
    assert.throws(() => keyBy([], 123), TypeError);
    assert.throws(() => keyBy([], 'id', null), TypeError);
    assert.throws(() => keyBy([], 'id', 'notAnObject'), TypeError);
    assert.throws(() => keyBy([], 'id', { collisionStrategy: 'invalid' }), TypeError);
    assert.throws(() => keyBy([], 'id', { dangerAction: 'invalid' }), TypeError);
  });

  it('supports 2-argument signature keyBy(array, options) with default identity iteratee', () => {
    const items = ['apple', 'apple', 'banana'];
    const resKeep = keyBy(items, { collisionStrategy: 'keepFirst' });
    assert.deepStrictEqual(resKeep, {
      apple: 'apple',
      banana: 'banana',
    });
  });

  it('collects multiple suppressed errors in an array without collision exceptions', () => {
    const items = [
      { id: 'first' },
      { fail: 1 },
      { fail: 2 },
      { id: 'second' },
      { fail: 3 },
    ];
    const iteratee = (item) => {
      if (item.fail) throw new Error(`Fail ${item.fail}`);
      return item.id;
    };

    const res = keyBy(items, iteratee, {
      suppressErrors: true,
      collisionStrategy: 'error',
    });

    assert.strictEqual(res.first, items[0]);
    assert.strictEqual(res.second, items[3]);
    assert.deepStrictEqual(res.__errors__, [items[1], items[2], items[4]]);
  });

  it('safely defines own properties without triggering prototype setters or crashing on read-only prototype properties', () => {
    let setterInvoked = false;
    Object.defineProperty(Object.prototype, 'customTrapSetterKey', {
      get() { return 'trap'; },
      set() { setterInvoked = true; },
      configurable: true,
    });
    Object.defineProperty(Object.prototype, 'customReadOnlyKey', {
      value: 'readOnly',
      writable: false,
      configurable: true,
    });

    try {
      const items = [
        { id: 'customTrapSetterKey', val: 100 },
        { id: 'customReadOnlyKey', val: 200 },
      ];
      const res = keyBy(items, 'id');

      assert.strictEqual(setterInvoked, false);
      assert.strictEqual(Object.prototype.hasOwnProperty.call(res, 'customTrapSetterKey'), true);
      assert.strictEqual(res.customTrapSetterKey, items[0]);
      assert.strictEqual(Object.prototype.hasOwnProperty.call(res, 'customReadOnlyKey'), true);
      assert.strictEqual(res.customReadOnlyKey, items[1]);
    } finally {
      delete Object.prototype.customTrapSetterKey;
      delete Object.prototype.customReadOnlyKey;
    }
  });

  it('efficiently traverses sparse arrays with skipHoles: true without resource exhaustion (CWE-400)', () => {
    const sparse = [];
    sparse[1000000] = { id: 'far' };

    const start = Date.now();
    const res = keyBy(sparse, 'id', { skipHoles: true });
    const duration = Date.now() - start;

    assert.strictEqual(res.far, sparse[1000000]);
    assert.strictEqual(duration < 200, true);
  });

  it('safely handles throwing Symbol.toStringTag getters without uncaught crash', () => {
    const evilKey = Object.create(null);
    Object.defineProperty(evilKey, Symbol.toStringTag, {
      get() { throw new Error('toStringTag trap'); }
    });

    const items = [{ id: evilKey, name: 'safeItem' }];
    const res = keyBy(items, 'id');
    assert.strictEqual(res['[object Object]'], items[0]);
  });
});
