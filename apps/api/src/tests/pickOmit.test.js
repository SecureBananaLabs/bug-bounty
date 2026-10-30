import test from 'node:test';
import assert from 'node:assert/strict';
import { pick, omit, pickBy, omitBy } from '../utils/pickOmit.js';

test('pick: correctly picks specified keys from a standard object', () => {
  const source = { a: 1, b: 'hello', c: true, d: [1, 2] };
  const result = pick(source, ['a', 'c']);
  assert.deepEqual(result, { a: 1, c: true });
});

test('pick: supports single string or symbol key without array wrapper', () => {
  const sym = Symbol('id');
  const source = { a: 10, [sym]: 'secret' };

  assert.deepEqual(pick(source, 'a'), { a: 10 });
  const symPick = pick(source, sym);
  assert.equal(symPick[sym], 'secret');
  assert.equal(Object.keys(symPick).length, 0);
  assert.equal(Object.getOwnPropertySymbols(symPick).length, 1);
});

test('pick: supports numeric keys and array-like objects', () => {
  const source = { 0: 'zero', 1: 'one', 2: 'two' };
  assert.deepEqual(pick(source, [0, 2]), { 0: 'zero', 2: 'two' });
  assert.deepEqual(pick(source, 1), { 1: 'one' });
});

test('pick: supports Set and generic iterables as keys input', () => {
  const source = { a: 1, b: 2, c: 3 };
  const setKeys = new Set(['a', 'c']);
  assert.deepEqual(pick(source, setKeys), { a: 1, c: 3 });

  function* keyGen() {
    yield 'b';
  }
  assert.deepEqual(pick(source, keyGen()), { b: 2 });
});

test('pick: ignores non-existent keys', () => {
  const source = { x: 1 };
  const result = pick(source, ['x', 'y', 'z']);
  assert.deepEqual(result, { x: 1 });
});

