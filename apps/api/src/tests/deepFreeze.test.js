import test from 'node:test';
import assert from 'node:assert/strict';
import { deepFreeze } from '../utils/deepFreeze.js';

test('deepFreeze returns primitive values without modification', () => {
  assert.equal(deepFreeze(42), 42);
  assert.equal(deepFreeze('immutable'), 'immutable');
  assert.equal(deepFreeze(true), true);
  assert.equal(deepFreeze(null), null);
  assert.equal(deepFreeze(undefined), undefined);

  const sym = Symbol('token');
  assert.equal(deepFreeze(sym), sym);
  assert.equal(deepFreeze(100n), 100n);
});

test('deepFreeze freezes shallow object and prevents mutations', () => {
  const target = { a: 1, b: 'text' };
  const frozen = deepFreeze(target);

  assert.equal(frozen, target);
  assert.ok(Object.isFrozen(target));

  assert.throws(() => {
    target.a = 2;
  }, TypeError);

  assert.throws(() => {
    target.c = 3;
  }, TypeError);

  assert.throws(() => {
    delete target.a;
  }, TypeError);
});

test('deepFreeze deeply freezes nested objects and arrays', () => {
  const complex = {
    user: {
      profile: {
        name: 'Alice',
        roles: ['admin', 'maintainer'],
      },
    },
    meta: {
      active: true,
    },
  };

  deepFreeze(complex);

  assert.ok(Object.isFrozen(complex));
  assert.ok(Object.isFrozen(complex.user));
  assert.ok(Object.isFrozen(complex.user.profile));
  assert.ok(Object.isFrozen(complex.user.profile.roles));
  assert.ok(Object.isFrozen(complex.meta));

  assert.throws(() => {
    complex.user.profile.name = 'Bob';
  }, TypeError);

  assert.throws(() => {
    complex.user.profile.roles.push('hacker');
  }, TypeError);
});

test('deepFreeze handles circular references safely without call stack overflow', () => {
  const circularObj = { name: 'cycle' };
  circularObj.self = circularObj;

  const nodeA = { id: 'A' };
  const nodeB = { id: 'B' };
  nodeA.neighbor = nodeB;
  nodeB.neighbor = nodeA;

  assert.doesNotThrow(() => {
    deepFreeze(circularObj);
  });
  assert.ok(Object.isFrozen(circularObj));

  assert.doesNotThrow(() => {
    deepFreeze(nodeA);
  });
  assert.ok(Object.isFrozen(nodeA));
  assert.ok(Object.isFrozen(nodeB));
});

test('deepFreeze secures Set collections and their elements', () => {
  const nested = { id: 101 };
  const mySet = new Set([nested, 'fixed_element']);

  deepFreeze(mySet);

  assert.ok(Object.isFrozen(mySet));
  assert.ok(Object.isFrozen(nested));

  assert.throws(() => {
    nested.id = 102;
  }, TypeError);

  assert.throws(() => {
    mySet.add({ id: 103 });
  }, TypeError);

  assert.throws(() => {
    mySet.delete('fixed_element');
  }, TypeError);

  assert.throws(() => {
    mySet.clear();
  }, TypeError);
});

test('deepFreeze secures Map collections, keys, and values', () => {
  const keyObj = { code: 'EUR' };
  const valObj = { rate: 1.08 };
  const myMap = new Map();
  myMap.set(keyObj, valObj);

  deepFreeze(myMap);

  assert.ok(Object.isFrozen(myMap));
  assert.ok(Object.isFrozen(keyObj));
  assert.ok(Object.isFrozen(valObj));

  assert.throws(() => {
    keyObj.code = 'USD';
  }, TypeError);

  assert.throws(() => {
    valObj.rate = 1.15;
  }, TypeError);

  assert.throws(() => {
    myMap.set('GBP', { rate: 1.25 });
  }, TypeError);

  assert.throws(() => {
    myMap.delete(keyObj);
  }, TypeError);

  assert.throws(() => {
    myMap.clear();
  }, TypeError);
});

test('deepFreeze handles Symbol properties and non-enumerable properties', () => {
  const secretKey = Symbol('secret');
  const obj = {};
  Object.defineProperty(obj, 'hidden', {
    value: { data: 'confidential' },
    enumerable: false,
    configurable: true,
    writable: true,
  });
  obj[secretKey] = { token: 'xyz' };

  deepFreeze(obj);

  assert.ok(Object.isFrozen(obj));
  assert.ok(Object.isFrozen(obj[secretKey]));
  assert.ok(Object.isFrozen(obj.hidden));

  assert.throws(() => {
    obj[secretKey].token = 'mutated';
  }, TypeError);

  assert.throws(() => {
    obj.hidden.data = 'mutated';
  }, TypeError);
});

test('deepFreeze handles getters without crashing or invoking setters', () => {
  let counter = 0;
  const obj = {
    get dynamic() {
      counter++;
      return { count: counter };
    },
  };

  deepFreeze(obj);
  assert.ok(Object.isFrozen(obj));
  // Getter should not have been called during property inspection
  assert.equal(counter, 0);
});
