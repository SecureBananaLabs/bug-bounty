import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { invert } from '../utils/invert.js';
import defaultInvert from '../utils/invert.js';

describe('invert utility', () => {
  it('exports invert as named export and default export', () => {
    assert.strictEqual(typeof invert, 'function');
    assert.strictEqual(typeof defaultInvert, 'function');
    assert.strictEqual(invert, defaultInvert);
    assert.strictEqual(invert.invert, invert);
  });

  it('inverts simple key-value mappings', () => {
    const input = { a: 'apple', b: 'banana', c: 'cherry' };
    const expected = { apple: 'a', banana: 'b', cherry: 'c' };
    assert.deepStrictEqual(invert(input), expected);
  });

  it('coerces numeric and boolean values to string keys', () => {
    const input = { a: 1, b: 2, c: true, d: false, e: null, f: undefined };
    const result = invert(input);
    assert.strictEqual(result['1'], 'a');
    assert.strictEqual(result['2'], 'b');
    assert.strictEqual(result['true'], 'c');
    assert.strictEqual(result['false'], 'd');
    assert.strictEqual(result['null'], 'e');
    assert.strictEqual(result['undefined'], 'f');
  });

  it('safely handles non-object and empty inputs', () => {
    assert.deepStrictEqual(invert(null), {});
    assert.deepStrictEqual(invert(undefined), {});
    assert.deepStrictEqual(invert(42), {});
    assert.deepStrictEqual(invert('string'), {});
    assert.deepStrictEqual(invert(true), {});
    assert.deepStrictEqual(invert(Symbol('test')), {});
    assert.deepStrictEqual(invert({}), {});
  });

  it('supports nullPrototype option', () => {
    const res = invert({ a: 'x' }, { nullPrototype: true });
    assert.strictEqual(Object.getPrototypeOf(res), null);
    assert.strictEqual(res.x, 'a');

    const emptyRes = invert(null, { nullPrototype: true });
    assert.strictEqual(Object.getPrototypeOf(emptyRes), null);
  });

  it('defends against prototype pollution (CWE-1321) by skipping dangerous keys by default', () => {
    const malicious = {
      p1: '__proto__',
      p2: 'constructor',
      p3: 'prototype',
      safe: 'validKey'
    };

    const beforeProto = Object.prototype.polluted;
    const res = invert(malicious);

    assert.strictEqual(res.validKey, 'safe');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(res, '__proto__'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(res, 'constructor'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(res, 'prototype'), false);
    assert.strictEqual(Object.prototype.polluted, beforeProto);
    assert.strictEqual({}.polluted, undefined);
  });

  it('throws on dangerous keys when dangerAction is "throw"', () => {
    assert.throws(
      () => invert({ a: '__proto__' }, { dangerAction: 'throw' }),
      /Disallowed dangerous prototype key/
    );
    assert.throws(
      () => invert({ a: 'constructor' }, { dangerAction: 'throw' }),
      /Disallowed dangerous prototype key/
    );
    assert.throws(
      () => invert({ a: 'prototype' }, { dangerAction: 'throw' }),
      /Disallowed dangerous prototype key/
    );
  });

  it('resolves collisions using overwrite strategy by default', () => {
    const input = { a: 'same', b: 'same', c: 'different' };
    const result = invert(input);
    assert.strictEqual(result.same, 'b');
    assert.strictEqual(result.different, 'c');
  });

  it('resolves collisions using group strategy', () => {
    const input = { a: 'same', b: 'same', c: 'different', d: 'same' };
    const result = invert(input, { collisionStrategy: 'group' });
    assert.deepStrictEqual(result.same, ['a', 'b', 'd']);
    assert.deepStrictEqual(result.different, ['c']);
  });

  it('throws on collisions when collisionStrategy is "error"', () => {
    const input = { a: 'dup', b: 'dup' };
    assert.throws(
      () => invert(input, { collisionStrategy: 'error' }),
      /Collision detected for inverted key: dup/
    );
  });

  it('supports Symbol keys and Symbol values', () => {
    const symKey = Symbol('symKey');
    const symVal = Symbol('symVal');

    const input = {
      [symKey]: 'stringValue',
      regularKey: symVal,
    };

    const result = invert(input);
    assert.strictEqual(result.stringValue, symKey);
    assert.strictEqual(result[symVal], 'regularKey');
  });

  it('omits Symbols when includeSymbols is false', () => {
    const symKey = Symbol('symKey');
    const symVal = Symbol('symVal');

    const input = {
      [symKey]: 'stringValue',
      regularKey: symVal,
      normal: 'ok',
    };

    const result = invert(input, { includeSymbols: false });
    assert.strictEqual(result.ok, 'normal');
    assert.strictEqual(result.stringValue, undefined);
    assert.strictEqual(result[symVal], undefined);
  });

  it('validates options arguments and throws on invalid configuration', () => {
    assert.throws(() => invert({ a: 1 }, null), TypeError);
    assert.throws(() => invert({ a: 1 }, 'invalid'), TypeError);
    assert.throws(() => invert({ a: 1 }, { collisionStrategy: 'invalid' }), TypeError);
    assert.throws(() => invert({ a: 1 }, { dangerAction: 'invalid' }), TypeError);
  });

  it('only inverts own enumerable properties and ignores prototype inheritance', () => {
    const proto = { inherited: 'shouldNotBeInverted' };
    const obj = Object.create(proto);
    obj.own = 'ownValue';

    const result = invert(obj);
    assert.strictEqual(result.ownValue, 'own');
    assert.strictEqual(result.shouldNotBeInverted, undefined);
  });
});