test('pick: prototype pollution defense neutralizes __proto__, constructor, and prototype', () => {
  const source = { __proto__: { polluted: true }, constructor: 'fake', a: 1 };
  const picked = pick(source, ['__proto__', 'constructor', 'prototype', 'a']);

  assert.equal(picked.a, 1);
  assert.equal(Object.prototype.hasOwnProperty.call(picked, '__proto__'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(picked, 'constructor'), false);
  assert.equal(({}).polluted, undefined);

  // dangerAction === 'throw'
  assert.throws(
    () => pick(source, ['__proto__'], { dangerAction: 'throw' }),
    TypeError
  );
});

test('pick: enforces own-property isolation and ignores inherited prototype properties', () => {
  class Base {
    inheritedProp = 'inherited';
    baseMethod() {}
  }
  class Derived extends Base {
    ownProp = 'own';
  }

  const inst = new Derived();
  const picked = pick(inst, ['ownProp', 'baseMethod', 'toString', 'valueOf']);

  assert.equal(picked.ownProp, 'own');
  assert.equal(Object.prototype.hasOwnProperty.call(picked, 'baseMethod'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(picked, 'toString'), false);
});

test('pick: handles functions with attached properties correctly', () => {
  function handler() {}
  handler.route = '/api';
  handler.version = 1;

  assert.deepEqual(pick(handler, ['route']), { route: '/api' });
  assert.deepEqual(pick(handler, ['version']), { version: 1 });
});

test('pick: handles non-object, null, and undefined inputs safely', () => {
  assert.deepEqual(pick(null, ['a']), {});
  assert.deepEqual(pick(undefined, ['a']), {});
  assert.deepEqual(pick(42, ['a']), {});
  assert.deepEqual(pick('string', ['a']), {});
  assert.deepEqual(pick(true, ['a']), {});
  assert.deepEqual(pick(Symbol('sym'), ['a']), {});
  assert.deepEqual(pick(100n, ['a']), {});
});

test('pick: handles empty or invalid keys arguments safely', () => {
  const source = { a: 1, b: 2 };
  assert.deepEqual(pick(source, null), {});
  assert.deepEqual(pick(source, undefined), {});
  assert.deepEqual(pick(source, []), {});
});

test('pick: supports nullPrototype option', () => {
  const source = { foo: 'bar' };
  const result = pick(source, ['foo'], { nullPrototype: true });

  assert.equal(result.foo, 'bar');
  assert.equal(Object.getPrototypeOf(result), null);
});

test('omit: correctly excludes specified keys from an object', () => {
  const source = { a: 1, b: 2, c: 3 };
  const result = omit(source, ['b']);
  assert.deepEqual(result, { a: 1, c: 3 });
});

test('omit: supports single string or symbol without array wrapper', () => {
  const sym = Symbol('omitMe');
  const source = { a: 1, [sym]: 'secret', b: 2 };

  assert.deepEqual(omit(source, 'a'), { [sym]: 'secret', b: 2 });
  const noSym = omit(source, sym);
  assert.deepEqual(noSym, { a: 1, b: 2 });
});

test('omit: supports numeric keys and array-like objects', () => {
  const source = { 0: 'a', 1: 'b', 2: 'c' };
  assert.deepEqual(omit(source, [1]), { 0: 'a', 2: 'c' });
  assert.deepEqual(omit(source, 0), { 1: 'b', 2: 'c' });
});

test('omit: supports Set and generic iterables as keys input', () => {
  const source = { a: 1, b: 2, c: 3 };
  const setKeys = new Set(['a', 'c']);
  assert.deepEqual(omit(source, setKeys), { b: 2 });

  function* keyGen() {
    yield 'b';
  }
  assert.deepEqual(omit(source, keyGen()), { a: 1, c: 3 });
});

test('omit: supports Symbol keys', () => {
  const sym1 = Symbol('keep');
  const sym2 = Symbol('drop');
  const source = { [sym1]: 'visible', [sym2]: 'hidden', normal: 123 };

  const result = omit(source, [sym2]);
  assert.equal(result.normal, 123);
  assert.equal(result[sym1], 'visible');
  assert.equal(result[sym2], undefined);
  assert.equal(Object.getOwnPropertySymbols(result).includes(sym1), true);
  assert.equal(Object.getOwnPropertySymbols(result).includes(sym2), false);
});

test('omit: prototype pollution defense prevents injecting or copying dangerous keys', () => {
  const source = { a: 1, b: 2 };
  const result = omit(source, ['__proto__']);
  assert.deepEqual(result, { a: 1, b: 2 });
  assert.equal(({}).polluted, undefined);

  assert.throws(
    () => omit(source, ['__proto__'], { dangerAction: 'throw' }),
    TypeError
  );
});

test('omit: handles functions with attached properties correctly', () => {
  function handler() {}
  handler.route = '/api';
  handler.secret = 'xyz';

  assert.deepEqual(omit(handler, ['secret']), { route: '/api' });
});

test('omit: handles non-object, null, and undefined inputs safely', () => {
  assert.deepEqual(omit(null, ['a']), {});
  assert.deepEqual(omit(undefined, ['a']), {});
  assert.deepEqual(omit(100, ['a']), {});
  assert.deepEqual(omit(false, ['a']), {});
  assert.deepEqual(omit(Symbol('sym'), ['a']), {});
  assert.deepEqual(omit(999n, ['a']), {});
});

test('omit: handles empty or invalid keys arguments safely', () => {
  const source = { a: 1, b: 2 };
  assert.deepEqual(omit(source, null), { a: 1, b: 2 });
  assert.deepEqual(omit(source, undefined), { a: 1, b: 2 });
  assert.deepEqual(omit(source, []), { a: 1, b: 2 });
});

test('omit: supports nullPrototype option', () => {
  const source = { a: 1, b: 2 };
  const result = omit(source, ['b'], { nullPrototype: true });

  assert.equal(result.a, 1);
  assert.equal(result.b, undefined);
  assert.equal(Object.getPrototypeOf(result), null);
});

test('pickBy and omitBy: filter properties using predicate function', () => {
  const source = { a: 1, b: 2, c: 3, d: 4 };

  const pickedEven = pickBy(source, (val) => val % 2 === 0);
  assert.deepEqual(pickedEven, { b: 2, d: 4 });

  const omittedEven = omitBy(source, (val) => val % 2 === 0);
  assert.deepEqual(omittedEven, { a: 1, c: 3 });
});

test('pickBy and omitBy: support Symbol keys with predicate', () => {
  const sym = Symbol('weight');
  const source = { a: 10, [sym]: 100 };

  const picked = pickBy(source, (val) => val >= 50);
  assert.equal(picked[sym], 100);
  assert.equal(picked.a, undefined);

  const omitted = omitBy(source, (val) => val >= 50);
  assert.equal(omitted.a, 10);
  assert.equal(omitted[sym], undefined);
});

test('options validation: invalid options throw TypeError', () => {
  assert.throws(() => pick({ a: 1 }, ['a'], null), TypeError);
  assert.throws(() => pick({ a: 1 }, ['a'], 'invalid'), TypeError);
  assert.throws(() => omit({ a: 1 }, ['a'], 123), TypeError);
  assert.throws(() => pickBy({ a: 1 }, 'notAFunction'), TypeError);
  assert.throws(() => omitBy({ a: 1 }, null), TypeError);
});
